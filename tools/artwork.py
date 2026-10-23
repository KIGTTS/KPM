"""Validate static SVG artwork before copying it into a public site."""
import re
import xml.etree.ElementTree as ET


def white_line_svg(data):
    root = ET.fromstring(data)
    white = {"white", "#fff", "#ffffff"}
    if root.get("fill", "").lower() not in white: return False
    return all(value.lower() in white | {"none"} for node in root.iter()
               for key, value in node.attrib.items() if key in {"fill", "stroke", "stop-color"})


def validate_svg(data):
    if len(data) > 512 * 1024 or re.search(br"<!\s*(DOCTYPE|ENTITY)", data, re.I):
        raise ValueError("SVG is too large or contains a document/entity declaration")
    try:
        root = ET.fromstring(data)
    except ET.ParseError as error:
        raise ValueError("Malformed SVG artwork") from error
    allowed = {"svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "clipPath", "linearGradient", "radialGradient", "stop", "title", "desc"}
    local = lambda value: value.rsplit("}", 1)[-1]
    if local(root.tag) != "svg": raise ValueError("Not SVG artwork")
    ids = {}; refs = {}; count = 0
    def visit(node, depth):
        nonlocal count
        count += 1
        if depth > 32 or count > 2000 or local(node.tag) not in allowed:
            raise ValueError("Unsupported or excessive SVG elements")
        if "id" in node.attrib:
            name = node.attrib["id"]
            if not re.fullmatch(r"[A-Za-z0-9_.:-]{1,128}", name) or name in ids: raise ValueError("Invalid SVG id")
            ids[name] = node
        refs[node] = []
        for name, value in node.attrib.items():
            name = local(name).lower()
            if name.startswith("on") or name in {"style", "href"} or re.search(r"https?:|file:|data:|javascript:|@import", value, re.I):
                raise ValueError("SVG artwork must contain local vector shapes only")
            for match in re.finditer(r"url\(\s*([^)]+)\)", value, re.I):
                ref = match[1].strip(" '\"")
                if not ref.startswith("#"): raise ValueError("External SVG reference")
                refs[node].append(ref[1:])
        for child in node: visit(child, depth + 1)
    visit(root, 0)
    colors = {}
    def check(node, depth):
        if depth > 64 or colors.get(node) == 1: raise ValueError("Recursive SVG reference")
        if colors.get(node) == 2: return
        colors[node] = 1
        for name in refs[node]:
            if name not in ids: raise ValueError("Missing SVG reference")
            check(ids[name], depth + 1)
        for child in node: check(child, depth + 1)
        colors[node] = 2
    for node in refs: check(node, 0)
