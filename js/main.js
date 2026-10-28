(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add('in'); });
  }

  /* Nav activo */
  var links = {};
  document.querySelectorAll('nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && links[e.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          links[e.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* Fondo reactivo al scroll */
  var cv = document.getElementById('bg');
  var ctx = cv.getContext('2d');
  var bar = document.getElementById('progress');
  var W = 0, H = 0, nodes = [], cols = ['#2dd4bf', '#8b93fb', '#fbbf24', '#fb7185', '#38bdf8'];
  var glow = 0.15, vel = 0, lastY = window.scrollY, prog = 0, t = 0, raf = 0;

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    var c = ['--c1', '--c2', '--c3', '--c4', '--c5'].map(function (k) { return s.getPropertyValue(k).trim(); });
    if (c.every(Boolean)) cols = c;
    var g = parseFloat(s.getPropertyValue('--glow'));
    if (!isNaN(g)) glow = g;
  }
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(120,130,200,' + a + ')';
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = W < 600 ? 36 : 70;
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        z: 0.35 + Math.random() * 0.65, c: i % cols.length
      });
    }
  }
  function frame() {
    var max = Math.max(1, document.documentElement.scrollHeight - H);
    var y = window.scrollY;
    prog = Math.min(1, Math.max(0, y / max));
    vel = vel * 0.86 + (y - lastY) * 0.14;
    lastY = y;
    t += 0.004;
    bar.style.transform = 'scaleX(' + prog.toFixed(4) + ')';
    ctx.clearRect(0, 0, W, H);

    var shift = Math.floor(prog * cols.length * 1.5) % cols.length;
    var R = Math.max(W, H) * 0.5;
    for (var b = 0; b < 3; b++) {
      var bx = W * (0.5 + 0.42 * Math.sin(prog * 5 + b * 2.1 + t));
      var by = H * (0.2 + 0.3 * b) + Math.cos(prog * 4 + b) * H * 0.12;
      var g = ctx.createRadialGradient(bx, by, 0, bx, by, R);
      var col = cols[(b * 2 + shift) % cols.length];
      g.addColorStop(0, rgba(col, glow));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    var boost = Math.min(Math.abs(vel), 40);
    var i, j, a, n, dx, dy, d, link = 150;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.x += a.vx; a.y += a.vy - vel * a.z * 0.7;
      a.x += Math.sin(t * 6 + i) * 0.12;
      if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
    }
    ctx.lineWidth = 1 + boost / 20;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        n = nodes[j]; dx = a.x - n.x; dy = a.y - n.y;
        if (dx > link || dx < -link || dy > link || dy < -link) continue;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < link) {
          ctx.strokeStyle = rgba(cols[(a.c + shift) % cols.length], (1 - d / link) * (0.28 + boost / 90));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = rgba(cols[(a.c + shift) % cols.length], 0.85);
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.4 + a.z * 1.8 + boost / 25, 0, 6.2832); ctx.fill();
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  readColors(); resize(); frame();
  window.addEventListener('resize', function () { resize(); if (reduce) frame(); });
  if (reduce) window.addEventListener('scroll', frame, { passive: true });
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onTheme = function () { readColors(); if (reduce) frame(); };
  if (mq.addEventListener) mq.addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
