"""Create the public source bundle. Run from the project root with Python 3."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / 'public' / 'brandique-source.zip'
files = [root / name for name in ('package.json', 'package-lock.json', 'index.html', 'vite.config.js', '.gitignore', 'README.md', 'LICENSE', 'CONTRIBUTING.md')]
for directory in ('src', 'tests', 'scripts', 'licenses', 'public'):
    files.extend(p for p in (root / directory).rglob('*') if p.is_file() and p != output)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(set(files)):
        archive.write(file, Path('brandique-design-studio') / file.relative_to(root))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert all('.openai/' not in name and '.git/' not in name for name in archive.namelist())
print(f'Created source archive: {output.name} ({output.stat().st_size:,} bytes)')
