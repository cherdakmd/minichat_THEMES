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
				return style;
			},
		},
	});
})();
