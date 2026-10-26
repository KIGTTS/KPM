"""Build a self-contained GitHub Pages site from a KPM schema-1 catalog."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import time
import requests
from urllib.parse import urlsplit, urljoin, quote

import jsonschema
import qrcode

ROOT = Path(__file__).resolve().parent.parent
SYMBOL_COMMIT = "49d4db35df873165d6bd6ba09b063c7dafbac2f4"


def https(value):
    url = urlsplit(value)
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.fragment or len(value) > 2048:
        raise ValueError("Expected an HTTPS URL without credentials or fragment")
    return value


def fetch(url, maximum):
    for _ in range(6):
        https(url)
        with requests.get(url, headers={"User-Agent": "KPM-static-builder/1.0"},
                          timeout=(20, 60), allow_redirects=False, stream=True) as response:
            if response.status_code in (301, 302, 303, 307, 308):
                url = urljoin(url, response.headers["Location"])
                continue
            response.raise_for_status()
            chunks = []; size = 0
            for block in response.iter_content(65536):
                size += len(block)
                if size > maximum: raise ValueError("Download exceeded its byte limit")
                chunks.append(block)
            return b"".join(chunks)
    raise ValueError("Too many HTTPS redirects")


def fresh(url):
    return url + ("&" if "?" in url else "?") + "kpm_build=" + str(time.time_ns())


def validate(catalog):
    schema = json.loads((ROOT / "schema/catalog.schema.json").read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(schema).validate(catalog)
    assets = catalog.get("assets", {})
    if sum(image["bytes"] for image in assets.values()) > 64 * 1024 * 1024:
        raise ValueError("Artwork exceeds 64 MiB")
    def icon(value):
        if value.get("image") and value["image"] not in assets:
            raise ValueError("Icon references an unregistered asset")
    icon(catalog.get("icon", {}))
    ids = set()
    for item in catalog["packages"]:
        resource = item.get("resourceType") is not None
        if catalog.get("kind") == "RESOURCES" and not resource:
            raise ValueError("Resource sources only contain resources")
        if item["id"] in ids:
            raise ValueError("Duplicate package ID")
        ids.add(item["id"])
        icon(item.get("icon", {}))
        if any(asset not in assets for asset in item.get("thumbnails", [])):
            raise ValueError("Thumbnail references an unregistered asset")
        if len({x["version"] for x in item["releases"]}) != len(item["releases"]) or len({x["versionCode"] for x in item["releases"]}) != len(item["releases"]):
            raise ValueError("Duplicate package version")
        for release in item["releases"]:
            if (release["format"] == "RESOURCE") != resource:
                raise ValueError("Resource format and category must agree")
            if set(release.get("permissionPurposes", {})) - set(release.get("permissions", [])):
                raise ValueError("Permission purposes must refer to declared permissions")
            for mirror in release["mirrors"]:
                https(mirror["url"])
            if release["format"] == "LUA" and "runtime.lua" not in release.get("dependencies", {}):
                raise ValueError("Lua requires runtime.lua")
    for image in assets.values():
        https(image["url"])


def bitmap_suffix(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data.lstrip(b"\xef\xbb\xbf \r\n\t").startswith((b"<svg", b"<?xml", b"<!--")):
        from artwork import validate_svg
        validate_svg(data)
        return ".svg"
    raise ValueError("Only PNG, JPEG, WebP and static SVG artwork is supported")


def build(config, output, offline=False):
    theme_color = config.get("themeColor", "#00696e")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", theme_color):
        raise ValueError("themeColor must be #RRGGBB")
    source_url = https(config["sourceUrl"])
    saved = False
    path = (ROOT / config["catalogPath"]).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError("Local catalog must remain inside this project")
    if config.get("upstream") and not offline:
        try:
            raw = fetch(fresh(config["upstream"]), 4 * 1024 * 1024)
            json.loads(raw)
        except (requests.RequestException, json.JSONDecodeError, UnicodeDecodeError):
            raw = path.read_bytes()
            saved = True
            print("Upstream temporarily unavailable; using the explicitly configured catalog snapshot", flush=True)
    else:
        raw = path.read_bytes()
        saved = bool(config.get("upstream"))
    if len(raw) > 4 * 1024 * 1024:
        raise ValueError("Catalog exceeds 4 MiB")
    catalog = json.loads(raw)
    validate(catalog)
    # A mutable branch URL can briefly lag behind a just-published, verified snapshot.
    if config.get("upstream") and path.is_file():
        snapshot = json.loads(path.read_text(encoding="utf-8"))
        if snapshot.get("id") == catalog["id"] and snapshot.get("updatedAt", "") > catalog.get("updatedAt", ""):
            validate(snapshot)
            catalog = snapshot
            raw = path.read_bytes()
            saved = True
    if config.get("expectedSourceId") and config["expectedSourceId"] != catalog["id"]:
        raise ValueError("Catalog source ID differs from the configured source")
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / "web", output, dirs_exist_ok=True)
    # Keep static hosting caches useful without mixing controls from two releases.
    from web_assets import version_assets
    version_assets(output)
    shutil.copytree(ROOT / "schema", output / "schema", dirs_exist_ok=True)
    for name in ("LICENSE", "DEPLOY.md"):
        shutil.copyfile(ROOT / name, output / name)
    (output / ".nojekyll").write_text("", encoding="utf-8")
    (output / "index.json").write_bytes(raw)
    art = {}; monochrome_art = []
    cache = ROOT / ".cache"
    cache.mkdir(exist_ok=True)
    for asset_id, image in catalog.get("assets", {}).items():
        target = cache / image["sha256"]
        data = target.read_bytes() if target.is_file() else b""
        if len(data) != image["bytes"] or hashlib.sha256(data).hexdigest() != image["sha256"]:
            if offline: raise FileNotFoundError("Artwork is not cached; run an online build first")
            data = fetch(image["url"], image["bytes"])
        if len(data) != image["bytes"] or hashlib.sha256(data).hexdigest() != image["sha256"]:
            raise ValueError("Artwork size/hash mismatch: " + asset_id)
        suffix = bitmap_suffix(data)
        if suffix == ".svg":
            from artwork import white_line_svg
            if white_line_svg(data): monochrome_art.append(asset_id)
        target.write_bytes(data)
        path = "art/" + image["sha256"] + suffix
        (output / "art").mkdir(exist_ok=True)
        (output / path).write_bytes(data)
        art[asset_id] = path
    symbols = {"extension", "inventory_2", "contrast", "add_link", "arrow_outward", "content_copy", "search", "close", "arrow_forward"}
    for value in [catalog, *catalog["packages"]]:
        if value.get("icon", {}).get("symbol"):
            symbols.add(value["icon"]["symbol"])
    (output / "symbols").mkdir(exist_ok=True)
    for name in symbols:
        if not re.fullmatch(r"[a-z0-9_]{1,80}", name):
            raise ValueError("Invalid symbol name")
        target = cache / (name + ".svg")
        if (output / "symbols" / (name + ".svg")).is_file():
            continue
        if not target.is_file():
            if offline: raise FileNotFoundError("Symbol is not cached; run an online build first")
            target.write_bytes(fetch(f"https://cdn.jsdelivr.net/gh/google/material-design-icons@{SYMBOL_COMMIT}/symbols/web/{name}/materialsymbolsrounded/{name}_24px.svg", 65536))
        shutil.copyfile(target, output / "symbols" / (name + ".svg"))
    download = ""
    if config.get("downloadMetadata"):
        try:
            if (saved or offline) and config.get("downloadMetadataPath"):
                raise requests.ConnectionError("Use the matching saved download metadata")
            metadata = json.loads(fetch(fresh(config["downloadMetadata"]), 65536))
        except (requests.RequestException, json.JSONDecodeError, UnicodeDecodeError):
            fallback = config.get("downloadMetadataPath")
            if not fallback:
                raise
            local = (ROOT / fallback).resolve()
            if not local.is_relative_to(ROOT):
                raise ValueError("Download metadata must remain inside this project")
            metadata = json.loads(local.read_text(encoding="utf-8"))
        base = config["downloadMetadata"].split("android/release.json")[0]
        path = metadata["path"]
        if not re.fullmatch(r"android/[a-zA-Z0-9._-]+\.apk", path):
            raise ValueError("Unexpected Android artifact path")
        download = https(urljoin(base, path)) + "?view=false"
    site = dict(catalog=catalog, art=art, monochromeArt=monochrome_art, themeColor=theme_color, sourceUrl=source_url, publisher=config.get("publisher", ""), savedCatalog=saved,
                repository=https(config["repository"]), downloadURL=download)
    (output / "site.json").write_text(json.dumps(site, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=5, border=2)
    qr.add_data("kigtts://source/add?url=" + quote(source_url, safe=""))
    qr.make(fit=True)
    qr.make_image(fill_color="#123d40", back_color="white").save(output / "add-source.png")
    print(f"Built {len(catalog['packages'])} packages, {len(art)} images -> {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default="source.json")
    parser.add_argument("--output", default="dist")
    parser.add_argument("--offline", action="store_true", help="Use configured snapshots and local cached artwork only")
    args = parser.parse_args()
    build(json.loads((ROOT / args.config).read_text(encoding="utf-8")), (ROOT / args.output).resolve(), args.offline)
