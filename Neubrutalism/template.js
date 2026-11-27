(function () {
	var defaultGetAction = GetAction;

	GetAction = function () {
		var data = defaultGetAction.apply(this, arguments);

		if (!HasSettings)
			return;

		if (typeof ThemeFX !== 'undefined')
			ThemeFX.action(data);
	}

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
				style['--accent'] = this.AccentColor || '#111111';
				style['--accent-weak'] = hexToRgba(this.AccentColor || '#111111', 1.0);
				style['--bg'] = hexToRgba(this.BackgroundColor || '#000000', (Number(this.BackgroundOpacity) || 0) / 100);
				style['--bgc'] = style['--bg'];
				style['--avsize'] = ((Number(this.AvatarSize) || 100) / 100) + 'em';
				var shape = this.AvatarShape || 'round';
				style['--avradius'] = shape === 'round' ? '50%' : (shape === 'rounded' ? '25%' : '0%');
				style['--hardshadow'] = (Number(this.HardShadow) || 0) + 'px';
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
		},
		mounted: function () {
			if (typeof ThemeFX !== 'undefined')
				ThemeFX.init(this);
		},
	});
})();
