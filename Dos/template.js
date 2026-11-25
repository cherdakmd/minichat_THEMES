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
})();