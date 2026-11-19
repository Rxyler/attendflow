/* Fas3a : petit film de 10 s joue une fois apres l'intro de la vitrine (ouvert par attendflow.js).
   Tout est dessine en SVG et anime par une seule timeline GSAP ; les sons sont synthetises (Web Audio, aucun fichier). */
(function () {
  'use strict';
  var film = document.querySelector('.dd-film');
  if (!film || !window.gsap) return;
  var $ = function (s) { return film.querySelector(s); }, $$ = function (s) { return film.querySelectorAll(s); };
  var cadre = $('.dd-film-cadre'), scene = $('.dd-film-scene'), legendes = $$('.dd-film-legendes p'),
      progres = $('.dd-film-progres span'), vitrine = document.querySelector('.af-vitrine');

  /* ---------- Sons : crayon qui gratte, pop, tic, tampon, ding ---------- */
  var ac = null, maitre = null, actif = true;
  function audio() {
    if (!ac) {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      ac = new A(); maitre = ac.createGain(); maitre.gain.value = .5; maitre.connect(ac.destination);
      ac.onstatechange = majSon;
    }
    if (ac.state !== 'running') ac.resume().catch(function () {});
  }
  function ton(f1, f2, type, vol, dur, dec) {
    var t = ac.currentTime + (dec || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(maitre); o.start(t); o.stop(t + dur + .02);
  }
  function bruit(dur, freq, vol, montee) {
    var t = ac.currentTime, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0);
    for (var i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = b; f.type = 'bandpass'; f.Q.value = 1; f.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(.0001, t);
    if (montee) {   // souffle : le filtre monte, le volume gonfle puis retombe
      f.frequency.exponentialRampToValueAtTime(montee, t + dur);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    } else {        // crayon : il gratte par a-coups
      for (var k = 0; k + .1 < dur; k += .11) { g.gain.linearRampToValueAtTime(vol, t + k + .04); g.gain.linearRampToValueAtTime(vol * .15, t + k + .1); }
      g.gain.linearRampToValueAtTime(.0001, t + dur);
    }
    s.connect(f).connect(g).connect(maitre); s.start(t); s.stop(t + dur);
  }
  var sons = {
    gribouille: function () { bruit(1.4, 3600, .35); },
    souffle: function () { bruit(.45, 300, .4, 2600); },
    pop: function () { ton(280, 900, 'sine', .4, .14); },
    tic: function (p) { ton(900 * p, 1300 * p, 'triangle', .25, .08); },
    non: function () { ton(330, 190, 'triangle', .3, .22); },
    tampon: function () { ton(150, 45, 'sine', .8, .25); },
    ding: function () { ton(1320, 1320, 'sine', .22, .7); ton(1760, 1760, 'sine', .14, .7, .09); },
    fin: function () { [523, 659, 784, 1047].forEach(function (f, i) { ton(f, f, 'triangle', .22, .5, i * .08); }); }
  };
  function son(nom, p) { return function () { if (actif && ac && ac.state === 'running') sons[nom](p); }; }
  // le navigateur bloque le son tant que le visiteur n'a pas touche la page : on l'invite a le faire
  function majSon() {
    var marche = actif && ac && ac.state === 'running';
    film.classList.toggle('muet', !marche);
    film.classList.toggle('verrouille', actif && !marche);
    $('.dd-film-son').setAttribute('aria-pressed', marche ? 'true' : 'false');
  }

  /* ---------- Le film : 5 temps, 10 s ---------- */
  // construit a la premiere ouverture : cache, le SVG n'a pas de dimensions et les origines de rotation seraient fausses
  var tl = null;
  function construire() {
    tl = gsap.timeline({
      paused: true, defaults: { ease: 'power2.out', smoothOrigin: false },
      onUpdate: function () { progres.style.transform = 'scaleX(' + tl.progress() + ')'; },
      onComplete: function () { film.classList.add('fini'); }
    });
    function legende(i, t) {
      tl.to(legendes, { autoAlpha: 0, y: -8, duration: .2 }, t)
        .fromTo(legendes[i], { autoAlpha: 0, y: 12, rotation: -1.5 }, { autoAlpha: 1, y: 0, rotation: 0, duration: .35, ease: 'back.out(2)' }, t + .15);
    }
    var coches = $$('.f-coche'), pct = $('#f-pct'), compteur = { v: 0 };

    // 1. le probleme : la feuille papier, le crayon qui s'acharne, l'horloge qui file
    legende(0, 0);
    tl.fromTo('#f-feuille', { autoAlpha: 0, y: 60, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: .45, ease: 'back.out(1.6)', svgOrigin: '460 270' }, 0)
      .fromTo('#f-horloge', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2)', svgOrigin: '780 190' }, .25)
      .call(son('pop'), null, .25)
      .to('.f-aiguille', { rotation: 720, svgOrigin: '780 190', duration: 1.6, ease: 'none' }, .3)
      .to('.f-aiguille2', { rotation: 60, svgOrigin: '780 190', duration: 1.6, ease: 'none' }, .3)
      .fromTo('#f-crayon', { autoAlpha: 0, x: 60, y: -150 }, { autoAlpha: 1, x: -120, y: -110, duration: .3 }, .2)
      .to('#f-crayon', { keyframes: { x: [-60, -140, -80, -130, -60], y: [-60, -5, 60, 125, 180] }, duration: 1.2, ease: 'none' }, .5)
      .to('#f-feuille .f-trait', { strokeDashoffset: 0, duration: .22, stagger: .14 }, .4)
      .call(son('gribouille'), null, .4)
    // la feuille est froissee et jetee
      .to('#f-feuille', { autoAlpha: 0, scale: .15, rotation: 200, x: 500, y: -200, duration: .45, ease: 'power2.in', svgOrigin: '460 270' }, 1.95)
      .to('#f-crayon, #f-horloge', { autoAlpha: 0, y: '+=40', duration: .3 }, 1.95)
      .call(son('souffle'), null, 1.95);

    // 2. la solution : la mascotte arrive
    legende(1, 2.3);
    tl.fromTo('#f-mascotte', { autoAlpha: 0, scale: .2, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: .55, ease: 'back.out(1.8)', svgOrigin: '480 229' }, 2.35)
      .call(son('pop'), null, 2.35)
      .fromTo('#f-nom', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'back.out(2)' }, 2.7)
      .fromTo('#f-etoiles > *', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .3, stagger: .08, ease: 'back.out(3)', transformOrigin: '50% 50%' }, 2.8)
      .call(son('ding'), null, 2.85)
      .to('#f-yeux', { scaleY: .1, transformOrigin: '50% 75%', duration: .07, yoyo: true, repeat: 1, ease: 'none' }, 3.5)
    // elle se range dans le coin et regarde la suite
      .to('#f-mascotte', { scale: .3, x: -400, y: -178, duration: .5, ease: 'power3.inOut', svgOrigin: '480 229' }, 3.9)
      .to('#f-nom, #f-etoiles > *', { autoAlpha: 0, y: '-=10', duration: .25 }, 3.9);

    // 3. comment : les cases se cochent, une absence, un justificatif tamponne
    legende(2, 4.2);
    tl.fromTo('#f-carte', { autoAlpha: 0, y: 60, rotation: 3 }, { autoAlpha: 1, y: 0, rotation: -1, duration: .45, ease: 'back.out(1.5)', svgOrigin: '485 270' }, 4.15)
      .call(son('souffle'), null, 4.15)
      .to(coches[0], { strokeDashoffset: 0, duration: .2 }, 4.7).call(son('tic', 1), null, 4.7)
      .to(coches[1], { strokeDashoffset: 0, duration: .2 }, 5).call(son('tic', 1.12), null, 5)
      .set('#f-puce-absent', { attr: { fill: 'var(--dd-rose)' } }, 5.3)
      .to('#f-croix', { strokeDashoffset: 0, duration: .2 }, 5.3).call(son('non'), null, 5.3)
      .to(coches[2], { strokeDashoffset: 0, duration: .2 }, 5.6).call(son('tic', 1.25), null, 5.6)
      .fromTo('#f-justif', { autoAlpha: 0, x: 140, y: -90, rotation: 25 }, { autoAlpha: 1, x: -60, y: 0, rotation: -8, duration: .45, ease: 'power3.out', svgOrigin: '790 317' }, 5.9)
      .call(son('souffle'), null, 5.9)
      .fromTo('#f-tampon', { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: .18, ease: 'power4.in', svgOrigin: '633 328' }, 6.3)
      .call(son('tampon'), null, 6.46)
      .set('#f-puce-absent', { attr: { fill: 'var(--dd-jaune)' } }, 6.48)
      .to('#f-croix', { strokeDashoffset: 2, duration: .12 }, 6.48)
      .to('#f-ok', { strokeDashoffset: 0, duration: .2 }, 6.52)
      .call(son('ding'), null, 6.55)
      .to('#f-carte', { autoAlpha: 0, x: -200, rotation: -6, duration: .35, ease: 'power2.in', svgOrigin: '485 270' }, 6.95);

    // 4. le resultat : les chiffres montent, la cloche sonne pour tout le monde
    legende(3, 7.15);
    tl.to('#f-stats', { autoAlpha: 1, duration: .2 }, 7.15)
      .fromTo('.f-barre', { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 100%', duration: .4, stagger: .1, ease: 'back.out(1.6)' }, 7.25)
      .fromTo(compteur, { v: 0 }, { v: 92, duration: .9, ease: 'power2.out', onUpdate: function () { pct.textContent = Math.round(compteur.v) + '%'; } }, 7.3)
      .to('#f-stats .f-trait', { strokeDashoffset: 0, duration: .3 }, 8.1)
      .fromTo('#f-cloche', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .3, ease: 'back.out(2)' }, 7.6)
      .to('#f-cloche', { keyframes: { rotation: [14, -12, 9, -6, 0] }, duration: .6, svgOrigin: '740 360' }, 8.2)
      .fromTo('#f-badge', { scale: 0 }, { scale: 1, duration: .3, ease: 'back.out(3)', svgOrigin: '770 366' }, 8.25)
      .call(son('ding'), null, 8.2).call(son('ding'), null, 8.45)
      .to('#f-stats', { autoAlpha: 0, y: 30, duration: .3 }, 8.85);
    [0, 1, 2, 3, 4].forEach(function (i) { tl.call(son('tic', 1 + i * .15), null, 7.25 + i * .1); });

    // 5. la chute : la mascotte revient au centre
    legende(4, 9.1);
    tl.to('#f-mascotte', { scale: 1, x: 0, y: -20, duration: .55, ease: 'back.out(1.6)', svgOrigin: '480 229' }, 9.1)
      .call(son('fin'), null, 9.15)
      .to('#f-nom', { autoAlpha: 1, y: 0, duration: .3 }, 9.35)
      .to('#f-etoiles > *', { autoAlpha: 1, y: 0, rotation: '+=20', duration: .3, stagger: .05, ease: 'back.out(3)' }, 9.4)
      .to('#f-yeux', { scaleY: .1, transformOrigin: '50% 75%', duration: .07, yoyo: true, repeat: 1, ease: 'none' }, 9.85);
  }

  /* ---------- Lecteur : 80 % de l'ecran, un clic sur le fond le ferme ---------- */
  var lenis = null, retour = null;
  function clavier(e) { if (e.key === 'Escape') fermer(); }
  function rejouer() { film.classList.remove('fini'); scene.classList.remove('en-pause'); tl.restart(); }
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
    tl.pause(); removeEventListener('keydown', clavier);
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
