/* AttendFlow : theme clair/sombre, fond shader + particules, curseur lumineux, verre reactif,
   profondeur 3D, prechargement, defilement doux et mouvement d'entree. */
(function () {
  'use strict';

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactile = window.matchMedia('(pointer: coarse)').matches;
  var $$ = function (sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); };
  var racine = document.documentElement;
  /* Pause des animations (WCAG 2.2.2) : tout ce qui bouge plus de 5 s peut etre arrete, choix memorise */
  var ambiance = [];
  function enPause() { return racine.classList.contains('af-calme'); }
  function appliquerPause(oui) {
    racine.classList.toggle('af-calme', oui);
    try { localStorage.setItem('af-calme', oui ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
    // bouton bascule : libelle fixe, l'etat passe par aria-pressed
    Array.prototype.forEach.call(document.querySelectorAll('.af-pause'), function (b) { b.setAttribute('aria-pressed', oui ? 'true' : 'false'); });
    ambiance.forEach(function (t) { oui ? t.pause() : t.resume(); });
    document.dispatchEvent(new CustomEvent('af:pause', { detail: oui }));
  }
  try { if (localStorage.getItem('af-calme') === '1') racine.classList.add('af-calme'); } catch (e) { /* ok */ }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.af-pause');
    if (b) appliquerPause(!enPause());
  });
  // en pause, une image figee est redessinee une fois si la fenetre change de taille ou de theme
  var versionImage = 0;
  window.addEventListener('resize', function () { versionImage++; });
  document.addEventListener('af:theme', function () { versionImage++; });
  var souris = { x: .5, y: .5 }, cibleSouris = { x: .5, y: .5 };
  if (!tactile) document.addEventListener('pointermove', function (e) {
    cibleSouris.x = e.clientX / window.innerWidth; cibleSouris.y = e.clientY / window.innerHeight;
  }, { passive: true });

  /* ================= Langue : le serveur retient le choix (cookie, et compte si connecte) ================= */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.af-langue');
    if (!b) return;
    var u = new URL(location.href);
    u.searchParams.set('lang', b.getAttribute('data-lang'));
    location.href = u.toString();
  });

  /* ================= Theme clair / sombre ================= */
  function theme() { return racine.getAttribute('data-bs-theme') || 'dark'; }
  function appliquerTheme(t) {
    racine.setAttribute('data-bs-theme', t);
    try { localStorage.setItem('af-theme', t); } catch (e) { /* stockage indisponible */ }
    document.querySelector('meta[name=theme-color]') && document.querySelector('meta[name=theme-color]').setAttribute('content', t === 'light' ? '#fbf5e8' : '#22302a');
    document.dispatchEvent(new CustomEvent('af:theme', { detail: t }));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.af-theme:not(.af-pause):not(.af-langue)');
    if (!b) return;
    var suivant = theme() === 'dark' ? 'light' : 'dark';
    // Transition circulaire depuis le bouton quand le navigateur sait le faire
    if (document.startViewTransition && !calme) {
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var rayon = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      // pendant le cercle : une seule image, pas de fondus parasites ni de groupes nommes qui basculent avant lui
      racine.classList.add('af-vt-theme');
      var vt = document.startViewTransition(function () { appliquerTheme(suivant); });
      vt.finished.catch(function () {}).finally(function () { racine.classList.remove('af-vt-theme'); });
      vt.ready.then(function () {
        racine.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + rayon + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () { /* transition interrompue (double clic, navigation) : le theme est deja applique */ });
    } else appliquerTheme(suivant);
  });

  /* ================= Fond : shader WebGL (aurora fluide) ================= */
  function shader() {
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
      'vec3 c1=vec3(.12,.30,.62);vec3 c2=vec3(.17,.77,.71);vec3 c3=vec3(.24,.50,.88);vec3 c4=vec3(.20,.62,.80);' +
      'vec3 col=mix(c1,c2,smoothstep(.1,.8,q1+.5));col=mix(col,c3,smoothstep(.2,.9,q2+.5));col=mix(col,c4,smoothstep(.6,1.,q3+.5)*.45);' +
      'float lum=smoothstep(.15,1.,(q1+q2)*.5+.55);' +
      'vec3 sombre=vec3(.031,.071,.11);vec3 clair=vec3(.933,.953,.965);vec3 base=mix(sombre,clair,uLight);' +
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
    document.addEventListener('af:theme', function (e) { clairCible = e.detail === 'light' ? 1 : 0; if (racine.classList.contains('af-vt-theme')) clair = clairCible; });
    // espace connecte : fond plafonne a ~30 images/s, la vitrine garde la pleine cadence
    var pas = document.querySelector('.af-sidebar') ? 33 : 0;
    function taille() { c.width = Math.max(2, Math.floor(window.innerWidth * .5)); c.height = Math.max(2, Math.floor(window.innerHeight * .5)); gl.viewport(0, 0, c.width, c.height); }
    taille(); window.addEventListener('resize', taille);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    var debut = performance.now();
    (function trame(now) {
      requestAnimationFrame(trame);
      if (!visible || (enPause() && trame.v === versionImage)) return;   // en pause : la derniere image reste affichee
      if (now - (trame.t || 0) < pas) return; trame.t = now;
      trame.v = versionImage;
      souris.x += (cibleSouris.x - souris.x) * .04; souris.y += (cibleSouris.y - souris.y) * .04;
      clair += (clairCible - clair) * .06;
      if (enPause()) clair = clairCible;
      gl.uniform2f(uRes, c.width, c.height);
      gl.uniform1f(uTime, (now - debut) / 1000);
      gl.uniform2f(uMouse, souris.x, 1 - souris.y);
      gl.uniform1f(uLight, clair);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(debut);
  }

  /* ================= Particules (etoiles qui derivent, reliees quand proches) ================= */
  function particules() {
    var c = document.querySelector('canvas.af-particules');
    if (!c || calme) return;
    var ctx = c.getContext('2d'), pts = [], N = tactile ? 35 : 80, W, H;
    function taille() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    taille(); window.addEventListener('resize', taille);
    for (var i = 0; i < N; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .7, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, ph: Math.random() * 6.28 });
    var halo = document.createElement('canvas'); halo.width = halo.height = 64;
    var hc = halo.getContext('2d'), g = hc.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(214,244,240,1)'); g.addColorStop(.35, 'rgba(127,224,213,.55)'); g.addColorStop(1, 'rgba(127,224,213,0)');
    hc.fillStyle = g; hc.fillRect(0, 0, 64, 64);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    (function trame(t) {
      requestAnimationFrame(trame);
      if (!visible || (enPause() && trame.v === versionImage)) return;   // en pause : la derniere image reste affichee
      trame.v = versionImage;
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
        if (d < 130) { ctx.strokeStyle = 'rgba(127,224,213,' + (.14 * (1 - d / 130)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a2._x, a2._y); ctx.lineTo(b._x, b._y); ctx.stroke(); }
      }
    })(0);
  }

  /* Le fond anime demarre juste apres le premier affichage (et entre en fondu) : il ne rivalise plus
     avec le chargement de la page, ou chaque surface en verre doit deja etre floutee une premiere fois */
  var fondLance = false;
  function demarrerFond() {
    if (fondLance) return; fondLance = true;
    shader(); particules();
    requestAnimationFrame(function () { racine.classList.remove('af-fond-attente'); });
    setTimeout(function () { racine.classList.remove('af-fond-attente'); }, 400);
  }
  if (document.readyState === 'complete') setTimeout(demarrerFond, 120);
  else { addEventListener('load', function () { setTimeout(demarrerFond, 120); }); setTimeout(demarrerFond, 1500); }

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
    var fermer = document.createElement('button'); fermer.type = 'button'; fermer.className = 'btn-close'; fermer.setAttribute('aria-label', racine.lang === 'en' ? 'Close' : 'Fermer');
    fermer.addEventListener('click', function () { masquer(a); }); a.appendChild(fermer);
    if (a.classList.contains('alert-success')) setTimeout(function () { masquer(a); }, 6000);
  });
  function masquer(a) { if (!a.isConnected) return; a.classList.add('af-sortie'); setTimeout(function () { a.hidden = true; }, calme ? 0 : 260); }

  /* ================= Icones : tracees au crayon ================= */
  // un filtre SVG unique deforme tres legerement les traits, comme dessines a main levee
  if (!document.getElementById('dd-crayon')) {
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true');
    defs.style.position = 'absolute';
    defs.innerHTML = '<filter id="dd-crayon" x="-10%" y="-10%" width="120%" height="120%">'
      + '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="bruit"/>'
      + '<feDisplacementMap in="SourceGraphic" in2="bruit" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(defs);
  }
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

  // emploi du temps : la seance choisie recharge la page, on descend jusqu'a son detail
  var detail = document.getElementById('detail-seance');
  if (detail) {
    var titreDetail = document.getElementById('detail-titre');
    titreDetail.setAttribute('tabindex', '-1');
    titreDetail.focus({ preventScroll: true });   // lecteurs d'ecran et clavier arrivent sur le detail
    // grille plus large que l'ecran (telephone) : la seance choisie est ramenee au centre de sa ligne
    var choisie = document.querySelector('.af-seance.af-selection'), boite = choisie && choisie.closest('.overflow-auto');
    if (boite) {
      var rc = choisie.getBoundingClientRect(), rb = boite.getBoundingClientRect();
      boite.scrollLeft += rc.left - rb.left - (rb.width - rc.width) / 2;
    }
    setTimeout(function () {
      if (lenis) lenis.scrollTo(detail, { offset: -24, duration: 1.2 });
      else detail.scrollIntoView({ block: 'start' });
    }, calme ? 0 : 350);
  }

  /* ================= Annotations au feutre (Rough Notation) ================= */
  // soulignes, cercles et crochets traces a la main, dessines quand l'element arrive a l'ecran
  (function annoter() {
    if (!window.RoughNotation || !window.IntersectionObserver) return;
    var couleur = function (v) { return getComputedStyle(racine).getPropertyValue(v).trim(); };
    var notes = [];
    var noter = function (el, type, jeton, o) {
      o = o || {};
      o.type = type; o.color = couleur(jeton); o.animate = !calme; o.animationDuration = 850;
      // un titre est un bloc pleine largeur : on annote une enveloppe en ligne pour que le trait suive le texte
      var cible = el;
      if (o.texte) {
        cible = document.createElement('span');
        while (el.firstChild) cible.appendChild(el.firstChild);
        el.appendChild(cible);
        delete o.texte;
      }
      notes.push({ el: el, jeton: jeton, a: RoughNotation.annotate(cible, o) });
    };
    $$('.af-vitrine .af-h2').forEach(function (el) { noter(el, 'underline', '--dd-sarcelle', { texte: true, strokeWidth: 3, padding: 4, iterations: 2, multiline: true }); });
    $$('.af-chiffres .af-grand').forEach(function (el) { noter(el, 'circle', '--dd-rose', { strokeWidth: 2.5, padding: [6, 16] }); });
    $$('.af-cta h2').forEach(function (el) { noter(el, 'bracket', '--dd-rose', { texte: true, brackets: ['left', 'right'], strokeWidth: 3, padding: [4, 10] }); });
    $$('.af-login-hero h1').forEach(function (el) { noter(el, 'underline', '--dd-sarcelle', { texte: true, strokeWidth: 3, padding: 4, multiline: true }); });
    if (!notes.length) return;
    // apres l'entree de la section (elle glisse de 30 px), sinon le trait se poserait a l'ancienne place
    var io = new IntersectionObserver(function (vus) {
      vus.forEach(function (v) {
        if (!v.isIntersecting) return;
        io.unobserve(v.target);
        notes.forEach(function (n) { if (n.el === v.target) setTimeout(function () { n.a.show(); }, calme ? 0 : 950); });
      });
    }, { threshold: .6 });
    notes.forEach(function (n) { io.observe(n.el); });
    // le theme change : les traits prennent la couleur de la craie ou du feutre
    document.addEventListener('af:theme', function () {
      setTimeout(function () { notes.forEach(function (n) { n.a.color = couleur(n.jeton); }); }, 60);
    });
  })();

  /* ================= Mouvement (GSAP) ================= */
  if (!window.gsap) {
    // sans GSAP : rien ne reste masque, le rideau de chargement s'en va
    racine.classList.remove('af-prep');
    var rideau = document.querySelector('.af-chargement'); if (rideau) rideau.remove();
    appliquerPause(enPause());
    return;
  }
  // une entree ne se rejoue jamais sur un contenu deja montre par le filet de securite du <head>
  var entreeAJouer = racine.classList.contains('af-prep');
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

  /* Filet de securite : si les images ne defilent pas (onglet en arriere-plan, appareil a la peine),
     l'entree saute a son etat final ; le contenu ne reste jamais cache */
  var entrees = [];
  setTimeout(function () {
    entrees.forEach(function (t) { if (t.progress() < 1) t.progress(1); });
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight && getComputedStyle(el).opacity === '0') gsap.set(el, { clearProps: 'transform,opacity,visibility' });
    });
  }, (retard + 2.5) * 1000);

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
      // le leger soulevement du survol et l'appui passent par GSAP, sinon la transform en ligne les annule
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .28); y((e.clientY - r.top - r.height / 2) * .4 - 2); });
      el.addEventListener('pointerleave', function () { x(0); y(0); gsap.to(el, { scale: 1, duration: .2 }); });
      el.addEventListener('pointerdown', function () { gsap.to(el, { scale: .97, duration: .1 }); });
      el.addEventListener('pointerup', function () { gsap.to(el, { scale: 1, duration: .2 }); });
    });

    /* Orbes */
    var orbes = $$('.af-orbe');
    orbes.forEach(function (o, i) { ambiance.push(gsap.to(o, { y: '+=' + (30 + i * 12), x: '+=' + (i % 2 ? -22 : 22), duration: 7 + i * 1.5, yoyo: true, repeat: -1, ease: 'sine.inOut' })); });
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
      flots.forEach(function (f, i) { gsap.set(f, { z: parseFloat(f.getAttribute('data-z')) || 0 }); ambiance.push(gsap.to(f, { y: '+=' + (10 + i * 5), duration: 3.2 + i * .7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * .4 })); });
      entrees.push(gsap.from(flots, { z: '-=260', autoAlpha: 0, duration: 1.2, stagger: .12, delay: retard + .3 }));
      if (window.ScrollTrigger) gsap.to('.af-scene', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.af-hero', start: 'top top', end: 'bottom top', scrub: true } });
      objet3D();
    }
    /* Croquis : chaque trait (soulignement, fleche, etoile, fourmi) se dessine comme au feutre.
       Visible par defaut ; seule l'animation le cache au depart (pathLength="1" : longueur 0 a 1). */
    var traits = $$('.dd-dessin');
    if (traits.length) {
      entrees.push(gsap.fromTo(traits, { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut', stagger: .12, delay: retard + .5 }));
      // les tampons P / A / R tombent sur la feuille un par un, comme a l'appel
      entrees.push(gsap.from('.dd-tampon', { scale: 2.2, autoAlpha: 0, rotation: -30, duration: .35, ease: 'back.out(2.2)', stagger: .18, delay: retard + 1 }));
    }
    var yeux = document.querySelector('.dd-yeux'), antennes = document.querySelector('.dd-antennes');
    if (yeux) ambiance.push(gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: retard + 2 })
      .to(yeux, { scaleY: .08, transformOrigin: '50% 50%', duration: .09, ease: 'power1.in' })
      .to(yeux, { scaleY: 1, duration: .14, ease: 'power1.out' }));
    if (antennes) ambiance.push(gsap.fromTo(antennes, { rotation: -3, transformOrigin: '50% 100%' },
      { rotation: 3, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    var titre = document.querySelector('.af-hero h1');
    if (titre && !titre.dataset.decoupe) {
      titre.dataset.decoupe = '1';
      titre.innerHTML = titre.innerHTML.split(/(<[^>]+>|\s+)/).map(function (m) { return (!m || /^\s+$/.test(m) || m[0] === '<') ? m : '<span class="af-mot">' + m + '</span>'; }).join('');
      if (entreeAJouer) {
        entrees.push(gsap.from('.af-hero .af-mot', { yPercent: 110, autoAlpha: 0, duration: .9, stagger: .05, ease: 'power4.out', delay: retard + .1 }));
        entrees.push(gsap.from('.af-hero [data-hero]', { y: 18, autoAlpha: 0, duration: .8, stagger: .1, delay: retard + .5, clearProps: 'transform,opacity,visibility' }));
      }
      var rot = titre.querySelector('.af-rotatif');
      if (rot && rot.getAttribute('data-mots')) {
        var mots = rot.getAttribute('data-mots').split('|'), idx = 0, cycle = null, actif = true;
        // le trait se dessine apres l'arrivee des mots (et apres le rideau), pas en dessous de lui
        entrees.push(gsap.fromTo(rot, { '--trait': 0 }, { '--trait': 1, duration: .6, ease: 'power3.out', delay: retard + .8 }));
        // la largeur de la plus longue formule est reservee : le titre ne se reequilibre pas a chaque changement
        if (document.fonts) document.fonts.ready.then(function () {
          var t = rot.cloneNode(); t.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; rot.parentNode.appendChild(t);
          var large = Math.max.apply(null, mots.map(function (m) { t.textContent = m; return t.offsetWidth; }));
          rot.style.minWidth = (large / parseFloat(getComputedStyle(rot).fontSize)) + 'em'; t.remove();
        });
        var majCycle = function () { if (cycle) (actif && !enPause()) ? cycle.resume() : cycle.pause(); };
        // un cycle = une timeline : sortie rapide, echange, entree, puis le trait ambre se redessine
        var changer = function () {
          idx = (idx + 1) % mots.length;
          gsap.timeline({ defaults: { overwrite: true } })
            .to(rot.children, { yPercent: -100, autoAlpha: 0, duration: .3, ease: 'power3.in', stagger: .03 })
            .to(rot, { '--trait': 0, duration: .3, ease: 'power2.in' }, '<')
            .call(function () {
              // les nouveaux mots n'existent qu'apres l'echange : leur entree est une seconde timeline
              rot.innerHTML = mots[idx].split(' ').map(function (w) { return '<span class="af-mot">' + w + '</span>'; }).join(' ');
              gsap.timeline({ onComplete: function () { cycle = gsap.delayedCall(2.6, changer); majCycle(); } })
                .from(rot.children, { yPercent: 100, autoAlpha: 0, duration: .55, ease: 'power4.out', stagger: .045 })
                .to(rot, { '--trait': 1, duration: .6, ease: 'power3.out' }, '<.15');
            });
        };
        cycle = gsap.delayedCall(3.2 + retard, changer);
        // en pause, hors ecran ou onglet cache : la rotation s'arrete ; elle ne reprend que si rien ne la retient
        document.addEventListener('af:pause', majCycle); majCycle();
        if (window.ScrollTrigger) ScrollTrigger.create({ trigger: '.af-hero', start: 'top bottom', end: 'bottom top',
          onToggle: function (st) { actif = st.isActive; majCycle(); } });
      }
    }
    var reveals = $$('[data-reveal]');
    if (reveals.length && window.ScrollTrigger) {
      gsap.set(reveals, { y: 30, autoAlpha: 0 });
      // clearProps garde la transform : l'inclinaison 3D des cartes revelees conserve sa perspective
      ScrollTrigger.batch(reveals, { start: 'top bottom', once: true, onEnter: function (lot) { gsap.to(lot, { y: 0, autoAlpha: 1, duration: .8, stagger: .08, clearProps: 'opacity,visibility' }); } });
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
      // outil utilise tous les jours : entree breve, cascade bornee quel que soit le nombre de blocs
      if (entreeAJouer) gsap.from(visibles, { y: 14, autoAlpha: 0, duration: .45, stagger: { amount: .25 }, clearProps: 'transform,opacity,visibility' });
      if (window.ScrollTrigger && plusBas.length) {
        gsap.set(plusBas, { y: 24, autoAlpha: 0 });
        ScrollTrigger.batch(plusBas, { start: 'top 92%', once: true, onEnter: function (lot) { gsap.to(lot, { y: 0, autoAlpha: 1, stagger: .07, clearProps: 'transform,opacity,visibility' }); } });
      }
      $$('table tbody', main).forEach(function (tb) {
        var lignes = Array.prototype.slice.call(tb.rows);
        if (lignes.length > 1 && lignes.length <= 40) gsap.from(lignes, { autoAlpha: 0, x: -6, duration: .3, stagger: { amount: .3 }, delay: .1, clearProps: 'transform,opacity,visibility' });
      });
      $$('[aria-live] [id^="nb-"]', main).forEach(function (el) {
        new MutationObserver(function () { gsap.fromTo(el, { scale: 1.25 }, { scale: 1, duration: .4, ease: 'back.out(3)', overwrite: true }); }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    }
  });
  racine.classList.remove('af-prep');
  appliquerPause(enPause());

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
    groupe.add(new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: 0x7fe0d5, transparent: true, opacity: .55 })));
    groupe.add(new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0x2bc4b4, transparent: true, opacity: .06 })));
    // Anneau de particules
    var nb = 900, pos = new Float32Array(nb * 3);
    for (var i = 0; i < nb; i++) { var a = Math.random() * Math.PI * 2, r = 3 + (Math.random() - .5) * .5; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - .5) * .25; pos[i * 3 + 2] = Math.sin(a) * r; }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var anneau = new T.Points(pg, new T.PointsMaterial({ color: 0xf4a940, size: .035, transparent: true, opacity: .9 }));
    anneau.rotation.x = Math.PI / 2.6; groupe.add(anneau);
    // Nuage d'etoiles lointaines
    var ne = 500, pe = new Float32Array(ne * 3);
    for (var j = 0; j < ne; j++) { pe[j * 3] = (Math.random() - .5) * 24; pe[j * 3 + 1] = (Math.random() - .5) * 16; pe[j * 3 + 2] = -4 - Math.random() * 8; }
    var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(pe, 3));
    sc.add(new T.Points(eg, new T.PointsMaterial({ color: 0xd6f4f0, size: .03, transparent: true, opacity: .6 })));
    function taille() { largeur = conteneur.clientWidth; hauteurC = conteneur.clientHeight; cam.aspect = largeur / hauteurC; cam.updateProjectionMatrix(); rendu.setSize(largeur, hauteurC); }
    window.addEventListener('resize', taille);
    var visible = true; document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    // l'objet ne se dessine que lorsqu'il est a l'ecran
    var enVue = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { enVue = e[0].isIntersecting; }).observe(conteneur);
    (function trame(t) {
      requestAnimationFrame(trame);
      if (!visible || !enVue || (enPause() && trame.v === versionImage)) return;   // en pause : la derniere image reste affichee
      trame.v = versionImage;
      groupe.rotation.y = t * .00018 + (souris.x - .5) * .6;
      groupe.rotation.x = Math.sin(t * .0002) * .15 + (souris.y - .5) * .4;
      anneau.rotation.z = t * .00025;
      rendu.render(sc, cam);
    })(0);
  }
})();
