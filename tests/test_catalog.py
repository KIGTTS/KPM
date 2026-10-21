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


class CatalogTest(unittest.TestCase):
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

    def test_urls_reject_credentials_and_downgrades(self):
        for value in ["http://example.com", "https://user:password@example.com", "https://example.com/#fragment"]:
            with self.assertRaises(ValueError): https(value)

    def test_svg_is_not_trusted_as_catalog_artwork(self):
        with self.assertRaises(ValueError): bitmap_suffix(b"<svg onload=alert(1)>")
        self.assertEqual(".png", bitmap_suffix(b"\x89PNG\r\n\x1a\n"))

    def test_declared_snapshot_keeps_site_available_but_never_switches_source_identity(self):
        config = json.loads((ROOT / "source.json").read_text(encoding="utf-8"))
        with TemporaryDirectory() as folder, patch("build.fetch", side_effect=requests.ConnectionError("offline")):
            build(config, Path(folder))
            site = json.loads((Path(folder) / "site.json").read_text(encoding="utf-8"))
            self.assertTrue(site["savedCatalog"])
            self.assertEqual("kigtts.official", site["catalog"]["id"])
            self.assertIn("KIGTTSNEXT-api14", site["downloadURL"])
            with self.assertRaises(ValueError): build(dict(config, expectedSourceId="different.source"), Path(folder))


if __name__ == "__main__": unittest.main()
