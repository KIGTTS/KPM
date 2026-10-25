import json
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parent.parent

@unittest.skipUnless(shutil.which("node"), "Node required for color algorithm verification")
class ThemeTest(unittest.TestCase):
    def test_material_roles_follow_seed_for_both_schemes(self):
        code = """import {themeTokens} from './web/theme.js';
        const purple=themeTokens('#6750a4'), green=themeTokens('#008577');
        let rejected=false;try{themeTokens('red; background:url(x)')}catch{rejected=true}
        console.log(JSON.stringify({purple,green,rejected}));"""
        value = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))
        self.assertTrue(value["rejected"])
        self.assertEqual("#6750a4", value["purple"]["light"]["--primary"])
        for scheme in ("light", "dark"):
            self.assertGreater(len(value["purple"][scheme]), 30)
            self.assertNotEqual(value["purple"][scheme]["--primary"], value["green"][scheme]["--primary"])
            self.assertNotEqual(value["purple"][scheme]["--text"], value["purple"][scheme]["--bg"])
        self.assertNotEqual(value["purple"]["light"]["--bg"], value["purple"]["dark"]["--bg"])
