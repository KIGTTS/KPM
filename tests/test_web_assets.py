from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'tools'))
from web_assets import version_assets


class WebAssetsTest(unittest.TestCase):
    def test_local_imports_and_styles_change_together_without_rewriting_external_links(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'index.html').write_text('<link href="styles.css"><script src="app.js"></script><a href="https://example.com/">source</a>')
            (root / 'app.js').write_text("import {node} from './data.js'; fetch('site.json');")
            (root / 'data.js').write_text('export const node = 1;')
            (root / 'styles.css').write_text('@import url("fonts.css");')
            version = version_assets(root)
            self.assertIn(f'styles.css?v={version}', (root / 'index.html').read_text())
            self.assertIn(f'./data.js?v={version}', (root / 'app.js').read_text())
            self.assertIn(f'fonts.css?v={version}', (root / 'styles.css').read_text())
            self.assertIn('https://example.com/', (root / 'index.html').read_text())
            self.assertIn("fetch('site.json')", (root / 'app.js').read_text())
