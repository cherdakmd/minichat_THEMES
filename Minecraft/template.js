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
					'--rowbg': 'rgba(0, 0, 0, ' + ((Number(this.ChatOpacity) || 0) / 100) + ')',
				};
				if (this.Font)
					style.fontFamily = this.Font;
				if (this.PixelShadow)
					style.textShadow = '0.11em 0.11em 0 rgba(0,0,0,0.7)';
				return style;
			},
		},
	});
})();
