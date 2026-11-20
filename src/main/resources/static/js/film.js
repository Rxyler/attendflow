/* Fas3a : petit film de 10 s joue une fois apres l'intro de la vitrine (ouvert par attendflow.js).
   Image : SVG dessine a la main, une seule timeline GSAP. Son : musique et bruitages synthetises en Web Audio,
   rendus d'avance dans un seul tampon (OfflineAudioContext) puis lus a partir de tl.time() : jamais de decalage. */
(function () {
  'use strict';
  var film = document.querySelector('.dd-film');
  if (!film || !window.gsap) return;
  var $ = function (s) { return film.querySelector(s); }, $$ = function (s) { return film.querySelectorAll(s); };
  var cadre = $('.dd-film-cadre'), scene = $('.dd-film-scene'), legendes = $$('.dd-film-legendes p'),
      progres = $('.dd-film-progres span'), vitrine = document.querySelector('.af-vitrine');

  /* ================= Bande son (musique + bruitages), calee sur les memes temps que l'image ================= */
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function partition() {
    var O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!O) return Promise.reject();
    var sr = 44100, o = new O(2, sr * 11, sr);
    var comp = o.createDynamicsCompressor(); comp.connect(o.destination);
    var mus = o.createGain(); mus.gain.value = .5; mus.connect(comp);
    var fx = o.createGain(); fx.gain.value = .9; fx.connect(comp);
    var bb = o.createBuffer(1, sr * 2, sr), d = bb.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var r = Math.random;

    function env(g, t, a, v, dur) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
    function osc(dest, t, type, f1, f2, v, dur, a) {
      var s = o.createOscillator(), g = o.createGain(); s.type = type;
      s.frequency.setValueAtTime(f1, t); if (f2 !== f1) s.frequency.exponentialRampToValueAtTime(f2, t + dur);
      env(g, t, a || .005, v, dur); s.connect(g).connect(dest); s.start(t); s.stop(t + dur + .05); return s;
    }
    function bruit(dest, t, dur, type, f, q, v, a) {
      var s = o.createBufferSource(), fl = o.createBiquadFilter(), g = o.createGain();
      s.buffer = bb; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
      env(g, t, a || .003, v, dur); s.connect(fl).connect(g).connect(dest); s.start(t, r() * 1.5); s.stop(t + dur + .05); return fl;
    }
    // instruments
    function marimba(t, m, v) { osc(mus, t, 'sine', hz(m), hz(m), v || .2, .35); osc(mus, t, 'sine', hz(m) * 4, hz(m) * 4, (v || .2) * .25, .07); }
    function basse(t, m, dur) { osc(mus, t, 'triangle', hz(m), hz(m), .34, dur || .42, .01); }
    function pizz(t, m) { osc(mus, t, 'triangle', hz(m), hz(m), .14, .16); }
    function kick(t) { osc(mus, t, 'sine', 130, 45, .5, .18); }
    function clap(t) { bruit(mus, t, .09, 'bandpass', 1600, 1.2, .16); }
    function shaker(t) { bruit(mus, t, .04, 'highpass', 7000, .7, .045); }
    function bloc(t) { osc(mus, t, 'sine', 1250, 1100, .15, .05); }
    function cloche(dest, t, m, v, dur) {
      [[1, 1, 1], [2.76, .4, .5], [5.4, .15, .25]].forEach(function (p) { osc(dest, t, 'sine', hz(m) * p[0], hz(m) * p[0], v * p[1], dur * p[2]); });
    }
    // bruitages
    function gratte(t, dur) { for (var k = t; k < t + dur; k += .03 + r() * .03) bruit(fx, k, .025 + r() * .02, 'bandpass', 2500 + r() * 2500, 2, .06 + r() * .08); }
    function froisse(t, dur, n) { for (var k = 0; k < (n || 45); k++) bruit(fx, t + r() * dur, .006 + r() * .02, 'bandpass', 900 + r() * 5000, 1.5, .1 + r() * .25); }
    function souffle(t, dur, f1, f2, v) { bruit(fx, t, dur, 'bandpass', f1, .9, v, dur * .45).frequency.exponentialRampToValueAtTime(f2, t + dur); }
    function marqueur(t, dur) { bruit(fx, t, dur, 'bandpass', 1800, 7, .16, .02).frequency.linearRampToValueAtTime(3400, t + dur); }
    function boing(t) {
      var s = osc(fx, t, 'sine', 160, 520, .32, .45, .01), lfo = o.createOscillator(), lg = o.createGain();
      lfo.frequency.value = 16; lg.gain.setValueAtTime(40, t); lg.gain.exponentialRampToValueAtTime(1, t + .45);
      lfo.connect(lg).connect(s.frequency); lfo.start(t); lfo.stop(t + .5);
    }
    function tap(t) { osc(fx, t, 'sine', 220, 80, .4, .1); bruit(fx, t, .02, 'lowpass', 2000, .7, .15); }
    function clic(t, p) { osc(fx, t, 'triangle', 1700 * p, 1500 * p, .18, .05); bruit(fx, t, .012, 'highpass', 5000, .7, .12); }
    function nope(t) { osc(fx, t, 'triangle', 392, 392, .22, .1); osc(fx, t + .11, 'triangle', 311, 300, .22, .16); }
    function tampon(t) { osc(fx, t, 'sine', 120, 40, .5, .28); bruit(fx, t, .07, 'lowpass', 500, .7, .35); bruit(fx, t, .04, 'bandpass', 2200, 1, .25); }
    function poubelle(t) { osc(fx, t, 'sine', 170, 70, .3, .2); [620, 940, 1430].forEach(function (f) { osc(fx, t, 'triangle', f, f * .98, .06, .35); }); bruit(fx, t, .08, 'lowpass', 700, .7, .18); }
    function hop(t) { osc(fx, t, 'sine', 380, 900, .22, .1); }
    function etincelle(t) { [96, 100, 103, 108].forEach(function (m, k) { cloche(fx, t + k * .05, m, .08, .5); }); }
    function popper(t) { bruit(fx, t, .05, 'bandpass', 1400, .8, .3); froisse(t + .03, .3, 20); etincelle(t + .08); }

    // musique : 120 bpm, chaque coupure (2, 4, 7, 9 s) tombe sur un temps, avec un changement d'accord
    var b = .5, e = .25;
    [45, 44, 43, 42].forEach(function (m, k) { basse(k * b, m); bloc(k * b); pizz(k * b + e, 64); });   // 0-2 : le probleme, la basse descend, l'horloge fait tic
    [72, 76, 79, 84, 79, 76, 72, 76].forEach(function (m, k) { marimba(2 + k * e, m); });                // 2-4 : la mascotte, tout s'eclaire
    [48, 48, 55, 55].forEach(function (m, k) { basse(2 + k * b, m); if (k) kick(2 + k * b); });   // la batterie entre un temps apres la coupure : pas de sursaut
    [[65, 69, 72, 77], [67, 71, 74, 79], [64, 67], [67, 71]].reduce(function (t, ac) {                 // 4-7 : le groove
      ac.forEach(function (m, k) { marimba(t + k * e, m); }); return t + ac.length * e;
    }, 4);
    [41, 41, 43, 43, 40, 43].forEach(function (m, k) { basse(4 + k * b, m); kick(4 + k * b); });
    for (var t = 4; t < 8.75; t += e) shaker(t);
    [4.5, 5.5, 6.5, 7.5, 8.5].forEach(clap);
    [72, 76, 79, 84, 74, 77, 79].forEach(function (m, k) { marimba(7 + k * e, m); });   // 7-8.75 puis un demi-temps de silence avant la chute
    [48, 48, 50, 43].forEach(function (m, k) { basse(7 + k * b, m); kick(7 + k * b); });
    [72, 76, 79, 84].forEach(function (m, k) { cloche(mus, 9 + k * .03, m, .16, 1.6); });                // 9 : la chute, accord de do
    basse(9, 36, 1.5); basse(9, 48, 1.2);

    // bruitages, aux temps de l'image
    gratte(.4, 1.05); souffle(.2, .3, 400, 1800, .2); froisse(1.45, .25); souffle(1.68, .32, 600, 2400, .25); poubelle(2);
    marqueur(2.02, .28); boing(2.35); tap(2.63); etincelle(2.85); hop(3.6);
    souffle(4, .35, 300, 1500, .3); clic(4.5, 1); clic(4.75, 1.12); clic(5, 1.25); nope(5.25);
    souffle(5.55, .4, 500, 2600, .25); tampon(6); cloche(fx, 6.12, 88, .2, .9); marqueur(6.75, .28);
    [0, 1, 2, 3, 4].forEach(function (k) { clic(7.15 + k * .08, 1 + k * .12); });
    [7.55, 7.65, 7.75].forEach(function (t) { tap(t); }); cloche(fx, 8.1, 88, .2, .8); cloche(fx, 8.32, 91, .16, .8);
    popper(9);
    return o.startRendering();
  }

  var ac = null, sortie = null, piste = null, source = null, actif = true, tl = null;
  function audio() {
    if (!ac) {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      ac = new A(); sortie = ac.createGain(); sortie.connect(ac.destination);
      ac.onstatechange = function () { majSon(); if (ac.state === 'running' && tl && !tl.paused() && !film.hidden) lancerSon(); };
      partition().then(function (buf) { piste = buf; if (tl && !tl.paused() && !film.hidden) lancerSon(); }, function () {});
    }
    if (ac.state !== 'running') ac.resume().catch(function () {});
  }
  function couperSon() { if (source) { try { source.stop(); } catch (e) { /* deja fini */ } source = null; } }
  function lancerSon() {
    couperSon();
    if (!piste || !ac || ac.state !== 'running' || !tl || tl.time() >= piste.duration) return;
    source = ac.createBufferSource(); source.buffer = piste; source.connect(sortie); source.start(0, tl.time());
  }
  // le navigateur bloque le son tant que le visiteur n'a pas touche la page : on l'invite a le faire
  function majSon() {
    var marche = actif && ac && ac.state === 'running';
    if (sortie) sortie.gain.value = actif ? 1 : 0;
    film.classList.toggle('muet', !marche);
    film.classList.toggle('verrouille', actif && !!ac && ac.state !== 'running');
    $('.dd-film-son').setAttribute('aria-pressed', marche ? 'true' : 'false');
  }

  /* ================= Sous-titres : mot a mot, *mot* surligne au feutre ================= */
  function echap(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function decouper(p) {
    var html = '', dedans = false;
    p.textContent.trim().split(/\s+/).forEach(function (w) {
      var ouvre = w.charAt(0) === '*', ferme = w.indexOf('*', ouvre ? 1 : 0) >= 0;
      if (ouvre && !dedans) { html += '<span class="marque">'; dedans = true; }
      html += '<span class="mot">' + echap(w.replace(/\*/g, '')) + '</span> ';
      if (ferme && dedans) { html = html.replace(/ $/, '') + '</span> '; dedans = false; }
    });
    p.innerHTML = '<span class="ligne">' + html.trim() + (dedans ? '</span>' : '') + '</span>';
  }

  /* ================= Le film : 5 temps, 10 s ================= */
  // construit a la premiere ouverture : cache, le SVG n'a pas de dimensions et les pivots seraient faux
  function construire() {
    legendes.forEach(decouper);
    tl = gsap.timeline({
      // autoRound: false, sinon GSAP arrondit stroke-dashoffset au pixel et les traits (longueur 1) sautent au lieu de se dessiner
      paused: true, defaults: { ease: 'power3.out', smoothOrigin: false, autoRound: false },
      onUpdate: function () { progres.style.transform = 'scaleX(' + tl.progress() + ')'; },
      onComplete: function () { film.classList.add('fini'); }
    });
    var M = '480 229', PIED = '480 330', coches = $$('.f-coche'), pct = $('#f-pct'), compteur = { v: 0 },
        etoiles = $$('#f-etoiles > *'), conf = $('#f-confettis');

    function legende(i, t) {
      var p = legendes[i];
      tl.to([].filter.call(legendes, function (x) { return x !== p; }), { autoAlpha: 0, y: -10, duration: .2, ease: 'power2.in' }, Math.max(0, t - .2))
        .set(p, { autoAlpha: 1, y: 0 }, t)
        .fromTo(p.querySelectorAll('.mot'), { autoAlpha: 0, y: 16, rotation: function () { return gsap.utils.random(-10, 10); } },
          { autoAlpha: 1, y: 0, rotation: 0, duration: .4, stagger: .04, ease: 'back.out(2.2)' }, t)
        .fromTo(p.querySelectorAll('.marque'), { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: .35, ease: 'power2.inOut' }, t + .3);
    }
    // coup de feutre : il couvre l'image, on change de decor dessous, puis il s'efface
    function balai(t, couleur) {
      tl.set('#f-balai', { attr: { stroke: couleur }, strokeDashoffset: 2 }, t)
        .to('#f-balai', { strokeDashoffset: 0, duration: .26, ease: 'power2.in' }, t)
        .to('#f-balai', { strokeDashoffset: -1, duration: .3, ease: 'power2.out' }, t + .3);
    }

    // 1. le probleme : la feuille papier griffonnee, l'horloge qui s'affole, puis a la poubelle
    legende(0, .05);
    tl.fromTo('#f-feuille', { autoAlpha: 0, y: 60, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: .5, ease: 'back.out(1.6)', svgOrigin: '460 270' }, 0)
      .fromTo('#f-horloge', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .4, ease: 'back.out(2.2)', svgOrigin: '780 190' }, .2)
      .to('.f-aiguille', { rotation: 900, svgOrigin: '780 190', duration: 1.6, ease: 'power1.in' }, .3)
      .to('.f-aiguille2', { rotation: 90, svgOrigin: '780 190', duration: 1.6, ease: 'none' }, .3)
      .to('#f-horloge', { keyframes: { rotation: [-9, 8, -6, 5, -3, 0] }, duration: .4, ease: 'none', svgOrigin: '780 250' }, 1)
      .fromTo('#f-crayon', { autoAlpha: 0, x: 60, y: -150 }, { autoAlpha: 1, x: -120, y: -110, duration: .3 }, .2)
      .to('#f-crayon', { keyframes: { x: [-60, -140, -80, -130, -60], y: [-60, -5, 60, 125, 180] }, duration: .95, ease: 'none' }, .45)
      .to('#f-feuille .f-trait', { strokeDashoffset: 0, duration: .2, stagger: .12, ease: 'power1.inOut' }, .4)
      .fromTo('#f-poubelle', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: .4, ease: 'back.out(1.8)' }, 1.15)
      .to('#f-crayon, #f-horloge', { autoAlpha: 0, y: '+=40', duration: .25, ease: 'power2.in' }, 1.45)
      .to('#f-feuille', { autoAlpha: 0, scale: .25, rotation: 30, duration: .2, ease: 'power2.in', svgOrigin: '460 270' }, 1.45)
      .fromTo('#f-boule', { autoAlpha: 0, scale: .3, rotation: -40 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .22, ease: 'back.out(2)', svgOrigin: '460 270' }, 1.5)
      // lancer en cloche : x regulier, y monte puis retombe
      .to('#f-boule', { x: 390, rotation: 400, scale: .55, duration: .32, ease: 'none', svgOrigin: '460 270' }, 1.68)
      .to('#f-boule', { y: -150, duration: .14, ease: 'power2.out' }, 1.68)
      .to('#f-boule', { y: 125, duration: .18, ease: 'power2.in' }, 1.82)
      .set('#f-boule', { autoAlpha: 0 }, 2)
      .to('#f-poubelle', { keyframes: { rotation: [-10, 7, -4, 0] }, duration: .3, ease: 'none', svgOrigin: '850 480' }, 2)
      .to('#f-couvercle', { y: -14, duration: .1, yoyo: true, repeat: 1, ease: 'power2.out' }, 2);
    balai(2, 'var(--dd-jaune)');
    tl.set('#f-feuille, #f-poubelle, #f-boule', { autoAlpha: 0 }, 2.27);

    // 2. la solution : la mascotte bondit, ecrase, s'etire, fait un clin d'oeil
    legende(1, 2.35);
    tl.fromTo('#f-mascotte', { autoAlpha: 0, y: 330, scaleX: 1.2, scaleY: .75, rotation: 0 },
        { autoAlpha: 1, y: -40, scaleX: .88, scaleY: 1.15, duration: .28, ease: 'power2.out', svgOrigin: PIED }, 2.35)
      .to('#f-mascotte', { y: 0, scaleX: 1.18, scaleY: .82, duration: .12, ease: 'power2.in', svgOrigin: PIED }, 2.63)
      .to('#f-mascotte', { scaleX: 1, scaleY: 1, duration: .55, ease: 'elastic.out(1, .4)', svgOrigin: PIED }, 2.75)
      .to('#f-antennes', { keyframes: { rotation: [12, -9, 6, -3, 0] }, duration: .6, ease: 'none', transformOrigin: '50% 100%' }, 2.7)
      .fromTo('#f-nom', { autoAlpha: 0, scale: .4, rotation: -8, y: 20 }, { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: .45, ease: 'back.out(2.5)', svgOrigin: '480 390' }, 2.8);
    etoiles.forEach(function (el, k) {
      var bx = el.getBBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
      tl.fromTo(el, { autoAlpha: 0, x: 480 - cx, y: 229 - cy, scale: 0, rotation: -90 },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: .5, ease: 'back.out(1.6)', svgOrigin: cx + ' ' + cy }, 2.85 + k * .04);
    });
    tl.to('#f-oeil-d', { scaleY: .1, transformOrigin: '50% 60%', duration: .08, yoyo: true, repeat: 1, ease: 'none' }, 3.35)
      .to('#f-nom, #f-etoiles > *', { autoAlpha: 0, y: '-=14', duration: .22, stagger: .03, ease: 'power2.in' }, 3.55)
      // petit saut en cloche vers le coin, d'ou elle regarde la suite
      .to('#f-mascotte', { x: -400, scale: .3, duration: .42, ease: 'power2.inOut', svgOrigin: M }, 3.6)
      .to('#f-mascotte', { y: -230, duration: .2, ease: 'power2.out' }, 3.6)
      .to('#f-mascotte', { y: -178, duration: .22, ease: 'power2.in' }, 3.8);

    // 3. comment : la feuille Fas3a tombe, les cases se cochent, une absence est justifiee et tamponnee
    legende(2, 4.05);
    tl.fromTo('#f-carte', { autoAlpha: 0, y: -380, rotation: -8 }, { autoAlpha: 1, y: 0, rotation: -1, duration: .5, ease: 'back.out(1.3)', svgOrigin: '485 270' }, 4)
      .fromTo('#f-camera', { scale: 1 }, { scale: 1.04, duration: 2.9, ease: 'none', svgOrigin: '480 270' }, 4)
      .to('.f-pupille', { x: 1.3, y: .8, duration: .2 }, 4.3);
    [4.5, 4.75, 5].forEach(function (t, k) {
      var puce = coches[k].parentNode.querySelector('.f-puce');
      tl.to(coches[k], { strokeDashoffset: 0, duration: .18, ease: 'power2.out' }, t)
        .fromTo(puce, { scale: 1.18 }, { scale: 1, duration: .3, ease: 'back.out(3)', transformOrigin: '50% 50%' }, t);
    });
    tl.set('#f-puce-absent', { attr: { fill: 'var(--dd-rose)' } }, 5.25)
      .to('#f-croix', { strokeDashoffset: 0, duration: .15 }, 5.25)
      .to('#f-rang-absent', { keyframes: { x: [-7, 6, -4, 2, 0] }, duration: .25, ease: 'none' }, 5.25)
      .fromTo('#f-justif', { autoAlpha: 0, x: 160, rotation: 25 }, { autoAlpha: 1, x: -60, rotation: -8, duration: .42, ease: 'power2.out', svgOrigin: '790 317' }, 5.55)
      .fromTo('#f-justif', { y: -130 }, { y: 0, duration: .42, ease: 'back.out(1.4)' }, 5.55)
      .fromTo('#f-tampon', { autoAlpha: 0, scale: 2.6 }, { autoAlpha: 1, scale: 1, duration: .14, ease: 'power4.in', svgOrigin: '633 328' }, 5.86)
      .to('#f-camera', { keyframes: { x: [-8, 7, -4, 2, 0], y: [5, -4, 2, -1, 0] }, duration: .24, ease: 'none' }, 6)
      .set('#f-puce-absent', { attr: { fill: 'var(--dd-jaune)' } }, 6)
      .to('#f-croix', { strokeDashoffset: 2, duration: .1 }, 6)
      .to('#f-ok', { strokeDashoffset: 0, duration: .2 }, 6.05)
      .to('#f-mascotte', { y: -200, duration: .12, yoyo: true, repeat: 1, ease: 'power2.out' }, 6.05)
      .to('.f-pupille', { x: 0, y: 0, duration: .2 }, 6.5);
    balai(6.75, 'var(--dd-rose)');
    tl.set('#f-carte', { autoAlpha: 0 }, 7.02).set('#f-camera', { scale: 1, x: 0, y: 0 }, 7.02);

    // 4. le resultat : les barres montent, le taux grimpe, tout le monde est dans la boucle
    legende(3, 7.1);
    tl.set('#f-stats', { autoAlpha: 1 }, 7.02)
      .fromTo('.f-barre', { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 100%', duration: .45, stagger: .08, ease: 'back.out(1.7)' }, 7.15)
      .fromTo(compteur, { v: 0 }, { v: 92, duration: .8, ease: 'power2.out', onUpdate: function () { pct.textContent = Math.round(compteur.v) + '%'; } }, 7.2)
      .fromTo('#f-pct', { scale: .6 }, { scale: 1, duration: .5, ease: 'back.out(2)', svgOrigin: '740 190' }, 7.2)
      .to('#f-souligne', { strokeDashoffset: 0, duration: .3 }, 7.95)
      .fromTo('.f-tete', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .35, stagger: .1, ease: 'back.out(2.5)', transformOrigin: '50% 50%' }, 7.55)
      .fromTo('#f-cloche', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2.5)', svgOrigin: '740 392' }, 7.6)
      .to('#f-boucle', { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, 7.8)
      .fromTo('#f-messager', { autoAlpha: 0, rotation: 0 }, { autoAlpha: 1, rotation: 360, duration: .75, ease: 'power1.inOut', svgOrigin: '740 390' }, 8.05)
      .to('#f-cloche', { keyframes: { rotation: [16, -13, 9, -6, 3, 0] }, duration: .6, ease: 'none', svgOrigin: '740 370' }, 8.1)
      .fromTo('#f-badge', { scale: 0 }, { scale: 1, duration: .3, ease: 'back.out(3)', transformOrigin: '50% 50%' }, 8.15)
      .to('#f-stats', { autoAlpha: 0, y: 24, duration: .22, ease: 'power2.in' }, 8.78);

    // 5. la chute : la mascotte revient au centre sous les confettis
    legende(4, 9.05);
    tl.to('#f-mascotte', { x: 0, scale: 1, duration: .45, ease: 'back.out(1.6)', svgOrigin: M }, 9)
      .to('#f-mascotte', { y: -60, duration: .2, ease: 'power2.out' }, 9)
      .to('#f-mascotte', { y: -20, duration: .3, ease: 'bounce.out' }, 9.2)
      .to('#f-antennes', { keyframes: { rotation: [-10, 8, -5, 0] }, duration: .5, ease: 'none', transformOrigin: '50% 100%' }, 9.3)
      .to('#f-nom', { autoAlpha: 1, y: 0, scale: 1, duration: .35, ease: 'back.out(2.5)' }, 9.3)
      .to('#f-oeil-d', { scaleY: .1, transformOrigin: '50% 60%', duration: .08, yoyo: true, repeat: 1, ease: 'none' }, 9.7);
    // confettis dessines : ils partent du centre et retombent avec la gravite
    var couleurs = ['var(--dd-jaune)', 'var(--dd-rose)', 'var(--dd-sarcelle)', 'var(--dd-encre)'], NS = 'http://www.w3.org/2000/svg';
    for (var k = 0; k < 22; k++) {
      var c = document.createElementNS(NS, 'path');
      c.setAttribute('d', k % 3 === 0 ? 'M-7 0 c 3 -5, 7 5, 14 0' : k % 3 === 1 ? 'M-6 -3 h12 v6 h-12 Z' : 'M0 -5 l5 5 l-5 5 l-5 -5 Z');
      c.setAttribute('fill', k % 3 === 0 ? 'none' : couleurs[k % 4]);
      c.setAttribute('stroke', k % 3 === 0 ? couleurs[k % 4] : 'var(--dd-encre)');
      c.setAttribute('stroke-width', k % 3 === 0 ? 4 : 1.5);
      conf.appendChild(c);
      var a = Math.PI * 2 * k / 22 + gsap.utils.random(-.15, .15), dist = gsap.utils.random(170, 380);
      tl.fromTo(c, { autoAlpha: 1, x: 480, y: 229, scale: 0, rotation: 0 },
          { x: 480 + Math.cos(a) * dist, y: 229 + Math.sin(a) * dist * .7 - 80, scale: gsap.utils.random(.8, 1.4), rotation: gsap.utils.random(-360, 360), duration: .5, ease: 'power3.out' }, 9.02)
        .to(c, { y: '+=' + gsap.utils.random(120, 220), rotation: '+=' + gsap.utils.random(-180, 180), autoAlpha: 0, duration: .55, ease: 'power2.in' }, 9.45);
    }
  }

  /* ================= Lecteur : 80 % de l'ecran, un clic sur le fond le ferme ================= */
  var lenis = null, retour = null;
  function clavier(e) { if (e.key === 'Escape') fermer(); }
  function rejouer() { film.classList.remove('fini'); scene.classList.remove('en-pause'); tl.restart(); lancerSon(); }
  function ouvrir(l) {
    lenis = l || null; retour = document.activeElement;
    film.hidden = false; if (vitrine) vitrine.inert = true;
    if (!tl) construire();
    document.documentElement.style.overflow = 'hidden'; if (lenis) lenis.stop();
    audio(); majSon();
    gsap.fromTo(film, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3 });
    gsap.fromTo(cadre, { scale: .7, y: 60, rotation: -4 }, { scale: 1, y: 0, rotation: -.6, duration: .6, ease: 'back.out(1.5)' });
    gsap.delayedCall(.35, rejouer);
    $('.dd-film-fermer').focus({ preventScroll: true });
    addEventListener('keydown', clavier);
  }
  function fermer() {
    tl.pause(); couperSon(); removeEventListener('keydown', clavier);
    gsap.to(cadre, { scale: .85, y: 40, rotation: 3, duration: .3, ease: 'power2.in' });
    gsap.to(film, { autoAlpha: 0, duration: .3, onComplete: function () { film.hidden = true; } });
    if (vitrine) vitrine.inert = false;
    document.documentElement.style.overflow = ''; if (lenis) lenis.start();
    if (ac) ac.suspend();
    if (retour && retour.focus) retour.focus({ preventScroll: true });
  }
  function basculer() {
    // le premier toucher sert d'abord a debloquer le son, sans couper le film
    if (actif && ac && ac.state !== 'running') { audio(); return; }
    if (film.classList.contains('fini')) { rejouer(); return; }
    tl.paused(!tl.paused()); scene.classList.toggle('en-pause', tl.paused());
    tl.paused() ? couperSon() : lancerSon();
  }

  film.addEventListener('click', function (e) { if (e.target === film) fermer(); });
  scene.addEventListener('click', basculer);
  scene.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); basculer(); } });
  $('.dd-film-fermer').addEventListener('click', fermer);
  $('.dd-film-revoir').addEventListener('click', rejouer);
  $('.dd-film-son').addEventListener('click', function () {
    if (ac && ac.state !== 'running') actif = true; else actif = !actif;
    audio(); majSon();
  });

  window.afFilm = { ouvrir: ouvrir };
})();
