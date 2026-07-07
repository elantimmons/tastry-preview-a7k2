/* Tastry v5 — constellation engine.
   Thousands of tiny outlined triangles drift on the cream void and
   assemble into brand shapes as their section scrolls into view,
   then come apart again as it leaves. Shape anchors are empty
   `.constellation[data-shape]` elements; the engine renders on one
   fixed canvas behind the content. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 900px)').matches;
  var COUNT = small ? 900 : 2200;

  /* Lilac-dominant spectrum. Saturated, readable on cream. */
  var PALETTE = [
    ['#5E4788', 26], ['#7A5FAE', 20], ['#9F84D9', 16], ['#C9A9EE', 8],
    ['#B58117', 10], ['#15846E', 8], ['#A34E8C', 7], ['#4C5FBF', 5]
  ];
  function pickColor() {
    var total = 0, i;
    for (i = 0; i < PALETTE.length; i++) total += PALETTE[i][1];
    var r = Math.random() * total;
    for (i = 0; i < PALETTE.length; i++) {
      r -= PALETTE[i][1];
      if (r <= 0) return PALETTE[i][0];
    }
    return PALETTE[0][0];
  }

  /* ---------- shape point generators (unit square, y down) ---------- */
  function line(pts, x1, y1, x2, y2, n) {
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  function arc(pts, cx, cy, rx, ry, a0, a1, n) {
    for (var i = 0; i < n; i++) {
      var t = a0 + (a1 - a0) * (i / (n - 1));
      pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
    }
  }
  function ring(pts, cx, cy, r, n) { arc(pts, cx, cy, r, r, 0, Math.PI * 2 * (1 - 1 / n), n); }

  var SHAPES = {
    /* the Tastry radial mark — filled in asynchronously from the real SVG */
    mark: null,

    molecule: function () {
      var p = [], cx = 0.42, cy = 0.52, r = 0.17, i;
      var hex = [];
      for (i = 0; i < 6; i++) hex.push([cx + Math.cos(Math.PI / 6 + i * Math.PI / 3) * r, cy + Math.sin(Math.PI / 6 + i * Math.PI / 3) * r]);
      for (i = 0; i < 6; i++) { var a = hex[i], b = hex[(i + 1) % 6]; line(p, a[0], a[1], b[0], b[1], 22); }
      line(p, hex[0][0], hex[0][1], hex[0][0] + 0.15, hex[0][1] - 0.11, 16);
      line(p, hex[0][0] + 0.15, hex[0][1] - 0.11, hex[0][0] + 0.30, hex[0][1] - 0.05, 14);
      line(p, hex[0][0] + 0.15, hex[0][1] - 0.11, hex[0][0] + 0.17, hex[0][1] - 0.27, 12);
      line(p, hex[3][0], hex[3][1], hex[3][0] - 0.13, hex[3][1] + 0.10, 12);
      ring(p, hex[0][0] + 0.30, hex[0][1] - 0.05, 0.035, 12);
      ring(p, hex[3][0] - 0.13, hex[3][1] + 0.10, 0.035, 12);
      return p;
    },

    curve: function () {
      var p = [], i, n = 90;
      for (i = 0; i < n; i++) {
        var x = i / (n - 1);
        var y = 0.86 - 0.62 * Math.exp(-Math.pow((x - 0.55) / 0.16, 2));
        p.push([0.06 + x * 0.88, y]);
      }
      line(p, 0.06, 0.86, 0.94, 0.86, 40);
      for (i = 0; i < 70; i++) {
        var xx = 0.35 + Math.random() * 0.42;
        var top = 0.86 - 0.62 * Math.exp(-Math.pow(((xx - 0.06) / 0.88 - 0.55) / 0.16, 2));
        p.push([xx, top + Math.random() * (0.86 - top)]);
      }
      line(p, 0.55 * 0.88 + 0.06, 0.24, 0.55 * 0.88 + 0.06, 0.86, 18);
      return p;
    },

    twins: function () {
      var p = [];
      ring(p, 0.38, 0.5, 0.24, 90);
      ring(p, 0.62, 0.5, 0.24, 90);
      arc(p, 0.5, 0.5, 0.055, 0.14, 0, Math.PI * 2, 26);
      return p;
    },

    target: function () {
      var p = [];
      ring(p, 0.5, 0.5, 0.30, 84);
      ring(p, 0.5, 0.5, 0.185, 54);
      ring(p, 0.5, 0.5, 0.06, 22);
      line(p, 0.5, 0.08, 0.5, 0.20, 8); line(p, 0.5, 0.80, 0.5, 0.92, 8);
      line(p, 0.08, 0.5, 0.20, 0.5, 8); line(p, 0.80, 0.5, 0.92, 0.5, 8);
      return p;
    },

    cycle: function () {
      var p = [];
      arc(p, 0.5, 0.5, 0.30, 0.30, -Math.PI * 0.42, Math.PI * 0.62, 70);
      arc(p, 0.5, 0.5, 0.30, 0.30, Math.PI * 0.58, Math.PI * 1.62, 70);
      line(p, 0.72, 0.19, 0.80, 0.28, 8); line(p, 0.80, 0.28, 0.69, 0.30, 8);
      line(p, 0.28, 0.81, 0.20, 0.72, 8); line(p, 0.20, 0.72, 0.31, 0.70, 8);
      ring(p, 0.5, 0.5, 0.06, 20);
      return p;
    },

    glass: function () {
      var p = [];
      arc(p, 0.5, 0.30, 0.20, 0.26, 0, Math.PI, 70);         /* bowl */
      line(p, 0.30, 0.30, 0.30, 0.16, 10);
      line(p, 0.70, 0.30, 0.70, 0.16, 10);
      line(p, 0.5, 0.56, 0.5, 0.82, 22);                     /* stem */
      line(p, 0.34, 0.86, 0.66, 0.86, 24);                   /* base */
      line(p, 0.315, 0.36, 0.685, 0.36, 26);                 /* wine line */
      for (var i = 0; i < 40; i++) {                          /* wine fill */
        var yy = 0.37 + Math.random() * 0.16;
        var w = 0.185 * Math.sin(Math.acos(Math.min(1, (yy - 0.30) / 0.26)));
        p.push([0.5 + (Math.random() * 2 - 1) * w, yy]);
      }
      return p;
    },

    chromatogram: function () {
      var p = [], i, bars = 16;
      line(p, 0.08, 0.86, 0.92, 0.86, 30);
      for (i = 0; i < bars; i++) {
        var x = 0.12 + (i / (bars - 1)) * 0.76;
        var h = 0.12 + Math.abs(Math.sin(i * 2.7)) * 0.5;
        line(p, x, 0.86, x, 0.86 - h, Math.max(4, Math.round(h * 22)));
        p.push([x, 0.85 - h]);
      }
      return p;
    },

    network: function () {
      var p = [], nodes = [], i, j, n = 9;
      for (i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        nodes.push([0.5 + Math.cos(a) * (0.26 + (i % 3) * 0.06), 0.5 + Math.sin(a) * (0.24 + ((i + 1) % 3) * 0.06)]);
      }
      nodes.push([0.5, 0.5]);
      for (i = 0; i < nodes.length; i++) ring(p, nodes[i][0], nodes[i][1], 0.028, 10);
      for (i = 0; i < n; i++) {
        line(p, nodes[i][0], nodes[i][1], 0.5, 0.5, 12);
        j = (i + 2) % n;
        if (i % 2 === 0) line(p, nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1], 10);
      }
      return p;
    },

    venn: function () {
      var p = [];
      ring(p, 0.36, 0.42, 0.22, 80);
      ring(p, 0.58, 0.42, 0.22, 80);
      /* dashed gap ring */
      for (var i = 0; i < 12; i++) {
        var a0 = (i / 12) * Math.PI * 2;
        arc(p, 0.52, 0.72, 0.16, 0.16, a0, a0 + 0.28, 5);
      }
      return p;
    },

    flask: function () {
      var p = [];
      line(p, 0.44, 0.12, 0.44, 0.38, 14);
      line(p, 0.56, 0.12, 0.56, 0.38, 14);
      line(p, 0.44, 0.38, 0.24, 0.82, 26);
      line(p, 0.56, 0.38, 0.76, 0.82, 26);
      arc(p, 0.5, 0.82, 0.26, 0.05, 0, Math.PI, 24);
      line(p, 0.40, 0.12, 0.60, 0.12, 10);
      line(p, 0.315, 0.66, 0.685, 0.66, 22);
      for (var i = 0; i < 26; i++) p.push([0.5 + (Math.random() * 2 - 1) * 0.16, 0.68 + Math.random() * 0.12]);
      return p;
    },

    pin: function () {
      var p = [];
      arc(p, 0.5, 0.40, 0.22, 0.22, Math.PI * 0.98, Math.PI * 2.52, 80);
      line(p, 0.335, 0.55, 0.5, 0.86, 20);
      line(p, 0.665, 0.55, 0.5, 0.86, 20);
      ring(p, 0.5, 0.40, 0.08, 24);
      return p;
    },

    smoke: function () {
      var p = [];
      ring(p, 0.36, 0.44, 0.13, 34); ring(p, 0.52, 0.34, 0.15, 38);
      ring(p, 0.66, 0.46, 0.12, 30); ring(p, 0.46, 0.56, 0.11, 28);
      line(p, 0.30, 0.74, 0.72, 0.74, 20);
      line(p, 0.36, 0.82, 0.66, 0.82, 14);
      return p;
    },

    blueprint: function () {
      var p = [];
      line(p, 0.24, 0.18, 0.76, 0.18, 26); line(p, 0.24, 0.82, 0.76, 0.82, 26);
      line(p, 0.24, 0.18, 0.24, 0.82, 30); line(p, 0.76, 0.18, 0.76, 0.82, 30);
      line(p, 0.32, 0.34, 0.68, 0.34, 18);
      line(p, 0.32, 0.48, 0.60, 0.48, 14);
      line(p, 0.32, 0.62, 0.64, 0.62, 16);
      ring(p, 0.68, 0.48, 0.03, 8);
      return p;
    },

    grid: function () {
      var p = [];
      for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++)
        ring(p, 0.17 + i * 0.132, 0.17 + j * 0.132, 0.016, 6);
      return p;
    }
  };

  /* Sample the real Tastry mark from its SVG for the hero shape. */
  (function loadMark() {
    var img = new Image();
    img.onload = function () {
      try {
        var S = 140, c = document.createElement('canvas');
        c.width = S; c.height = S;
        var x = c.getContext('2d');
        x.drawImage(img, 0, 0, S, S);
        var d = x.getImageData(0, 0, S, S).data, pts = [];
        for (var yy = 0; yy < S; yy += 3) {
          for (var xx = 0; xx < S; xx += 3) {
            if (d[(yy * S + xx) * 4 + 3] > 120) pts.push([xx / S, yy / S]);
          }
        }
        if (pts.length > 80) SHAPES.mark = function () { return pts; };
      } catch (e) { /* keep fallback */ }
    };
    img.src = 'assets/tastry-icon-iris.svg';
  })();

  /* ---------- engine ---------- */
  var canvas = document.createElement('canvas');
  canvas.id = 'constellation-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  var particles = [];
  for (var i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      hx: Math.random(), hy: Math.random(),        /* ambient home (viewport fraction) */
      size: 2.2 + Math.random() * 2.6,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      ph: Math.random() * Math.PI * 2,             /* drift phase */
      color: pickColor(),
      alpha: 0.35 + Math.random() * 0.5,
      order: Math.random()
    });
  }
  particles.sort(function (a, b) { return a.order - b.order; });

  var anchors = [];
  function collectAnchors() {
    anchors = [];
    var els = document.querySelectorAll('.constellation[data-shape]');
    for (var i = 0; i < els.length; i++) {
      var name = els[i].getAttribute('data-shape');
      anchors.push({ el: els[i], name: name, pts: null, ptsFor: null });
    }
  }

  function shapePoints(a) {
    var gen = SHAPES[a.name] || SHAPES.molecule;
    if (a.name === 'mark' && !SHAPES.mark) gen = SHAPES.molecule;
    if (!a.pts || a.ptsFor !== gen) { a.pts = gen(); a.ptsFor = gen; }
    return a.pts;
  }

  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  var frame = 0;
  function tick() {
    frame++;
    /* self-heal: some embeds report 0 size at load, and resize events
       don't always fire — re-sync dimensions cheaply each frame */
    if (W !== window.innerWidth || H !== window.innerHeight) resize();
    ctx.clearRect(0, 0, W, H);

    /* find the anchor nearest viewport center */
    var best = null, bestW = 0, i;
    for (i = 0; i < anchors.length; i++) {
      var r = anchors[i].el.getBoundingClientRect();
      if (r.bottom < -H * 0.3 || r.top > H * 1.3) continue;
      var cy = r.top + r.height / 2;
      var w = 1 - Math.abs(cy - H * 0.5) / (H * 0.62);
      if (w > bestW) { bestW = w; best = anchors[i]; best._rect = r; }
    }
    var asm = best ? smooth(bestW) : 0;   /* assembly strength: 0 scattered, 1 formed */

    var pts = null, n = 0, rect = null;
    if (best && asm > 0.02) {
      pts = shapePoints(best);
      rect = best._rect;
      /* ~70% of the field forms the shape (several particles per point,
         jittered); the rest stays ambient so the void keeps its texture */
      n = Math.round(particles.length * 0.7);
    }

    var t = frame * 0.012;
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      /* ambient target with slow drift */
      var ax = p.hx * W + Math.sin(t + p.ph) * 30;
      var ay = p.hy * H + Math.cos(t * 0.8 + p.ph * 1.3) * 24;
      var tx = ax, ty = ay, a = asm;

      if (pts && i < n) {
        var q = pts[(i * 7919) % pts.length];
        var jit = Math.min(rect.width, rect.height) * 0.014;
        var sx = rect.left + q[0] * rect.width + Math.sin(p.ph * 3.7) * jit;
        var sy = rect.top + q[1] * rect.height + Math.cos(p.ph * 2.3) * jit;
        tx = ax + (sx - ax) * a;
        ty = ay + (sy - ay) * a;
      }

      var ease = reduced ? 1 : 0.07;
      p.x += (tx - p.x) * ease;
      p.y += (ty - p.y) * ease;
      if (!reduced) p.rot += p.spin;

      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;

      var s = p.size;
      var c1 = Math.cos(p.rot), s1 = Math.sin(p.rot);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = (pts && i < n) ? Math.min(1, p.alpha + asm * 0.45) : p.alpha * 0.75;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      /* outlined triangle */
      ctx.moveTo(p.x + c1 * s, p.y + s1 * s);
      ctx.lineTo(p.x + Math.cos(p.rot + 2.094) * s, p.y + Math.sin(p.rot + 2.094) * s);
      ctx.lineTo(p.x + Math.cos(p.rot + 4.189) * s, p.y + Math.sin(p.rot + 4.189) * s);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    tick();
    requestAnimationFrame(loop);
  }
  function start() {
    collectAnchors();
    requestAnimationFrame(loop);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* debug/testing hook: step frames manually (headless environments) */
  window.__constellation = {
    step: function (n) { collectAnchors(); for (var k = 0; k < (n || 1); k++) tick(); },
    count: COUNT
  };

  /* ---------- shared page enhancements ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && els.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();
