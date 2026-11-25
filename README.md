# minichat_THEMES

Коллекция тем-оверлеев для программы **Minichat**.

Каждая папка в корне репозитория — отдельная тема. Скопируйте папку темы в
каталог `Themes` программы Minichat — и тема появится в списке.

## Темы

| Тема | Папка | Стиль |
|---|---|---|
| Матрица | `Matrix/` | Зелёный терминал, эффект печатной машинки, фон «цифровой дождь» |
| Аркада | `Arcade/` | Пиксельная игра 80-х: Press Start 2P, score-бар, INSERT COIN |
| Windows 95 | `Windows95/` | Ретро-окно с заголовком и часами в трее |
| Неон | `Neon/` | Карточки «стекло/неоновая рамка», градиентные имена, свечение |
| Вейпорвейв | `Vaporwave/` | Неоновая сетка, солнце, розово-циановые градиенты |
| Комикс | `Comic/` | Речевые пузыри с обводкой, точки-растр |
| Minecraft | `Minecraft/` | Строки чата как в игре, пиксельная тень текста |
| DOS | `Dos/` | Оригинальная тема (эталон формата) |

## Структура темы

```
ИмяТемы/
├── manifest.json        # название, иконка и свойства (настройки в UI Minichat)
├── Localization/
│   └── en.lng           # английские подписи свойств
├── index.html           # Vue 3 шаблон оверлея
├── style.css            # стили темы
├── icon.svg             # иконка в списке тем
├── template.js          # логика темы (вычисляемые поля, эффекты)
└── fonts/               # шрифты + fonts.css (@font-face)
```

Для тем с эффектом набора текста (Matrix, Arcade) дополнительно копируются
`typed.umd.js`, `components.js` и `vue-typed-js.css` из темы Dos.

### manifest.json

`Language.Culture` — язык подписей по умолчанию (`ru-RU`). Типы свойств:
`Slider`, `Text`, `Toggle`, `Color`, `Font`, `Select` (с списком `Enumerate`).
Значения свойств Minichat подставляет в шаблон как переменные
(`TextSize`, `Color`, `ShowAvatars`, ... — см. любую тему).

Общие свойства: скрытие сообщений по таймеру, лимит сообщений, текст
удалённых сообщений, эффекты появления/исчезновения (animate.css), размер
текста, шрифт, цвета, аватары, значки, иконки сервисов, Live-события.

### Контракт шаблона

Тема использует глобальные переменные, которые предоставляет Minichat:
`Messages` (массив сообщений: `GUID`, `Service`, `Avatar.Default`,
`badges`, `UserName`, `Color`, `Reply`, `Meta.Highlighted`, `isDeleted`,
текст), методы `NoAvatar()` и `FormattedMessage()`, плюс значения свойств
из `manifest.json`. Собственные вычисляемые поля темы добавляются через
`app.mixin({ ... })` в `template.js`.

## Превью в браузере

Репозиторий содержит страницу-галерею с имитацией чата (демо-лента
сообщений, донаты, Live-события, кнопки паузы/скорости, смена фона для
проверки читаемости):

```bash
python3 preview/serve.py        # http://localhost:8123/preview/index.html
```

`preview/stubs/` — заглушки `Additions/widget.js` (имитация сообщений),
`animate.css`, `vue.global.js` и иконки сервисов. Они нужны **только для
превью**: в самом Minichat используются одноимённые файлы программы,
копировать `preview/stubs` в Minichat не нужно.

## Шрифты (лицензии)

Все шрифты распространяются свободно:

- **FSEX300** (FixedSys Excelsior, тема DOS и Matrix) — свободный шрифт из комплекта Dos;
- **Press Start 2P**, **Play**, **Russo One**, **Balsamiq Sans**, **Pixelify Sans**, **Audiowide** — [SIL OFL](https://fonts.google.com) (пакеты @fontsource);
- **W95FA** — SIL OFL (FontsArena, recreate шрифта Windows 95);
- **Monocraft** — SIL OFL ([github.com/IdreesInc/Monocraft](https://github.com/IdreesInc/Monocraft)).

Шрифты подключены с `unicode-range`, кириллица поддерживается
(W95FA — латиница, для кириллицы подставляется Pixelify Sans / системный шрифт).
