/* ============================================================
   ЗАГЛУШКА widget.js — только для локального превью тем!
   В реальном Minichat используется собственный Additions/widget.js,
   который соединяется с чатом и подставляет настоящие сообщения.
   Эта заглушка имитирует тот же контракт (Messages, GetAction,
   свойства из manifest.json и т.д.) и генерирует демо-ленту.
   ============================================================ */
(function () {
	'use strict';

	/* ---------- Состояние (контракт Minichat) ---------- */
	var state = {
		HasSettings: true,
		Messages: [],
		HideMessages: 30,
		MaxMessages: 8,
		DeleteMessageText: '[Сообщение удалено]',
		ShowEffect: 'null',
		HideEffect: 'null',
		TypeSpeed: 50,
		TextSize: 18,
		Color: '#ffffff',
		ColorUserName: '#cccccc',
		UseColorUserName: true,
		ShowServiceIcons: true,
		ShowAvatars: true,
		ShowBadges: true,
		ShowLive: true,
	};

	// Часть свойств нужна шаблонам как глобальные переменные (как в реальном widget.js)
	window.HasSettings = true;

	/* ---------- Приложение Vue ---------- */
	var vm = null; // корневой экземпляр (реактивный прокси) — все мутации только через него
	var app = (window.app = Vue.createApp({
		data: function () {
			return state;
		},
		methods: {
			NoAvatar: function (m) {
				return !m.Avatar || !m.Avatar.Default;
			},
			FormattedMessage: function (m) {
				if (m.isDeleted) return this.DeleteMessageText;
				if (m.type === 'Live') return m.EventText || m.Text || '';
				return m.FormattedText != null ? m.FormattedText : (m.Text || '');
			},
		},
		mounted: function () {
			// this — реактивный прокси корневого компонента
			Demo.attach(this);
		},
	}));

	function R() {
		return vm || state;
	}

	/* ---------- Свойства из manifest.json ---------- */
	function loadManifest() {
		return new Promise(function (resolve) {
			if (typeof fetch !== 'function') return resolve(null);
			fetch('manifest.json', { cache: 'no-store' })
				.then(function (r) { return r.ok ? r.json() : null; })
				.then(resolve)
				.catch(function () { resolve(null); });
		});
	}

	loadManifest().then(function (manifest) {
		if (!manifest || !manifest.Properties) return;
		var t = R();
		Object.keys(manifest.Properties).forEach(function (k) {
			var v = manifest.Properties[k];
			if (v && v.Value !== undefined) t[k] = v.Value;
		});
	});

	function domReady(fn) {
		if (document.readyState !== 'loading') fn();
		else document.addEventListener('DOMContentLoaded', fn);
	}
	domReady(function () {
		vm = app.mount('#widget');
	});

	/* ---------- GetAction (для обёрток в template.js тем) ---------- */
	var queuedAction = { Type: 'None' };

	function GetAction() {
		var a = queuedAction;
		queuedAction = { Type: 'None' };
		return a;
	}
	window.GetAction = GetAction;

	/* ---------- Управление из галереи (postMessage) ---------- */
	window.addEventListener('message', function (e) {
		var d = e.data || {};
		switch (d.cmd) {
			case 'pause': Demo.paused = !!d.value; break;
			case 'rate': Demo.rate = Number(d.value) || 1; break;
			case 'clear': R().Messages.splice(0); break;
			case 'trigger': Demo.trigger(d.kind); break;
		}
	});

	/* ---------- Демо-лента сообщений ---------- */
	function svgURI(svg) {
		return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
	}

	var AVATAR_COLORS = ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#9B5DE5', '#F15BB5', '#00BBF9', '#43AA8B'];

	var USERS = [
		{ name: 'ProstoMax', color: '#7EE787' },
		{ name: 'xX_Kotik_Xx', color: '#FF69B4' },
		{ name: 'СтримовыйБот', color: '#00E5FF' },
		{ name: 'l33t_h4x0r', color: '#FFD700' },
		{ name: 'Мария', color: '#FF8C42' },
		{ name: 'Ded_INSIDE_2007', color: '#C77DFF' },
		{ name: 'NightOwl', color: '#4FC3F7' },
		{ name: 'Зритель №1', color: '#A0E548' },
	];

	var TEXTS = [
		'Привет всем! 👋',
		'Ого, какая красивая тема!',
		'Это выглядит просто огонь 🔥',
		'Погнали катку!',
		'Кто сегодня побеждает? Ставлю на Max',
		'GG WP',
		'😂😂😂',
		'Первый раз здесь, всем привет!',
		'А можно шрифт побольше?',
		'Сегодня погода супер, а вы сидите в чате 😄',
		'+1 к карме за оверлей',
		'LOL',
		'Ещё донатиков! 🪙',
		'Классика никогда не устареет',
		'Ну всё, я на вашей стороне 😎',
		'Слишком красиво, аж завидно',
		'Это же лучшая тема из всех!',
	];

	var LIVE_EVENTS = [
		'⚡ ProstoMax оформил(а) подписку на канал!',
		'🌟 Мария продлила подписку — 3 месяца подряд!',
		'🎉 xX_Kotik_Xx поддержал(а) канал на Boosty!',
	];

	var SERVICES = ['twitch', 'youtube', 'telegram', 'vk', 'trovo'];
	var BADGES = ['mod', 'sub', 'vip', 'prime'];

	var guid = 0;
	function nextGUID() {
		return 'demo-' + Date.now().toString(36) + '-' + (++guid);
	}

	function makeAvatar(colorIdx) {
		var bg = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
		var initials = USERS[colorIdx % USERS.length].name.slice(0, 2).toUpperCase();
		return svgURI(
			'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
			'<rect width="64" height="64" rx="10" fill="' + bg + '"/>' +
			'<circle cx="32" cy="24" r="11" fill="rgba(255,255,255,.85)"/>' +
			'<path d="M12 58 c2-14 10-20 20-20 s18 6 20 20 z" fill="rgba(255,255,255,.85)"/>' +
			'</svg>');
	}

	function makeBadge(kind) {
		var map = {
			mod: { bg: '#00AD03', glyph: '⚔' },
			sub: { bg: '#9146FF', glyph: '★' },
			vip: { bg: '#E005B9', glyph: '💎' },
			prime: { bg: '#00A3E0', glyph: '👑' },
		};
		var b = map[kind] || map.sub;
		return svgURI(
			'<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">' +
			'<rect width="36" height="36" rx="8" fill="' + b.bg + '"/>' +
			'<text x="18" y="25" font-size="19" text-anchor="middle" fill="#fff">' + b.glyph + '</text>' +
			'</svg>');
	}

	var Demo = {
		paused: false,
		rate: 1,
		timer: null,
		started: false,

		attach: function (rootVm) {
			vm = rootVm;
			this.start();
		},

		start: function () {
			if (this.started) return;
			this.started = true;
			var self = this;
			// Начальная пачка сообщений
			[0, 1, 2, 3].forEach(function (i) {
				setTimeout(function () { self.pushRandom(); }, 350 + i * 550);
			});
			this.schedule();
		},

		schedule: function () {
			var self = this;
			clearTimeout(this.timer);
			this.timer = setTimeout(function () {
				if (!self.paused) self.pushRandom();
				self.schedule();
			}, (2600 + Math.random() * 2800) / (this.rate || 1));
		},

		pushRandom: function () {
			var r = Math.random();
			if (r < 0.07) this.trigger('live');
			else if (r < 0.15) this.trigger('donation');
			else this.pushMessage(this.makeChatMessage());
			// Иногда "удаляем" случайное сообщение
			if (Math.random() < 0.18) this.simulateDeletion();
		},

		makeChatMessage: function () {
			var idx = Math.floor(Math.random() * USERS.length);
			var u = USERS[idx];
			var badges = [];
			if (Math.random() < 0.45) badges.push({ Image: { Default: makeBadge(BADGES[Math.floor(Math.random() * BADGES.length)]) } });
			return {
				GUID: nextGUID(),
				Service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
				Avatar: { Default: makeAvatar(idx) },
				badges: badges,
				UserName: u.name,
				Color: u.color,
				Reply: Math.random() < 0.12,
				Meta: { Highlighted: Math.random() < 0.08 },
				isDeleted: false,
				Text: TEXTS[Math.floor(Math.random() * TEXTS.length)],
			};
		},

		pushMessage: function (m) {
			queuedAction = { Type: m.type === 'Live' ? 'Live' : (m.Donation ? 'Donation' : 'Message') };
			var t = R();
			t.Messages.push(m);
			// Ограничение количества
			var cap = Math.max(1, Number(t.MaxMessages) || 8);
			while (t.Messages.length > cap)
				t.Messages.shift();
			// Скрытие по таймеру
			var hide = Number(t.HideMessages) || 0;
			if (hide > 0) {
				setTimeout(function () {
					var arr = R().Messages;
					var i = arr.indexOf(m);
					if (i !== -1) arr.splice(i, 1);
				}, hide * 1000);
			}
			// Уведомляем обёртку GetAction в теме (как это делает реальный widget.js)
			try { window.GetAction(); } catch (e) {}
		},

		simulateDeletion: function () {
			var visible = R().Messages.filter(function (m) { return !m.type && !m.isDeleted; });
			if (!visible.length) return;
			var m = visible[Math.floor(Math.random() * visible.length)];
			setTimeout(function () { m.isDeleted = true; }, 1200 + Math.random() * 2500);
		},

		trigger: function (kind) {
			if (kind === 'donation') {
				var idx = Math.floor(Math.random() * USERS.length);
				this.pushMessage({
					GUID: nextGUID(),
					Service: SERVICES[Math.floor(Math.random() * SERVICES.length)],
					Avatar: { Default: makeAvatar(idx) },
					badges: [],
					UserName: USERS[idx].name,
					Color: USERS[idx].color,
					Reply: false,
					Meta: { Highlighted: true },
					isDeleted: false,
					Donation: true,
					Text: '💰 Донат ' + (50 * (1 + Math.floor(Math.random() * 20))) + '₽ — ' + TEXTS[Math.floor(Math.random() * TEXTS.length)],
				});
			} else if (kind === 'live') {
				this.pushMessage({
					GUID: nextGUID(),
					type: 'Live',
					isDeleted: false,
					EventText: LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)],
					Text: '',
				});
			}
		},
	};

	// Для отладки/тестов
	window.Demo = Demo;
})();
