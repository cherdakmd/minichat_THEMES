# -*- coding: utf-8 -*-
"""Сборка ZIP-архивов релиза: отдельная тема на архив + общий + SHA256SUMS.

Используется в .github/workflows/release.yml (на GitHub-раннере ассеты
прикладываются к релизу штатно). Локально: python3 .github/scripts/build_release.py --out dist
"""
import argparse
import hashlib
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def theme_dirs():
    dirs = sorted(d for d in os.listdir(ROOT)
                  if os.path.isdir(os.path.join(ROOT, d))
                  and os.path.exists(os.path.join(ROOT, d, 'manifest.json')))
    return dirs


def add_folder(zf, folder):
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, folder)):
        dirnames[:] = [d for d in dirnames if d != '__pycache__']
        for fn in sorted(filenames):
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, ROOT)
            zf.write(full, rel)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='dist')
    ap.add_argument('--tag', default=None, help='тег для ссылок в заметках (по умолчанию из GITHUB_REF_NAME)')
    args = ap.parse_args()

    out = os.path.join(ROOT, args.out)
    os.makedirs(out, exist_ok=True)

    themes = theme_dirs()
    zips = []

    for t in themes:
        path = os.path.join(out, f'Minichat-Theme-{t}.zip')
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            add_folder(zf, t)
        zips.append(path)

    all_path = os.path.join(out, 'Minichat-THEMES-all.zip')
    with zipfile.ZipFile(all_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for t in themes:
            add_folder(zf, t)
        for extra in ('README.md', 'LICENSE', 'CHANGELOG.md'):
            p = os.path.join(ROOT, extra)
            if os.path.exists(p):
                zf.write(p, extra)
    zips.append(all_path)

    sums_path = os.path.join(out, 'SHA256SUMS.txt')
    with open(sums_path, 'w', newline='\n') as f:
        for path in sorted(zips, key=os.path.basename):
            f.write(f'{sha256(path)}  {os.path.basename(path)}\n')

    tag = args.tag or os.environ.get('GITHUB_REF_NAME') or 'latest'
    base = f'https://github.com/{os.environ.get("GITHUB_REPOSITORY", "cherdakmd/minichat_THEMES")}/releases/download/{tag}'
    rows = []
    for path in sorted(zips, key=os.path.basename):
        name = os.path.basename(path)
        rows.append(f'| [`{name}`]({base}/{name}) | {"все темы + README" if "all" in name else name.replace("Minichat-Theme-", "").replace(".zip", "")} |')
    notes = (
        '## 📦 Скачать\n\n| Архив | Тема |\n|---|---|\n' + '\n'.join(rows) +
        '\n\nSHA-256 — в приложенном `SHA256SUMS.txt`.\n\n'
        '## 🚀 Установка\n\n'
        '1. Скачай ZIP нужной темы (или общий архив) и распакуй.\n'
        '2. Папку темы скопируй в каталог **Themes** программы Minichat.\n'
        "3. Перезапусти Minichat → выбери тему в настройках оверлея → добавь Browser Source в OBS/Streamlabs.\n")
    with open(os.path.join(out, 'RELEASE_NOTES.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(notes)

    print('Готово:')
    for path in sorted(zips, key=os.path.basename):
        print(f'  {os.path.basename(path)}  {os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    main()
