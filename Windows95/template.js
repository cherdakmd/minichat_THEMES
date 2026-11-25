(function () {
	app.mixin({
		data: function () {
			return { Clock: '' };
		},
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
				return style;
			},
		},
		mounted: function () {
			var self = this;
			function tick() {
				self.Clock = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
			}
			tick();
			setInterval(tick, 10000);
		},
	});
})();
