"""Create local web fonts from the pinned sources in .cache/fonts/sources.json."""
from pathlib import Path
import io
import json
import re
import hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / ".cache/fonts"
OUTPUT = ROOT / "web/fonts"
OUTPUT.mkdir(parents=True, exist_ok=True)


def ranges(points):
    output = []
    start = previous = None
    for value in sorted(points):
        if previous is None or value != previous + 1:
            if start is not None: output.append((start, previous))
            start = value
        previous = value
    if start is not None: output.append((start, previous))
    return ",".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in output)


def save(font, points, target, rename=False):
    options = subset.Options()
    options.flavor = "woff2"
    options.hinting = False
    if "gvar" in font:
        # Instancing removes empty variation records; subsetting expects a complete glyph map.
        for name in font.getGlyphOrder():
            if name not in font["gvar"].variations: font["gvar"].variations[name] = []
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=points)
    worker.subset(font)
    if rename:
        # Adobe reserves 'Source'; subset binaries use a distinct internal family name.
        instance_names = {getattr(instance, "postscriptNameID", 65535) for instance in font["fvar"].instances} if "fvar" in font else set()
        for record in font["name"].names:
            if record.nameID in (1, 4, 6, 16):
                name = "KPMHan" if record.nameID == 6 else "KPM Han"
                record.string = name.encode(record.getEncoding())
            elif record.nameID in {3, 18, 20, 21, 22, 25} | instance_names:
                value = record.toUnicode().replace("SourceHanSansCN", "KPMHan").replace("Source Han Sans CN", "KPM Han")
                record.string = value.encode(record.getEncoding())
    font.flavor = "woff2"
    font.save(target)


css = []
latin = set(range(0x0250)) | set(range(0x0300, 0x0370)) | set(range(0x1E00, 0x1F00)) | set(range(0x2000, 0x2070)) | set(range(0x20A0, 0x20D0))
for name, style in [("google", "normal"), ("google-italic", "italic")]:
    font = TTFont(SOURCE / (name + ".ttf"))
    instantiateVariableFont(font, {"opsz": 18, "GRAD": 0}, inplace=True)
    save(font, latin, OUTPUT / (name + ".woff2"))
    css.append(f'@font-face{{font-family:"Google Sans";font-style:{style};font-weight:400 700;font-display:swap;src:url("fonts/{name}.woff2") format("woff2");unicode-range:{ranges(latin)}}}')

data = (SOURCE / "han.ttf").read_bytes()
all_points = set(TTFont(io.BytesIO(data)).getBestCmap()) - set(range(0x80))
texts = "".join(path.read_text(encoding="utf-8") for base in [ROOT / "web", ROOT / "examples"]
                for path in base.rglob("*") if path.is_file() and path.suffix in (".html", ".js", ".json"))
common = ({ord(char) for char in texts} | set(range(0x3000, 0x3040)) | set(range(0xFF00, 0xFF66))) & all_points
remainder = sorted(all_points - common)
groups = [common] + [set(remainder[i:i + 1024]) for i in range(0, len(remainder), 1024)]
for index, points in enumerate(groups):
    filename = "han-ui.woff2" if index == 0 else f"han-{index:02}.woff2"
    save(TTFont(io.BytesIO(data)), points, OUTPUT / filename, rename=True)
    css.append(f'@font-face{{font-family:"KPM Han";font-style:normal;font-weight:250 900;font-display:swap;src:url("fonts/{filename}") format("woff2");unicode-range:{ranges(points)}}}')
    print(filename, (OUTPUT / filename).stat().st_size, flush=True)
(ROOT / "web/fonts.css").write_text("\n".join(css) + "\n", encoding="utf-8")
for name in ["GoogleSans-OFL.txt", "GoogleSans-TRADEMARKS.md", "SourceHanSans-LICENSE.txt"]:
    (OUTPUT / name).write_bytes((SOURCE / name).read_bytes())
manifest = json.loads((SOURCE / "sources.json").read_text(encoding="utf-8"))
manifest["webfonts"] = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in OUTPUT.glob("*.woff2")}
manifest["notes"] = "Google Sans: opsz=18, GRAD=0, variable weight. Source Han Sans CN: Unicode subsets, internal derivative family KPM Han. Glyph outlines preserved; hinting removed."
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

# Embed the supplied wordmark's text as Google Sans outlines, so SVG masks need no font fetch.
ns = "http://www.w3.org/2000/svg"
ET.register_namespace("", ns)
logo = ROOT / "web/assets/kpm-logo.svg"
tree = ET.parse(logo)
font = TTFont(SOURCE / "google.ttf")
glyphs = font.getGlyphSet(location={"wght": 700, "opsz": 18, "GRAD": 0})
cmap = font.getBestCmap(); scale = 761.833 / font["head"].unitsPerEm
for group in tree.getroot().iter("{" + ns + "}g"):
    for text in list(group):
        if text.tag != "{" + ns + "}text": continue
        x = float(text.attrib["x"].removesuffix("px")); y = float(text.attrib["y"].removesuffix("px"))
        paths = []
        def run(value, positions=None):
            global x
            for index, char in enumerate(value or ""):
                if positions and index < len(positions): x = positions[index]
                pen = SVGPathPen(glyphs)
                glyph = glyphs[cmap[ord(char)]]
                glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
                paths.append(pen.getCommands())
                x += glyph.width * scale
        run(text.text)
        for span in text:
            run(span.text, [float(value.removesuffix("px")) for value in span.attrib.get("x", "").split()])
            run(span.tail)
        replacement = ET.Element("{" + ns + "}path", {"d": " ".join(paths), "fill": "white"})
        group.insert(list(group).index(text), replacement); group.remove(text)
tree.write(logo, encoding="utf-8", xml_declaration=True)
print("Local fonts and outlined Google Sans wordmark ready", flush=True)
