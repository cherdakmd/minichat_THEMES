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
			TextStyle: function () {
				var style = { fontSize: this.TextSize / 16 + 'em' };
				if (this.Font)
					style.fontFamily = this.Font;
				var glow = Number(this.Glow) || 0;
				if (glow > 0)
					style.textShadow = '0 0 ' + glow + 'px rgba(0,255,65,.75), 0 0 ' + (glow * 3) + 'px rgba(0,255,65,.35)';
				return style;
			},
		},
		methods: {
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
	});
})();
