(function () {
	function removeLastCursor() {
		var cursors = document.querySelectorAll('span.cursor');
		if (cursors.length)
			cursors[cursors.length - 1].remove();
	}

	var defaultGetAction = GetAction;

	GetAction = function () {
		var data = defaultGetAction.apply(this, arguments);

		if (!HasSettings)
			return;

		if (typeof ThemeFX !== 'undefined')
			ThemeFX.action(data);

		switch (data.Type) {
			case "Live":
				if (data.Type != "Donation")
					break;

				removeLastCursor();
				break;
			case "Message":
				removeLastCursor();
				break;
		}
	}

	// Стабильный псевдослучайный генератор — колонки дождя не "дёргаются" при перерисовке
	function seeded(n) {
		var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
		return x - Math.floor(x);
	}

	var RAIN_CHARS = '0101<>#$%&*+=AEFHKMNRSTXZ01';

	function hexToRgba(hex, alpha) {
		hex = String(hex || '#000000').replace('#', '');
		if (hex.length === 3)
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		var r = parseInt(hex.slice(0, 2), 16) || 0;
		var g = parseInt(hex.slice(2, 4), 16) || 0;
		var b = parseInt(hex.slice(4, 6), 16) || 0;
		return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
	}

	app.mixin({
		computed: {
			/* Сообщения чата без служебных событий */
			ChatMessages: function () {
				return this.Messages.filter(function (m) { return !m.type; });
			},
			/* События Live (подписки и т.п.), если включен показ */
			LiveEvents: function () {
				if (!this.ShowLive) return [];
				return this.Messages.filter(function (m) { return m.type === 'Live'; });
			},
			MessagesClass: function () {
				return {
					'fx-glitch': this.GlitchDonations !== false,
				};
			},
			TextStyle: function () {
				var style = { fontSize: this.TextSize / 16 + 'em' };
				if (this.Font)
					style.fontFamily = this.Font;

				/* Тень текста (настройка TextShadow) */
				var sc = this.TextShadowColor || '#000000';
				var shadow = 'none';
				switch (this.TextShadow) {
					case 'soft':
						shadow = '0 2px 6px ' + sc;
						break;
					case 'hard':
						shadow = '2px 2px 0 ' + sc;
						break;
					case 'glow':
						shadow = '0 0 6px ' + sc + ', 0 0 14px ' + sc;
						break;
					case 'outline':
						shadow = '1px 0 0 ' + sc + ', -1px 0 0 ' + sc + ', 0 1px 0 ' + sc + ', 0 -1px 0 ' + sc +
							', 1px 1px 0 ' + sc + ', -1px -1px 0 ' + sc + ', 1px -1px 0 ' + sc + ', -1px 1px 0 ' + sc;
						break;
					default:
			if ((Number(this.Glow) || 0) > 0)
				shadow = '0 0 ' + this.Glow + 'px rgba(0, 255, 65, .75), 0 0 ' + (this.Glow * 3) + 'px rgba(0, 255, 65, .35)';
				}
				style.textShadow = shadow;

				/* Насыщенность шрифта и межбуквенный интервал */
				if (this.FontWeight === 'bold')
					style.fontWeight = '700';
				else if (this.FontWeight === 'normal')
					style.fontWeight = '400';
				if (Number(this.LetterSpacing))
					style.letterSpacing = (Number(this.LetterSpacing) / 16) + 'em';

				/* Длительность анимаций animate.css */
				style['--animate-duration'] = ((Number(this.AnimationSpeed) || 800) / 1000) + 's';

				/* Геометрия и цвета (см. manifest.json) */
				style['--radius'] = (Number(this.BorderRadius) || 0) + 'px';
				style['--maxw'] = (Number(this.MaxWidth) || 100) + '%';
				style['--msgw'] = Number(this.MaxWidth) === 100 ? '100%' : 'auto';
				style['--pad'] = (Number(this.Padding) || 0) + 'px';
				style['--accent'] = this.AccentColor || '#00FF41';
				style['--accent-weak'] = hexToRgba(this.AccentColor || '#00FF41', 0.22);
				style['--bg'] = hexToRgba(this.BackgroundColor || '#000000', (Number(this.BackgroundOpacity) || 0) / 100);
				style['--bgc'] = style['--bg'];
				style['--avsize'] = ((Number(this.AvatarSize) || 100) / 100) + 'em';
				var shape = this.AvatarShape || 'rounded';
				style['--avradius'] = shape === 'round' ? '50%' : (shape === 'rounded' ? '25%' : '0%');
				return style;
			},
		},
		methods: {
						MessageTime: function (m) {
				var t = null;
				if (m.Time) {
					t = (m.Time instanceof Date) ? m.Time : new Date(m.Time);
				} else if (!m._seenAt) {
					m._seenAt = new Date();
					t = m._seenAt;
				} else {
					t = m._seenAt;
				}
				if (!t || isNaN(t.getTime()))
					return '';
				var h = t.getHours(), mm = t.getMinutes();
				return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
			},
			NameStyle: function (m) {
				/* Автоцвет по хешу имени (детерминированный) */
				if (this.AutoNameColor)
					return { color: (typeof ThemeFX !== 'undefined') ? ThemeFX.HashColor(m.UserName) : this.ColorUserName };
				if (this.UseColorUserName)
					return { color: m.Color == undefined ? this.ColorUserName : m.Color };
				return { color: this.ColorUserName };
			},
			RainColText: function (n) {
				var len = 10 + Math.floor(seeded(n * 3.7) * 12);
				var s = '';
				for (var i = 0; i < len; i++)
					s += RAIN_CHARS[Math.floor(seeded(n * 17.3 + i * 7.7) * RAIN_CHARS.length)];
				return s;
			},
			RainColStyle: function (n) {
				var r1 = seeded(n), r2 = seeded(n * 2.3), r3 = seeded(n * 5.1);
				var duration = Math.max(3, 14 - (Number(this.RainSpeed) || 5) * 1.1) + r2 * 4;
				return {
					left: (r1 * 99) + '%',
					animationDuration: duration + 's',
					animationDelay: (-r3 * 12) + 's',
					fontSize: (11 + r2 * 9) + 'px',
					opacity: 0.3 + r3 * 0.45,
				};
			},
		},
		mounted: function () {
			if (typeof ThemeFX !== 'undefined')
				ThemeFX.init(this);
		},
	});
})();
