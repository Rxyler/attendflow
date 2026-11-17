/* AttendFlow : theme clair/sombre, fond shader + particules, curseur lumineux, verre reactif,
   profondeur 3D, prechargement, defilement doux et mouvement d'entree. */
(function () {
  'use strict';

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactile = window.matchMedia('(pointer: coarse)').matches;
  var $$ = function (sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); };
  var racine = document.documentElement;
  var souris = { x: .5, y: .5 }, cibleSouris = { x: .5, y: .5 };
  if (!tactile) document.addEventListener('pointermove', function (e) {
    cibleSouris.x = e.clientX / window.innerWidth; cibleSouris.y = e.clientY / window.innerHeight;
  }, { passive: true });

  /* ================= Theme clair / sombre ================= */
  function theme() { return racine.getAttribute('data-bs-theme') || 'dark'; }
  function appliquerTheme(t) {
    racine.setAttribute('data-bs-theme', t);
    try { localStorage.setItem('af-theme', t); } catch (e) { /* stockage indisponible */ }
    document.querySelector('meta[name=theme-color]') && document.querySelector('meta[name=theme-color]').setAttribute('content', t === 'light' ? '#eef1fb' : '#070b16');
    document.dispatchEvent(new CustomEvent('af:theme', { detail: t }));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.af-theme');
    if (!b) return;
    var suivant = theme() === 'dark' ? 'light' : 'dark';
    // Transition circulaire depuis le bouton quand le navigateur sait le faire
    if (document.startViewTransition && !calme) {
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var rayon = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var vt = document.startViewTransition(function () { appliquerTheme(suivant); });
      vt.ready.then(function () {
        racine.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + rayon + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
      });
    } else appliquerTheme(suivant);
  });

  /* ================= Fond : shader WebGL (aurora fluide) ================= */
  (function shader() {
    var c = document.querySelector('canvas.af-fond-shader');
    if (!c || calme) return;
    var gl = c.getContext('webgl', { antialias: false, depth: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;                                  // le degrade CSS de secours reste visible
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = 'precision highp float;uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uLight;' +
      'vec2 h(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453123);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);' +
      'return mix(mix(dot(h(i),f),dot(h(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(h(i+vec2(0,1)),f-vec2(0,1)),dot(h(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}' +
      'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}' +
      'void main(){vec2 uv=gl_FragCoord.xy/uRes;vec2 p=uv*vec2(uRes.x/uRes.y,1.);float t=uTime*.07;vec2 m=(uMouse-.5)*.35;' +
      'float q1=fbm(p*1.3+vec2(t,-t*.6)+m);float q2=fbm(p*1.9-vec2(t*.5,t*.8)+q1*.9);float q3=fbm(p*1.1+vec2(-t*.4,t*.5)+q2*.7);' +
      'vec3 c1=vec3(.36,.40,.96);vec3 c2=vec3(.13,.83,.93);vec3 c3=vec3(.75,.52,.99);vec3 c4=vec3(.96,.45,.71);' +
      'vec3 col=mix(c1,c2,smoothstep(.1,.8,q1+.5));col=mix(col,c3,smoothstep(.2,.9,q2+.5));col=mix(col,c4,smoothstep(.55,1.,q3+.5)*.7);' +
      'float lum=smoothstep(.15,1.,(q1+q2)*.5+.55);' +
      'vec3 sombre=vec3(.027,.043,.086);vec3 clair=vec3(.93,.95,1.);vec3 base=mix(sombre,clair,uLight);' +
      'float force=mix(.95,.55,uLight);vec3 o=mix(base,col,lum*force);' +
      'float v=smoothstep(1.5,.2,length(uv-vec2(.5,.45))*1.5);o=mix(base,o,mix(v,1.,.35));' +
      'gl_FragColor=vec4(o,1.);}';
    function compiler(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var v = compiler(gl.VERTEX_SHADER, vs), f = compiler(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime'),
        uMouse = gl.getUniformLocation(prog, 'uMouse'), uLight = gl.getUniformLocation(prog, 'uLight');
    var clair = theme() === 'light' ? 1 : 0, clairCible = clair;
    document.addEventListener('af:theme', function (e) { clairCible = e.detail === 'light' ? 1 : 0; });
    function taille() { c.width = Math.max(2, Math.floor(window.innerWidth * .5)); c.height = Math.max(2, Math.floor(window.innerHeight * .5)); gl.viewport(0, 0, c.width, c.height); }
    taille(); window.addEventListener('resize', taille);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    var debut = performance.now();
    (function trame(now) {
      requestAnimationFrame(trame);
      if (!visible) return;
      souris.x += (cibleSouris.x - souris.x) * .04; souris.y += (cibleSouris.y - souris.y) * .04;
      clair += (clairCible - clair) * .06;
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform1f(uTime, (now - debut) / 1000);
      gl.uniform2f(uMouse, souris.x, 1 - souris.y);
      gl.uniform1f(uLight, clair);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(debut);
  })();

  /* ================= Particules (etoiles qui derivent, reliees quand proches) ================= */
  (function particules() {
    var c = document.querySelector('canvas.af-particules');
    if (!c || calme) return;
    var ctx = c.getContext('2d'), pts = [], N = tactile ? 35 : 80, W, H;
    function taille() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    taille(); window.addEventListener('resize', taille);
    for (var i = 0; i < N; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .7, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, ph: Math.random() * 6.28 });
    var halo = document.createElement('canvas'); halo.width = halo.height = 64;
    var hc = halo.getContext('2d'), g = hc.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(199,210,254,1)'); g.addColorStop(.35, 'rgba(165,180,252,.55)'); g.addColorStop(1, 'rgba(165,180,252,0)');
    hc.fillStyle = g; hc.fillRect(0, 0, 64, 64);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    (function trame(t) {
      requestAnimationFrame(trame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      var dx = (souris.x - .5) * 40, dy = (souris.y - .5) * 40;
      for (var i = 0; i < N; i++) {
        var p = pts[i];
        p.x += p.vx * p.z; p.y += p.vy * p.z;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        var px = p.x - dx * p.z, py = p.y - dy * p.z;
        var a = .35 + .65 * (.5 + .5 * Math.sin(t * .0012 + p.ph));
        var r = 6 + 10 * p.z;
        ctx.globalAlpha = a * p.z;
        ctx.drawImage(halo, px - r, py - r, r * 2, r * 2);
        p._x = px; p._y = py;
      }
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
      for (var i2 = 0; i2 < N; i2++) for (var j = i2 + 1; j < N; j++) {
        var a2 = pts[i2], b = pts[j], d = Math.hypot(a2._x - b._x, a2._y - b._y);
        if (d < 130) { ctx.strokeStyle = 'rgba(165,180,252,' + (.14 * (1 - d / 130)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a2._x, a2._y); ctx.lineTo(b._x, b._y); ctx.stroke(); }
      }
    })(0);
  })();

  /* ================= Curseur lumineux ================= */
  if (!tactile && !calme && window.gsap) {
    var cur = document.createElement('div'); cur.className = 'af-curseur'; document.body.appendChild(cur);
    var cx = gsap.quickTo(cur, 'x', { duration: .9, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: .9, ease: 'power3.out' });
    gsap.set(cur, { x: innerWidth / 2, y: innerHeight / 2 });
    document.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
  }

  /* ================= Alertes ================= */
  var ICONES_ALERTE = { 'alert-success': 'circle-check', 'alert-danger': 'circle-alert', 'alert-warning': 'triangle-alert' };
  $$('.alert').forEach(function (a) {
    if (a.querySelector('.af-alert-texte')) return;
    var cle = Object.keys(ICONES_ALERTE).find(function (k) { return a.classList.contains(k); });
    var texte = document.createElement('div'); texte.className = 'af-alert-texte';
    while (a.firstChild) texte.appendChild(a.firstChild);
    if (cle) { var i = document.createElement('i'); i.setAttribute('data-lucide', ICONES_ALERTE[cle]); i.setAttribute('aria-hidden', 'true'); a.appendChild(i); }
    a.appendChild(texte);
    var fermer = document.createElement('button'); fermer.type = 'button'; fermer.className = 'btn-close'; fermer.setAttribute('aria-label', 'Fermer');
    fermer.addEventListener('click', function () { masquer(a); }); a.appendChild(fermer);
    if (a.classList.contains('alert-success')) setTimeout(function () { masquer(a); }, 6000);
  });
  function masquer(a) { if (!a.isConnected) return; a.classList.add('af-sortie'); setTimeout(function () { a.hidden = true; }, calme ? 0 : 260); }

  /* ================= Icones ================= */
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });

  /* ================= Reflet du verre ================= */
  if (!tactile && !calme) document.addEventListener('pointermove', function (e) {
    var carte = e.target.closest ? e.target.closest('.af-glass') : null;
    if (!carte) return;
    var r = carte.getBoundingClientRect();
    carte.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
    carte.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
  }, { passive: true });

  /* ================= Formulaires : envoi en cours ================= */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (e.defaultPrevented || (form.getAttribute('method') || 'get').toLowerCase() === 'get') return;
    var bouton = e.submitter || form.querySelector('[type=submit]');
    if (!bouton || bouton.classList.contains('af-deconnexion')) return;
    setTimeout(function () { bouton.classList.add('is-loading'); bouton.setAttribute('aria-busy', 'true'); }, 0);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) $$('.is-loading').forEach(function (b) { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); });
  });

  /* ================= Defilement doux ================= */
  var lenis = null;
  if (!calme && window.Lenis) {
    $$('.modal, .overflow-auto, .table-responsive, .af-sidebar, textarea, pre').forEach(function (el) { el.setAttribute('data-lenis-prevent', ''); });
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: .9 });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else { var boucle = function (t) { lenis.raf(t); requestAnimationFrame(boucle); }; requestAnimationFrame(boucle); }
    document.addEventListener('show.bs.modal', function () { lenis.stop(); });
    document.addEventListener('hidden.bs.modal', function () { lenis.start(); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var cible = document.querySelector(a.getAttribute('href'));
      if (cible) { e.preventDefault(); lenis.scrollTo(cible, { offset: -90 }); }
    });
  }

  /* ================= Mouvement (GSAP) ================= */
  if (!window.gsap) { racine.classList.remove('af-prep'); return; }
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: .6 });
  var vitrine = document.querySelector('.af-vitrine');

  /* Prechargement de la vitrine : une fois par session */
  var charg = document.querySelector('.af-chargement');
  var retard = 0;
  if (charg) {
    var deja = false;
    try { deja = !!sessionStorage.getItem('af-charge'); sessionStorage.setItem('af-charge', '1'); } catch (e) { /* ok */ }
    if (deja || calme) charg.remove();
    else {
      retard = 1.15;
      gsap.timeline()
        .from(charg.querySelector('.af-logo'), { scale: .6, autoAlpha: 0, duration: .5, ease: 'back.out(2)' })
        .to(charg.querySelector('.af-ligne span'), { width: '100%', duration: .7, ease: 'power2.inOut' }, '-=.1')
        .to(charg, { yPercent: -100, duration: .7, ease: 'power4.inOut', onComplete: function () { charg.remove(); } }, '+=.05');
    }
  }

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {

    /* Inclinaison 3D : [data-tilt] */
    if (!tactile) $$('[data-tilt]').forEach(function (el) {
      var force = parseFloat(el.getAttribute('data-tilt')) || 8;
      var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
      gsap.set(el, { transformPerspective: 900, transformStyle: 'preserve-3d' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); rx(-((e.clientY - r.top) / r.height - .5) * force); ry(((e.clientX - r.left) / r.width - .5) * force); });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });

    /* Boutons magnetiques */
    if (!tactile) $$('[data-magnetic]').forEach(function (el) {
      var x = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' }), y = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .28); y((e.clientY - r.top - r.height / 2) * .4); });
      el.addEventListener('pointerleave', function () { x(0); y(0); });
    });

    /* Orbes */
    var orbes = $$('.af-orbe');
    orbes.forEach(function (o, i) { gsap.to(o, { y: '+=' + (30 + i * 12), x: '+=' + (i % 2 ? -22 : 22), duration: 7 + i * 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }); });
    if (!tactile && orbes.length) {
      var px = orbes.map(function (o) { return gsap.quickTo(o, 'xPercent', { duration: 1.2 }); }), py = orbes.map(function (o) { return gsap.quickTo(o, 'yPercent', { duration: 1.2 }); });
      document.addEventListener('pointermove', function (e) { var dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5; orbes.forEach(function (o, i) { var k = (i + 1) * 6; px[i](dx * k); py[i](dy * k); }); }, { passive: true });
    }

    /* Vitrine : scene 3D, objet Three.js, titre, mot tournant, chiffres, reveals */
    var scene = document.querySelector('.af-scene-inner');
    if (scene) {
      var srx = gsap.quickTo(scene, 'rotationX', { duration: 1 }), sry = gsap.quickTo(scene, 'rotationY', { duration: 1 });
      gsap.set(scene, { rotationX: 8, rotationY: -14 });
      if (!tactile) document.addEventListener('pointermove', function (e) { srx(8 - (e.clientY / innerHeight - .5) * 12); sry(-14 + (e.clientX / innerWidth - .5) * 20); }, { passive: true });
      var flots = $$('.af-flot', scene);
      flots.forEach(function (f, i) { gsap.set(f, { z: parseFloat(f.getAttribute('data-z')) || 0 }); gsap.to(f, { y: '+=' + (10 + i * 5), duration: 3.2 + i * .7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * .4 }); });
      gsap.from(flots, { z: '-=260', autoAlpha: 0, duration: 1.2, stagger: .12, delay: retard + .3 });
      if (window.ScrollTrigger) gsap.to('.af-scene', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.af-hero', start: 'top top', end: 'bottom top', scrub: true } });
      objet3D();
    }
    var titre = document.querySelector('.af-hero h1');
    if (titre && !titre.dataset.decoupe) {
      titre.dataset.decoupe = '1';
      titre.innerHTML = titre.innerHTML.split(/(<[^>]+>|\s+)/).map(function (m) { return (!m || /^\s+$/.test(m) || m[0] === '<') ? m : '<span class="af-mot">' + m + '</span>'; }).join('');
      gsap.from('.af-hero .af-mot', { yPercent: 110, autoAlpha: 0, duration: .9, stagger: .05, ease: 'power4.out', delay: retard + .1 });
      gsap.from('.af-hero [data-hero]', { y: 18, autoAlpha: 0, duration: .8, stagger: .1, delay: retard + .5, clearProps: 'transform,opacity,visibility' });
      var rot = titre.querySelector('.af-rotatif');
      if (rot && rot.getAttribute('data-mots')) {
        var mots = rot.getAttribute('data-mots').split('|'), idx = 0;
        setInterval(function () {
          idx = (idx + 1) % mots.length;
          gsap.to(rot.children, { yPercent: -110, autoAlpha: 0, duration: .45, ease: 'power3.in', stagger: .04, onComplete: function () {
            rot.innerHTML = mots[idx].split(' ').map(function (w) { return '<span class="af-mot">' + w + '</span>'; }).join(' ');
            gsap.from(rot.children, { yPercent: 110, autoAlpha: 0, duration: .6, ease: 'power4.out', stagger: .05 });
          } });
        }, 3200);
      }
    }
    var reveals = $$('[data-reveal]');
    if (reveals.length && window.ScrollTrigger) {
      gsap.set(reveals, { y: 30, autoAlpha: 0 });
      ScrollTrigger.batch(reveals, { start: 'top 88%', once: true, onEnter: function (lot) { gsap.to(lot, { y: 0, autoAlpha: 1, duration: .8, stagger: .08, clearProps: 'transform,opacity,visibility' }); } });
    }

    /* Compteurs : partout, declenches a l'apparition */
    $$('[data-compteur]').forEach(function (el) {
      var m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var fin = parseInt(m[1], 10), suffixe = m[2];
      if (fin === 0) return;
      var etat = { v: 0 }; el.textContent = '0' + suffixe;
      var tw = gsap.to(etat, { v: fin, duration: Math.min(1.4, .6 + fin / 150), ease: 'power3.out', paused: true, onUpdate: function () { el.textContent = Math.round(etat.v) + suffixe; } });
      if (window.ScrollTrigger) ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: function () { tw.delay(.2).play(); } });
      else tw.delay(.2).play();
    });

    /* Espace connecte : entree des blocs, lignes, impulsions */
    var main = document.getElementById('contenu');
    if (main && !vitrine) {
      var blocs = [];
      Array.prototype.slice.call(main.children).forEach(function (el) {
        if (el.matches('script, .modal')) return;
        if (el.matches('.row') && el.children.length > 1) blocs.push.apply(blocs, Array.prototype.slice.call(el.children)); else blocs.push(el);
      });
      var hauteur = innerHeight;
      var visibles = blocs.filter(function (el) { return el.getBoundingClientRect().top < hauteur; });
      var plusBas = blocs.filter(function (el) { return visibles.indexOf(el) < 0; });
      gsap.from(visibles, { y: 18, autoAlpha: 0, scale: .985, duration: .7, stagger: .05, clearProps: 'transform,opacity,visibility' });
      if (window.ScrollTrigger && plusBas.length) {
        gsap.set(plusBas, { y: 24, autoAlpha: 0 });
        ScrollTrigger.batch(plusBas, { start: 'top 92%', once: true, onEnter: function (lot) { gsap.to(lot, { y: 0, autoAlpha: 1, stagger: .07, clearProps: 'transform,opacity,visibility' }); } });
      }
      $$('table tbody', main).forEach(function (tb) {
        var lignes = Array.prototype.slice.call(tb.rows);
        if (lignes.length > 1 && lignes.length <= 40) gsap.from(lignes, { autoAlpha: 0, x: -6, duration: .35, stagger: .018, delay: .15, clearProps: 'transform,opacity,visibility' });
      });
      $$('[aria-live] [id^="nb-"]', main).forEach(function (el) {
        new MutationObserver(function () { gsap.fromTo(el, { scale: 1.25 }, { scale: 1, duration: .4, ease: 'back.out(3)', overwrite: true }); }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }
  });
  racine.classList.remove('af-prep');

  /* ================= Objet 3D (Three.js, vitrine uniquement) ================= */
  function objet3D() {
    var conteneur = document.querySelector('.af-3d');
    if (!conteneur) return;
    if (!window.THREE) {
      // Three.js est charge apres ce script : on attend sa fin de chargement
      var s = document.querySelector('script[src*="three"]');
      if (s && !s.dataset.attente) { s.dataset.attente = '1'; s.addEventListener('load', objet3D); }
      return;
    }
    var T = window.THREE;
    var largeur = conteneur.clientWidth, hauteurC = conteneur.clientHeight;
    var rendu = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    rendu.setPixelRatio(Math.min(devicePixelRatio, 1.5)); rendu.setSize(largeur, hauteurC);
    conteneur.appendChild(rendu.domElement);
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(45, largeur / hauteurC, .1, 100); cam.position.z = 7;
    var groupe = new T.Group(); sc.add(groupe);
    // Icosaedre en fil de fer + enveloppe translucide
    var geo = new T.IcosahedronGeometry(2.1, 1);
    groupe.add(new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: .55 })));
    groupe.add(new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: .06 })));
    // Anneau de particules
    var nb = 900, pos = new Float32Array(nb * 3);
    for (var i = 0; i < nb; i++) { var a = Math.random() * Math.PI * 2, r = 3 + (Math.random() - .5) * .5; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - .5) * .25; pos[i * 3 + 2] = Math.sin(a) * r; }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var anneau = new T.Points(pg, new T.PointsMaterial({ color: 0x67e8f9, size: .035, transparent: true, opacity: .9 }));
    anneau.rotation.x = Math.PI / 2.6; groupe.add(anneau);
    // Nuage d'etoiles lointaines
    var ne = 500, pe = new Float32Array(ne * 3);
    for (var j = 0; j < ne; j++) { pe[j * 3] = (Math.random() - .5) * 24; pe[j * 3 + 1] = (Math.random() - .5) * 16; pe[j * 3 + 2] = -4 - Math.random() * 8; }
    var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(pe, 3));
    sc.add(new T.Points(eg, new T.PointsMaterial({ color: 0xc7d2fe, size: .03, transparent: true, opacity: .6 })));
    function taille() { largeur = conteneur.clientWidth; hauteurC = conteneur.clientHeight; cam.aspect = largeur / hauteurC; cam.updateProjectionMatrix(); rendu.setSize(largeur, hauteurC); }
    window.addEventListener('resize', taille);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    (function trame(t) {
      requestAnimationFrame(trame);
      if (!visible) return;
      groupe.rotation.y = t * .00018 + (souris.x - .5) * .6;
      groupe.rotation.x = Math.sin(t * .0002) * .15 + (souris.y - .5) * .4;
      anneau.rotation.z = t * .00025;
      rendu.render(sc, cam);
    })(0);
  }
})();
