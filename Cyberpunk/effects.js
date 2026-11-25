/* ============================================================
   ThemeFX — общая библиотека эффектов тем Minichat
   Конфетти, глитч, звук (WebAudio, без файлов), погода на фоне
   (снег / звёзды / метеоры), авто-цвет ника по хешу имени.
   Подключается в index.html перед template.js:
     <link href="effects.css" rel="stylesheet">
     <script src="effects.js"></script>
   Инициализация в template.js:  ThemeFX.init(this)  (в mounted)
   Реакция на события чата:      ThemeFX.action(data)
   Все настройки читаются из свойств манифеста темы (реактивно).
   ============================================================ */
(function () {
	'use strict';

	var fx = {
		vm: null,          // реактивный прокси корневого компонента темы
		weather: null,     // движок погоды { canvas, ctx, parts, kind }
		confetti: null,    // движок конфетти { canvas, ctx, parts, raf }
		audioCtx: null,
	};

	/* ---------- Вспомогательные ---------- */

	function makeCanvas(className, zIndex) {
		try {
			var c = document.createElement('canvas');
			c.className = className;
			c.style.zIndex = String(zIndex);
			(document.body || document.documentElement).appendChild(c);
			return c;
		} catch (e) {
			return null;
		}
	}

	function fitCanvas(c) {
		if (!c) return;
		c.width = window.innerWidth || 800;
		c.height = window.innerHeight || 600;
	}

	function rand(a, b) {
		return a + Math.random() * (b - a);
	}

	/* ---------- Авто-цвет ника (детерминированный по имени) ---------- */

	function hashColor(name) {
		var s = String(name || '?');
		var hash = 5381;
		for (var i = 0; i < s.length; i++) {
			hash = ((hash << 5) + hash + s.charCodeAt(i)) >>> 0;
		}
		// избегаем "грязных" оттенков: пропускаем зону коричневых (20..50)
		var hue = hash % 360;
		if (hue > 15 && hue < 55)
			hue = (hue + 60) % 360;
		var light = 52 + (hash % 14);
		return 'hsl(' + hue + ', 72%, ' + light + '%)';
	}

	/* ---------- Звук (WebAudio, синтез без файлов) ---------- */

	function ensureAudio() {
		if (fx.audioCtx) return fx.audioCtx;
		var AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		try {
			fx.audioCtx = new AC();
		} catch (e) {
			fx.audioCtx = null;
		}
		return fx.audioCtx;
	}

	function tone(ctx, freq, start, dur, volume, type) {
		var osc = ctx.createOscillator();
		var gain = ctx.createGain();
		osc.type = type || 'triangle';
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(0, ctx.currentTime + start);
		gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(ctx.currentTime + start);
		osc.stop(ctx.currentTime + start + dur + 0.05);
	}

	var SOUNDS = {
		donation: function (ctx, v) {
			// "монетка": восходящее арпеджио + блик
			tone(ctx, 880, 0, 0.14, v);
			tone(ctx, 1108, 0.08, 0.16, v);
			tone(ctx, 1318, 0.16, 0.22, v);
			tone(ctx, 1760, 0.26, 0.3, v * 0.8, 'sine');
		},
		live: function (ctx, v) {
			// фанфара события
			tone(ctx, 523, 0, 0.16, v);
			tone(ctx, 659, 0.12, 0.16, v);
			tone(ctx, 784, 0.24, 0.24, v);
			tone(ctx, 1046, 0.36, 0.34, v * 0.9);
		},
	};

	function playSound(kind) {
		if (!fx.vm) return;
		var enabled = fx.vm.EnableSound;
		if (enabled === false || enabled === undefined || enabled === null) return;
		var ctx = ensureAudio();
		if (!ctx) return;
		if (ctx.state === 'suspended') {
			try { ctx.resume(); } catch (e) { return; }
		}
		var volume = (Number(fx.vm.SoundVolume) || 70) / 100 * 0.35;
		var fn = SOUNDS[kind];
		if (fn) fn(ctx, volume);
	}

	/* ---------- Конфетти (canvas-частицы) ---------- */

	var CONFETTI_COLORS = ['#FF3EF0', '#00F0FF', '#FFD700', '#7CFF4F', '#FF6B35', '#B967FF', '#FFFFFF'];

	function ensureConfetti() {
		if (fx.confetti) return fx.confetti;
		var c = makeCanvas('fx-canvas fx-confetti', 9999);
		if (!c) return null;
		var ctx = null;
		try { ctx = c.getContext && c.getContext('2d'); } catch (e) { ctx = null; }
		if (!ctx) return null;
		fx.confetti = { canvas: c, ctx: ctx, parts: [], raf: 0, running: false };
		fitCanvas(c);
		return fx.confetti;
	}

	function confettiLoop() {
		var e = fx.confetti;
		if (!e) return;
		var ctx = e.ctx;
		ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
		var alive = false;
		for (var i = 0; i < e.parts.length; i++) {
			var p = e.parts[i];
			if (p.life <= 0) continue;
			alive = true;
			p.life -= 1;
			p.vy += 0.18;          // гравитация
			p.vx *= 0.995;
			p.x += p.vx;
			p.y += p.vy;
			p.rot += p.vr;
			ctx.save();
			ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.color;
			if (p.shape === 'circle') {
				ctx.beginPath();
				ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
				ctx.fill();
			} else {
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
			}
			ctx.restore();
		}
		if (alive) {
			e.raf = requestAnimationFrame(confettiLoop);
		} else {
			e.parts = [];
			e.running = false;
			ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
		}
	}

	function burst(count, originX, originY) {
		var e = ensureConfetti();
		if (!e) return;
		if (!e.running) {
			e.running = true;
			confettiLoop();
		}
		var w = e.canvas.width;
		var colors = CONFETTI_COLORS.slice();
		if (fx.vm && fx.vm.AccentColor)
			colors.unshift(fx.vm.AccentColor);
		for (var i = 0; i < count; i++) {
			var angle = rand(-Math.PI * 0.9, -Math.PI * 0.1); // веером вверх
			var speed = rand(4, 13);
			e.parts.push({
				x: originX != null ? originX : w / 2,
				y: originY != null ? originY : e.canvas.height * 0.28,
				vx: Math.cos(angle) * speed + rand(-2, 2),
				vy: Math.sin(angle) * speed,
				vr: rand(-0.25, 0.25),
				rot: rand(0, Math.PI),
				size: rand(6, 13),
				life: rand(45, 90),
				color: colors[Math.floor(Math.random() * colors.length)],
				shape: Math.random() < 0.3 ? 'circle' : 'rect',
			});
		}
	}

	function onDonation() {
		if (fx.vm && fx.vm.ShowConfetti === false) return;
		burst(90);
		// второй залп для сочности
		setTimeout(function () { burst(50); }, 180);
	}

	/* ---------- Погода: снег / звёзды / метеоры ---------- */

	function ensureWeather() {
		if (fx.weather) return fx.weather;
		var c = makeCanvas('fx-canvas fx-weather', 0);
		if (!c) return null;
		var ctx = null;
		try { ctx = c.getContext && c.getContext('2d'); } catch (e) { ctx = null; }
		if (!ctx) return null;
		fx.weather = { canvas: c, ctx: ctx, parts: [], meteors: [], frame: 0 };
		fitCanvas(c);
		window.addEventListener('resize', function () { fitCanvas(c); });
		return fx.weather;
	}

	function rebuildWeatherParts() {
		var e = fx.weather;
		if (!e || !fx.vm) return;
		var vm = fx.vm;
		var parts = [];
		var w = e.canvas.width, h = e.canvas.height;

		// Звёзды
		var wantStars = vm.EnableStars !== false && vm.EnableStars !== undefined;
		if (wantStars) {
			var nStars = Math.round((Number(vm.StarAmount) || 5) * 24);
			for (var i = 0; i < nStars; i++) {
				parts.push({
					kind: 'star',
					x: rand(0, w), y: rand(0, h),
					r: rand(0.5, 1.8),
					phase: rand(0, Math.PI * 2),
					twinkle: rand(0.01, 0.05),
					base: rand(0.25, 0.85),
				});
			}
		}

		// Снег
		var wantSnow = vm.EnableSnow === true;
		if (wantSnow) {
			var nSnow = Math.round((Number(vm.SnowAmount) || 5) * 12);
			for (var j = 0; j < nSnow; j++) {
				parts.push({
					kind: 'snow',
					x: rand(0, w), y: rand(0, h),
					r: rand(1.2, 3.4),
					speed: rand(0.5, 1.8),
					drift: rand(-0.6, 0.6),
					phase: rand(0, Math.PI * 2),
					opacity: rand(0.35, 0.9),
				});
			}
		}

		e.parts = parts;
	}

	function weatherLoop() {
		var e = fx.weather;
		if (!e) return;
		var ctx = e.ctx;
		var vm = fx.vm;
		e.frame++;

		var active = false;
		if (vm) {
			var starsOn = vm.EnableStars !== false && vm.EnableStars !== undefined;
			var snowOn = vm.EnableSnow === true;
			active = starsOn || snowOn;
		}

		ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
		if (!active) {
			requestAnimationFrame(weatherLoop);
			return;
		}

		// Синхронизация количества при смене настроек (проверяем каждые ~30 кадров)
		if (e.frame % 30 === 0) {
			var wantStars = vm.EnableStars !== false && vm.EnableStars !== undefined;
			var wantSnow = vm.EnableSnow === true;
			var nStars = wantStars ? Math.round((Number(vm.StarAmount) || 5) * 24) : 0;
			var nSnow = wantSnow ? Math.round((Number(vm.SnowAmount) || 5) * 12) : 0;
			var haveStars = 0, haveSnow = 0;
			for (var k = 0; k < e.parts.length; k++) {
				if (e.parts[k].kind === 'star') haveStars++; else haveSnow++;
			}
			if (haveStars !== nStars || haveSnow !== nSnow) rebuildWeatherParts();
		}

		var t = e.frame;
		for (var i = 0; i < e.parts.length; i++) {
			var p = e.parts[i];
			if (p.kind === 'star') {
				p.phase += p.twinkle;
				var a = p.base * (0.55 + 0.45 * Math.sin(p.phase));
				ctx.globalAlpha = a;
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
			} else { // snow
				p.y += p.speed;
				p.x += p.drift + Math.sin((t + p.phase * 60) / 40) * 0.4;
				if (p.y > e.canvas.height + 5) {
					p.y = -5;
					p.x = rand(0, e.canvas.width);
				}
				if (p.x > e.canvas.width + 5) p.x = -5;
				if (p.x < -5) p.x = e.canvas.width + 5;
				ctx.globalAlpha = p.opacity;
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Метеоры
		var meteorsOn = vm.EnableMeteors === true;
		if (meteorsOn && Math.random() < 0.006) {
			e.meteors.push({
				x: rand(e.canvas.width * 0.2, e.canvas.width),
				y: rand(-20, e.canvas.height * 0.3),
				vx: rand(-9, -5),
				vy: rand(3, 5.5),
				life: rand(40, 70),
			});
		}
		for (var m = e.meteors.length - 1; m >= 0; m--) {
			var mt = e.meteors[m];
			mt.x += mt.vx;
			mt.y += mt.vy;
			mt.life -= 1;
			if (mt.life <= 0 || mt.x < -80 || mt.y > e.canvas.height + 80) {
				e.meteors.splice(m, 1);
				continue;
			}
			var grad = ctx.createLinearGradient(mt.x, mt.y, mt.x - mt.vx * 9, mt.y - mt.vy * 9);
			grad.addColorStop(0, 'rgba(255,255,255,0.9)');
			grad.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.globalAlpha = Math.min(1, mt.life / 30);
			ctx.strokeStyle = grad;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.moveTo(mt.x, mt.y);
			ctx.lineTo(mt.x - mt.vx * 9, mt.y - mt.vy * 9);
			ctx.stroke();
		}

		ctx.globalAlpha = 1;
		requestAnimationFrame(weatherLoop);
	}

	/* ---------- Реакция на события чата ---------- */

	function action(data) {
		if (!data || !fx.vm) return;
		switch (data.Type) {
			case 'Donation':
				onDonation();
				playSound('donation');
				break;
			case 'Live':
				playSound('live');
				break;
		}
	}

	/* ---------- Инициализация ---------- */

	function init(vm) {
		fx.vm = vm;
		var w = ensureWeather();
		if (w) {
			fitCanvas(w.canvas);
			rebuildWeatherParts();
			requestAnimationFrame(weatherLoop);
		}
		// предзагрузка аудио-контекста не требуется: создаётся по первому звуку
	}

	window.ThemeFX = {
		init: init,
		action: action,
		burst: burst,
		playSound: playSound,
		HashColor: hashColor,
		_glue: fx,
	};
})();
