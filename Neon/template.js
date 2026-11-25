(function () {
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
				var style = {
					fontSize: this.TextSize / 16 + 'em',
					'--glow': Number(this.Glow) || 0,
				};
				if (this.Font)
					style.fontFamily = this.Font;
				return style;
			},
		},
	});
})();
