# -*- coding: utf-8 -*-
"""Валидация тем Minichat: JSON, парность ru/en, обязательные поля, синтаксис JS."""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REQUIRED_MANIFEST = ['Icon', 'Language', 'Name', 'Properties']
REQUIRED_TOP_PROPS = ['HideMessages', 'MaxMessages', 'DeleteMessageText', 'TextSize',
                      'Color', 'ShowServiceIcons', 'ShowAvatars', 'ShowBadges']
REQUIRED_INDEX_REFS = ['Additions/animate.css', 'Additions/vue.global.js', 'Additions/widget.js']

errors = []
theme_dirs = sorted(d for d in os.listdir(ROOT)
                    if os.path.isdir(os.path.join(ROOT, d))
                    and os.path.exists(os.path.join(ROOT, d, 'manifest.json'))
                    and d != 'preview')

if not theme_dirs:
    errors.append('не найдено ни одной темы')

for t in theme_dirs:
    tdir = os.path.join(ROOT, t)

    # manifest.json
    try:
        m = json.load(open(os.path.join(tdir, 'manifest.json'), encoding='utf-8'))
    except Exception as e:
        errors.append(f'{t}/manifest.json: битый JSON ({e})')
        continue
    for k in REQUIRED_MANIFEST:
        if k not in m:
            errors.append(f'{t}/manifest.json: нет ключа {k}')
    for k in REQUIRED_TOP_PROPS:
        if k not in m.get('Properties', {}):
            errors.append(f'{t}/manifest.json: нет свойства {k}')
    icon = m.get('Icon')
    if icon and not os.path.exists(os.path.join(tdir, icon)):
        errors.append(f'{t}: иконка {icon} не найдена')

    # en.lng
    en_path = os.path.join(tdir, 'Localization', 'en.lng')
    if not os.path.exists(en_path):
        errors.append(f'{t}: нет Localization/en.lng')
    else:
        try:
            e = json.load(open(en_path, encoding='utf-8'))
            ru_keys = set(m.get('Properties', {}))
            en_keys = set(e.get('Properties', {}))
            missing = ru_keys - en_keys
            extra = en_keys - ru_keys
            if missing:
                errors.append(f'{t}/en.lng: нет переводов для {sorted(missing)}')
            if extra:
                errors.append(f'{t}/en.lng: лишние ключи {sorted(extra)}')
            if e.get('Name') != m.get('Name') and e.get('Name') is None:
                errors.append(f'{t}/en.lng: нет Name')
        except Exception as ex:
            errors.append(f'{t}/en.lng: битый JSON ({ex})')

    # index.html
    idx_path = os.path.join(tdir, 'index.html')
    if not os.path.exists(idx_path):
        errors.append(f'{t}: нет index.html')
    else:
        html = open(idx_path, encoding='utf-8').read()
        for ref in REQUIRED_INDEX_REFS:
            if ref not in html:
                errors.append(f'{t}/index.html: не подключен {ref}')
        if 'v-for' not in html or 'Messages' not in html:
            errors.append(f'{t}/index.html: не похоже на шаблон чата (v-for/Messages)')

    # JS-синтаксис
    for js in ['template.js', 'effects.js']:
        jp = os.path.join(tdir, js)
        if os.path.exists(jp):
            r = subprocess.run(['node', '--check', jp], capture_output=True, text=True)
            if r.returncode != 0:
                errors.append(f'{t}/{js}: синтаксическая ошибка\n{r.stderr[:400]}')

    # CRLF в JSON (формат Minichat)
    for j in ['manifest.json', 'Localization/en.lng']:
        jp = os.path.join(tdir, j)
        if os.path.exists(jp):
            raw = open(jp, 'rb').read()
            if b'\r\n' not in raw:
                errors.append(f'{t}/{j}: нет CRLF переводов строк (формат Minichat)')

if errors:
    print('ОШИБКИ ВАЛИДАЦИИ:')
    for e in errors:
        print(' ✗', e)
    sys.exit(1)

print(f'OK: {len(theme_dirs)} тем прошли валидацию: {", ".join(theme_dirs)}')
