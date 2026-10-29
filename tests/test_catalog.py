import copy
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from tempfile import TemporaryDirectory
import requests
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))
from build import validate, https, bitmap_suffix, build, ROOT
from build_fixture import cached_source


class CatalogTest(unittest.TestCase):
    def test_monochrome_icon_registration_requires_a_real_image_reference(self):
        value = self.catalog()
        value.update(icon=dict(image="glyph", monochrome=True), assets={"glyph": dict(
            url="https://example.com/glyph", sha256="a" * 64, bytes=256)})
        validate(value)
        for invalid in (dict(monochrome=True), dict(symbol="extension", monochrome=True),
                        dict(image="glyph", monochrome="true")):
            value["icon"] = invalid
            with self.assertRaises(Exception): validate(value)

    def test_registered_monochrome_svg_is_themed_even_when_paths_are_black(self):
        import hashlib
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        with cached_source(ROOT) as root, TemporaryDirectory() as folder:
            path = root / config["catalogPath"]
            value = json.loads(path.read_text(encoding="utf-8"))
            svg = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>'
            digest = hashlib.sha256(svg).hexdigest()
            value["assets"]["themed"] = dict(url="https://example.com/art", sha256=digest, bytes=len(svg))
            value["icon"] = dict(image="themed", monochrome=True)
            path.write_text(json.dumps(value), encoding="utf-8")
            (root / ".cache" / digest).write_bytes(svg)
            build(config, Path(folder), offline=True)
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            self.assertIn("themed", site["monochromeArt"])
            self.assertTrue(site["art"]["themed"].endswith(".svg"))

    def catalog(self):
        return dict(schemaVersion=1, id="test.source", name="测试", packages=[])

    def test_old_and_metadata_catalogs(self):
        catalog = self.catalog()
        validate(catalog)
        catalog.update(icon={"symbol": "inventory_2", "image": "cover"}, readme="## 介绍\n\n|A|B|\n|-|-|\n|1|2|",
                       assets={"cover": dict(url="https://example.com/cover.png", sha256="a" * 64, bytes=256, alt="说明")})
        validate(catalog)
        catalog["icon"]["image"] = "missing"
        with self.assertRaises(ValueError): validate(catalog)

    def test_resource_source_requires_data_format_and_explicit_kind(self):
        catalog = json.loads((ROOT / "examples/official-catalog.json").read_text(encoding="utf-8"))
        item = copy.deepcopy(catalog["packages"][0]); item["resourceType"] = "FRAME"
        release = item["releases"][-1]; release.update(format="RESOURCE", apiVersion=29, abis=[], permissions=[], permissionPurposes={})
        item["releases"] = [release]
        source = dict(schemaVersion=2, id="test.resources", name="资源", kind="RESOURCES", packages=[item])
        # Retain registered artwork used by the chosen fixture.
        source["assets"] = catalog.get("assets", {})
        validate(source)
        source["schemaVersion"] = 1
        with self.assertRaises(Exception): validate(source)
        source["schemaVersion"] = 2; release["format"] = "NATIVE"
        with self.assertRaises(Exception): validate(source)

    def test_card_frames_and_source_link_policy(self):
        value = self.catalog()
        value["linkPolicy"] = dict(requireAddition=True, recommendAfterInstall=True)
        validate(value)
        value["linkPolicy"]["requireAddition"] = "true"
        with self.assertRaises(Exception): validate(value)
        catalog = json.loads((ROOT / "examples/official-catalog.json").read_text(encoding="utf-8"))
        item = copy.deepcopy(catalog["packages"][0]); item["resourceType"] = "CARD_FRAME"
        release = item["releases"][-1]; release.update(format="RESOURCE", apiVersion=30, abis=[], permissions=[], permissionPurposes={})
        item["releases"] = [release]
        validate(dict(schemaVersion=2, id="test.frames", name="名片边框", kind="RESOURCES", packages=[item], assets=catalog.get("assets", {})))

    def test_font_resources_use_signed_data_releases(self):
        catalog = json.loads((ROOT / "examples/official-catalog.json").read_text(encoding="utf-8"))
        item = copy.deepcopy(catalog["packages"][0]); item["resourceType"] = "FONT"
        release = item["releases"][-1]; release.update(format="RESOURCE", apiVersion=32, abis=[], permissions=[], permissionPurposes={})
        item["releases"] = [release]
        source = dict(schemaVersion=2, id="test.fonts", name="字体", kind="RESOURCES", packages=[item], assets=catalog.get("assets", {}))
        validate(source)
        release["format"] = "NATIVE"
        with self.assertRaises(Exception): validate(source)

    def test_preview_dimensions_accept_any_aspect_and_require_complete_pair(self):
        value = self.catalog()
        for width,height in ((1,100000),(100000,1),(1080,2400),(2000,2000),(32768,8192)):
            value["assets"] = {"preview":dict(url="https://example.com/preview.png",sha256="a"*64,bytes=300,width=width,height=height)}
            validate(value)
        del value["assets"]["preview"]["height"]
        with self.assertRaises(Exception):validate(value)

    def test_urls_reject_credentials_and_downgrades(self):
        for value in ["http://example.com", "https://user:password@example.com", "https://example.com/#fragment"]:
            with self.assertRaises(ValueError): https(value)

    def test_release_permissions_allow_legacy_unknown_and_require_declared_purposes(self):
        catalog = json.loads((ROOT / "examples/official-catalog.json").read_text(encoding="utf-8"))
        release = catalog["packages"][0]["releases"][0]
        release.pop("permissions", None)
        release.pop("permissionPurposes", None)
        validate(catalog)
        release.update(permissions=["network"], permissionPurposes={"network": "更新插件目录"})
        validate(catalog)
        release["permissionPurposes"]["camera"] = "拍摄照片"
        with self.assertRaises(ValueError): validate(catalog)

    def test_svg_is_not_trusted_as_catalog_artwork(self):
        with self.assertRaises(ValueError): bitmap_suffix(b"<svg onload=alert(1)>")
        self.assertEqual(".png", bitmap_suffix(b"\x89PNG\r\n\x1a\n"))

    def test_declared_snapshot_keeps_site_available_but_never_switches_source_identity(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        with cached_source(ROOT), TemporaryDirectory() as folder, patch("build.fetch", side_effect=requests.ConnectionError("offline")):
            build(config, Path(folder))
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            self.assertTrue(site["savedCatalog"])
            self.assertEqual("kigtts.official", site["catalog"]["id"])
            metadata = json.loads((ROOT / config["downloadMetadataPath"]).read_text(encoding="utf-8"))
            self.assertIn(metadata["path"], site["downloadURL"])
            with self.assertRaises(ValueError): build(dict(config, expectedSourceId="different.source"), Path(folder))

    def test_stale_branch_response_does_not_replace_a_newer_matching_catalog(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        old = json.loads((ROOT / config["catalogPath"]).read_text(encoding="utf-8"))
        old["updatedAt"] = "2000-01-01T00:00:00Z"
        with cached_source(ROOT), TemporaryDirectory() as folder, patch("build.fetch", return_value=json.dumps(old).encode()):
            build(config, Path(folder))
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            self.assertTrue(site["savedCatalog"])
            self.assertNotEqual(old["updatedAt"], site["catalog"]["updatedAt"])

    def test_html_upstream_uses_validated_snapshot(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        with cached_source(ROOT), TemporaryDirectory() as folder, patch("build.fetch", return_value=b"<!doctype html><title>Temporarily unavailable</title>"):
            build(config, Path(folder))
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            self.assertTrue(site["savedCatalog"])
            self.assertEqual(config["expectedSourceId"], site["catalog"]["id"])
            with self.assertRaises(ValueError):
                build(dict(config, expectedSourceId="different.source"), Path(folder))

    def test_html_download_metadata_uses_configured_metadata(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        def response(url, maximum):
            return b"<html>Temporary error</html>" if "android/release.json" in url else raw
        with cached_source(ROOT) as fixture, TemporaryDirectory() as folder, patch("build.fetch", side_effect=response):
            raw = (fixture / config["catalogPath"]).read_bytes()
            build(config, Path(folder))
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            metadata = json.loads((ROOT / config["downloadMetadataPath"]).read_text(encoding="utf-8"))
            self.assertIn(metadata["path"], site["downloadURL"])
            self.assertFalse(site["savedCatalog"])

    def test_offline_bundle_uses_no_network_and_keeps_android_link_and_licenses(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        with cached_source(ROOT), TemporaryDirectory() as folder, patch("build.fetch", side_effect=AssertionError("network used")):
            build(config, Path(folder), offline=True)
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            metadata = json.loads((ROOT / config["downloadMetadataPath"]).read_text(encoding="utf-8"))
            self.assertIn(metadata["path"], site["downloadURL"])
            self.assertTrue((Path(folder) / "fonts/google.woff2").is_file())
            self.assertTrue((Path(folder) / "fonts/SourceHanSans-LICENSE.txt").is_file())
            self.assertTrue((Path(folder) / "LICENSE").is_file())


if __name__ == "__main__": unittest.main()
