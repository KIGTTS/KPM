import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from build import bitmap_suffix


class ArtworkTests(unittest.TestCase):
    def test_static_vector(self):
        self.assertEqual(".svg", bitmap_suffix(b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0Z" fill="#176c71"/></svg>'))

    def test_active_external_and_recursive_vectors_rejected(self):
        for body in ('<script>alert(1)</script>', '<image href="https://example.invalid/test.png"/>', '<g onclick="run()"/>', '<defs><clipPath id="loop"><g clip-path="url(#loop)"/></clipPath></defs>'):
            with self.subTest(body=body), self.assertRaises(ValueError):
                bitmap_suffix(('<svg xmlns="http://www.w3.org/2000/svg">' + body + '</svg>').encode())
