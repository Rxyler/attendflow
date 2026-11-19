/* Apparence commune des graphiques Chart.js, suit le theme clair / sombre. A charger juste apres chart.umd.min.js. */
(function () {
  if (!window.Chart) return;
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = Chart.defaults;
  function palette() {
    var clair = document.documentElement.getAttribute('data-bs-theme') === 'light';
    return clair
      ? { texte: '#4f6070', grille: 'rgba(15,23,42,.08)', bulle: 'rgba(255,255,255,.96)', bulleTexte: '#0d1b26', bord: 'rgba(15,23,42,.1)', arc: '#eef3f6' }
      : { texte: '#8fa1b0', grille: 'rgba(255,255,255,.08)', bulle: 'rgba(13,19,36,.95)', bulleTexte: '#eaf1f6', bord: 'rgba(255,255,255,.12)', arc: '#0a1824' };
  }
  function appliquer(p) {
    d.color = p.texte; d.borderColor = p.grille;
    d.plugins.tooltip.backgroundColor = p.bulle; d.plugins.tooltip.borderColor = p.bord; d.plugins.tooltip.titleColor = p.bulleTexte; d.plugins.tooltip.bodyColor = p.bulleTexte;
    d.elements.arc.borderColor = p.arc;
  }
  d.font.family = "'Manrope', ui-sans-serif, system-ui, sans-serif";
  d.font.size = 12;
  d.animation = calme ? false : { duration: 700, easing: 'easeOutCubic' };
  d.plugins.tooltip.borderWidth = 1;
  d.plugins.tooltip.titleFont = { weight: '600' };
  d.plugins.tooltip.padding = 10;
  d.plugins.tooltip.cornerRadius = 8;
  d.plugins.tooltip.displayColors = false;
  d.plugins.legend.labels.usePointStyle = true;
  d.plugins.legend.labels.boxWidth = 8;
  d.plugins.legend.labels.boxHeight = 8;
  d.scale.grid.drawTicks = false;
  d.scale.border = { display: false };
  d.scale.ticks.padding = 8;
  d.elements.bar.borderRadius = 6;
  d.elements.bar.borderSkipped = false;
  d.datasets.bar.maxBarThickness = 36;
  d.elements.arc.borderWidth = 2;
  d.interaction = { mode: 'index', intersect: false };
  d.scales.category.grid = { display: false };
  appliquer(palette());
  // Changement de theme : les graphiques deja traces se recolorent
  document.addEventListener('af:theme', function () {
    var p = palette(); appliquer(p);
    // Les couleurs viennent des defauts : un update() suffit (ecrire dans c.options casse les proxies de Chart.js)
    Object.values(Chart.instances).forEach(function (c) {
      if (c.config.type === 'doughnut') c.data.datasets.forEach(function (ds) { ds.borderColor = p.arc; });
      c.update();
    });
  });
})();
