# Формат темы Minichat

Документ описывает устройство тем-оверлеев в этом репозитории. Эталон — тема `Dos/`.

## Файловая структура

```
ИмяТемы/
├── manifest.json        # обязательный: имя, иконка, свойства (настройки в UI)
├── Localization/
│   └── en.lng           # локализация подписей свойств
├── index.html           # шаблон оверлея (Vue 3 + animate.css)
├── style.css            # стили темы
├── icon.svg             # иконка в списке тем (viewBox ~24×24)
├── template.js          # логика темы: mixin с computed/methods, обёртки GetAction
├── fonts/
│   ├── fonts.css        # @font-face
│   └── *.woff2 / *.ttf  # файлы шрифтов
└── (опционально) typed.umd.js, components.js, vue-typed-js.css
                         # инфраструктура эффекта набора текста — копируется из Dos/
```

Подключаемые внешние скрипты/стили (из `index.html`):

```html
<link href="../../Additions/animate.css" rel="stylesheet">   <!-- animate.css 4.x -->
<link rel="stylesheet" href="../../Additions/base-style.css"> <!-- базовые сбросы Minichat -->
<script src="../../Additions/vue.global.js"></script>         <!-- Vue 3 -->
<script src="../../Additions/widget.js"></script>             <!-- контракт чата -->
```

`../../` — это каталог программы Minichat. Пути рассчитаны на установку темы в `Themes/ИмяТемы/`.

## manifest.json

```json
{
  "Icon": "icon.svg",
  "Language": { "Culture": "ru-RU" },
  "Name": "Неон",
  "Properties": {
    "Glow": {
      "Type": "Slider",
      "Label": "Интенсивность свечения",
      "Value": 7,
      "Min": 0,
      "Max": 10
    }
  }
}
```

- `Name` — отображаемое название темы;
- `Icon` — имя файла иконки в папке темы;
- `Language.Culture` — язык подписей по умолчанию (в репозитории `ru-RU`);
- `Properties` — настройки, которые Minichat покажет в UI и подставит в шаблон
  как переменные с теми же именами (`Glow`, `TextSize`, `ShowAvatars`, ...).

### Типы свойств

| Тип | Поля | Пример |
|---|---|---|
| `Slider` | `Value`, `Min`, `Max`, `Step` | размер текста, скорость |
| `Text` | `Value` | текст удалённого сообщения |
| `Toggle` | `Value: true/false` | показывать аватары |
| `Color` | `Value: "#RRGGBB" или #RRGGBBAA` | цвет текста |
| `Font` | — (выбор шрифта в UI) | «Шрифт» |
| `Select` | `Value`, `Enumerate: [{Value, Label}]` | эффект появления (animate.css) |

Файл пишется в UTF-8, отступ — 2 пробела, переводы строк — CRLF, без завершающего переноса.

### Общие свойства, используемые в темах репозитория

- `HideMessages` — скрывать сообщения через N секунд;
- `MaxMessages` — максимум сообщений в оверлее;
- `DeleteMessageText` — текст удалённого сообщения;
- `ShowEffect` / `HideEffect` — классы animate.css для `<transition-group>`;
- `TextSize`, `Font`, `Color` — оформление текста;
- `ShowServiceIcons`, `ShowAvatars`, `ShowBadges` — иконки/аватары/значки;
- `ColorUserName`, `UseColorUserName` — цвет имени и режим «оригинальный цвет»;
- `ShowLive` — показывать Live-события (подписки и т.п.);
- `DisplayConsoleCursor` — консольный курсор (темы «в терминале»).

### Пакет настроек v1.1 (есть во всех темах репозитория)

| Свойство | Тип | Что делает |
|---|---|---|
| `BorderRadius` | Slider 0–30 | скругление краёв карточек/пузырей/строк |
| `BorderWidth` | Slider 0–8 | толщина рамки карточек |
| `BackgroundColor` + `BackgroundOpacity` | Color + Slider | цвет и плотность подложки сообщений (rgba считается в `template.js`) |
| `AccentColor` | Color | акцент: курсор, рамки подсветки, Live-события, время |
| `TextShadow` | Select | тень текста: нет / мягкая / жёсткая (пиксель) / свечение / обводка |
| `TextShadowColor` | Color | цвет тени |
| `ShowTimestamps` | Toggle | показывать время сообщения (`MessageTime(message)`) |
| `Padding` | Slider 0–24 | внутренние отступы сообщений |
| `FontWeight` | Select | обычный / жирный шрифт |
| `LetterSpacing` | Slider 0–6 | межбуквенный интервал (em от базового кегля) |
| `AnimationSpeed` | Slider 100–3000 мс | длительность animate.css-анимаций (через `--animate-duration`) |
| `AvatarSize` | Slider 50–200% | размер аватара |
| `AvatarShape` | Select | круглая / скруглённая / квадратная |
| `MaxWidth` | Slider 40–100% | максимальная ширина блока сообщений |

Механика: `TextStyle` в `template.js` собирает инлайн-стили и CSS-переменные
(`--radius`, `--bg`, `--accent`, `--accent-weak`, `--avsize`, `--avradius`,
`--msgw`, `--maxw`, `--pad`, `--animate-duration`), а `style.css` использует их
с фолбэками, равными внешнему виду темы по умолчанию. Поэтому дефолтные
значения манифеста всегда воспроизводят «родной» вид темы.

Время сообщения: `MessageTime(message)` берёт `message.Time` (Date или ISO-строка),
если поле пришло из чата; иначе фиксирует время первого появления сообщения в оверлее.

## Localization/en.lng

Те же ключи, что и в `Properties`, но со строками-переводами. Поля `Value` не
переводятся, кроме `DeleteMessageText` (объект с `Label` и `Value`). Для
`Select` — объект с `Label` и переведённым `Enumerate`:

```json
{
  "Language": { "Code": "en" },
  "Name": "Neon",
  "Properties": {
    "Glow": "Glow intensity",
    "CardStyle": {
      "Label": "Card style",
      "Enumerate": [{ "Value": "glass", "Label": "Glass" }]
    }
  }
}
```

## Контракт шаблона (widget.js)

Тема — одностраничный Vue 3 шаблон, который Minichat монтирует в `#widget`.
Глобально доступны:

- `Messages` — массив сообщений, поля:
  - `GUID` — уникальный ключ (`v-bind:key`);
  - `Service` — имя сервиса (иконка `../../Images/{Service}.png`);
  - `Avatar.Default` — URL аватара;
  - `badges` — массив значков (`badge.Image.Default`);
  - `UserName`, `Color` — имя и «оригинальный» цвет автора;
  - `Reply` — ответ на сообщение; `Meta.Highlighted` — выделенное (донат и т.п.);
  - `isDeleted` — сообщение удалено (показывать `DeleteMessageText`);
  - `type: "Live"` — служебное событие (показывать при `ShowLive`);
  - текст — через `FormattedMessage(message)`.
- `NoAvatar(message)` — true, если аватара нет (скрыть элемент `.avatar`);
- `HasSettings` — подключены ли свойства темы;
- значения всех свойств из `manifest.json`.

Анимации появления/исчезновения:

```html
<transition-group
  :enter-active-class="'animate__animated animate__' + ShowEffect"
  :leave-active-class="'animate__animated animate__' + HideEffect">
  <div class="display_message" v-for="m in Messages" v-bind:key="m.GUID">...</div>
</transition-group>
```

### Собственная логика — template.js

Дополнительные вычисляемые поля и методы добавляются через `app.mixin`:

```js
(function () {
	app.mixin({
		computed: {
			ChatMessages: function () {
				return this.Messages.filter(function (m) { return !m.type; });
			},
		},
		methods: { /* ... */ },
	});
})();
```

Можно перехватывать события чата через обёртку `GetAction` (как в Dos/Matrix/Arcade):

```js
var defaultGetAction = GetAction;
GetAction = function () {
	var data = defaultGetAction.apply(this, arguments);
	if (!HasSettings) return;
	switch (data.Type) {
		case "Message": /* ... */ break;
	}
};
```

## Шрифты

Подключаются из `fonts/fonts.css` с `unicode-range` (latin / cyrillic), чтобы
браузер брал нужный сабсет. Семейство задаётся в `:root { --font: ... }` и
переопределяется, если пользователь выбрал шрифт в настройках:

```js
TextStyle: function () {
	var style = { fontSize: this.TextSize / 16 + 'em' };
	if (this.Font) style.fontFamily = this.Font;
	return style;
}
```

## Чек-лист новой темы

1. Скопируй ближайшую по духу тему и переименуй папку.
2. Обнови `Name`, `Icon`, свойства и локализацию (не забудь `en.lng`).
3. Нарисуй `icon.svg` в стиле остальных (24×24, скругление 5).
4. Проверь: сообщения, удалённые сообщения, донаты (`Meta.Highlighted`),
   Live-события (`ShowLive`), отсутствие аватара, кириллица и латиница.
5. `python3 preview/serve.py` — прогони тему в галерее на всех фонах.
6. Формат файлов: UTF-8, JSON — CRLF без завершающего переноса.
