"""An isolated cached source: tests never depend on a developer's .cache."""
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory
from unittest.mock import patch


@contextmanager
def cached_source(project):
    with TemporaryDirectory() as directory:
        root = Path(directory)
        for name in ("web", "schema", "examples"):
            shutil.copytree(project / name, root / name)
        for name in ("LICENSE", "DEPLOY.md"):
            shutil.copyfile(project / name, root / name)
        cache = root / ".cache"
        cache.mkdir()
        artwork = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M2 2h20v20H2Z"/></svg>'
        digest = hashlib.sha256(artwork).hexdigest()
        catalog_path = root / "examples/official-catalog.json"
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        for asset in catalog.get("assets", {}).values():
            asset.update(sha256=digest, bytes=len(artwork))
        catalog_path.write_text(json.dumps(catalog), encoding="utf-8")
        (cache / digest).write_bytes(artwork)
        with patch("build.ROOT", root):
            yield root
