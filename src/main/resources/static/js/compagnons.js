(function () {
  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var en = document.documentElement.lang === 'en';
  function confettis(opts) {
    if (calme || !window.confetti) return;
    var c = ['#ffd93d', '#ff6fa3', '#13a89e', '#1f1d1a', '#fffaf0'];
    confetti(Object.assign({ particleCount: 120, spread: 80, origin: { y: .6 }, colors: c, disableForReducedMotion: true }, opts));
  }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function toast(html) {
    var t = document.createElement('div');
    t.className = 'af-toast af-glass'; t.setAttribute('role', 'status'); t.innerHTML = html;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('visible'); });
    setTimeout(function () { t.classList.remove('visible'); setTimeout(function () { t.remove(); }, 300); }, 3800);
  }

  var compagnon = document.querySelector('[data-compagnon]');
  if (compagnon) {
    var nom = compagnon.dataset.nom, bulle = document.querySelector('.af-bulle');
    var phrases = [
      en ? 'Hey, that tickles!' : 'Hé, ça chatouille !',
      en ? nom + ' checked: your next class is waiting for you.' : nom + ' a vérifié : ta prochaine séance t’attend.',
      en ? 'One class a day keeps the catch-up away.' : 'Une présence par jour éloigne les rattrapages.',
      en ? 'Tip: a note uploaded early gets reviewed faster.' : 'Astuce : un justificatif déposé tôt est validé plus vite.',
      en ? 'I nap between classes. You don’t!' : 'Je fais la sieste entre deux cours. Toi, non !',
      en ? 'Shall we go for the next badge together?' : 'On vise le badge suivant ensemble ?',
      en ? 'Did you know? Late counts 5 points, present 10.' : 'Tu savais ? Le retard compte 5 points, la présence 10.',
      en ? 'Beep boop… ' + nom + ' likes you.' : 'Bip boup… ' + nom + ' t’aime bien.'
    ];
    var i = 0;
    compagnon.addEventListener('click', function () {
      var img = compagnon.querySelector('img');
      if (window.gsap && !calme) {
        gsap.killTweensOf(compagnon);
        gsap.timeline().set(compagnon, { transformOrigin: '50% 100%' })
          .to(compagnon, { y: -22, scaleX: .92, scaleY: 1.08, duration: .22, ease: 'power2.out' })
          .to(compagnon, { y: 0, scaleX: 1.08, scaleY: .92, duration: .18, ease: 'power2.in' })
          .to(compagnon, { scaleX: 1, scaleY: 1, duration: .5, ease: 'elastic.out(1, .4)' });
      }
      if (bulle) { bulle.textContent = phrases[i++ % phrases.length]; }
      if (!calme) for (var k = 0; k < 5; k++) {
        var c = document.createElement('span'); c.className = 'af-coeur'; c.textContent = '♥';
        c.style.left = (30 + Math.random() * 40) + '%'; c.style.animationDelay = (k * .08) + 's';
        compagnon.appendChild(c); setTimeout(function (el) { el.remove(); }, 1400, c);
      }
    });

    var badges = +compagnon.dataset.badges, niveau = +compagnon.dataset.niveau;
    var avantB = lire('af-badges'), avantN = lire('af-niveau');
    if (avantB !== null && badges > +avantB) {
      setTimeout(function () { confettis(); toast('<i data-lucide="award"></i> ' + (en ? 'New badge unlocked!' : 'Nouveau badge débloqué !')); window.lucide && lucide.createIcons(); }, 900);
    } else if (avantN !== null && niveau > +avantN) {
      setTimeout(function () { confettis({ particleCount: 160 }); toast('<i data-lucide="star"></i> ' + (en ? 'Level ' + niveau + ' reached!' : 'Niveau ' + niveau + ' atteint !')); window.lucide && lucide.createIcons(); }, 900);
    }
    ecrire('af-badges', badges); ecrire('af-niveau', niveau);
  }

  var tous = document.getElementById('tous-presents');
  if (tous) tous.addEventListener('click', function () {
    var r = tous.getBoundingClientRect();
    confettis({ particleCount: 70, spread: 60, origin: { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight } });
  });

  var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
  document.addEventListener('keydown', function (e) {
    pos = (e.key === code[pos]) ? pos + 1 : (e.key === code[0] ? 1 : 0);
    if (pos < code.length) return;
    pos = 0;
    var noms = ['plume', 'tic', 'pousse', 'bulle', 'filou', 'comete'];
    if (calme) return;
    for (var n = 0; n < 36; n++) {
      var img = document.createElement('img');
      img.src = '/images/mascottes/' + noms[n % 6] + '.svg'; img.alt = ''; img.className = 'af-pluie';
      img.style.left = Math.random() * 100 + 'vw'; img.style.animationDuration = (2.5 + Math.random() * 2) + 's';
      img.style.animationDelay = Math.random() * 1.5 + 's'; img.style.width = (40 + Math.random() * 50) + 'px';
      document.body.appendChild(img); setTimeout(function (el) { el.remove(); }, 6500, img);
    }
    confettis({ particleCount: 200, spread: 120 });
  });
})();
