"""Version local web assets while keeping mirrors and subdirectory hosting portable."""
import hashlib
import re


def version_assets(folder):
    assets = sorted(path for path in folder.rglob('*') if path.suffix in ('.js', '.css'))
    digest = hashlib.sha256()
    for path in assets:
        digest.update(path.relative_to(folder).as_posix().encode())
        digest.update(path.read_bytes())
    version = digest.hexdigest()[:12]
    # Only self-hosted JS/CSS references; leave source links and catalog URLs intact.
    pattern = re.compile(r'([\"\x27])((?:\./)?[a-zA-Z0-9_./-]+\.(?:js|css))\1')
    for path in [folder / 'index.html', *assets]:
        content = path.read_text(encoding='utf-8')
        content = pattern.sub(lambda match: f'{match[1]}{match[2]}?v={version}{match[1]}', content)
        path.write_text(content, encoding='utf-8')
    return version
