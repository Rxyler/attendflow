/* Apparence commune des graphiques Chart.js, suit le theme clair / sombre. A charger juste apres chart.umd.min.js. */
(function () {
  if (!window.Chart) return;
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = Chart.defaults;
  function palette() {
    var clair = document.documentElement.getAttribute('data-bs-theme') === 'light';
    return clair
      ? { texte: '#57524a', grille: 'rgba(31,29,26,.14)', bulle: '#fffaf0', bulleTexte: '#1f1d1a', bord: '#1f1d1a', arc: '#fbf5e8' }
      : { texte: '#b9c2b9', grille: 'rgba(243,241,232,.14)', bulle: '#2a3a33', bulleTexte: '#f3f1e8', bord: '#f3f1e8', arc: '#22302a' };
  }
  function appliquer(p) {
    d.color = p.texte; d.borderColor = p.grille;
    d.plugins.tooltip.backgroundColor = p.bulle; d.plugins.tooltip.borderColor = p.bord; d.plugins.tooltip.titleColor = p.bulleTexte; d.plugins.tooltip.bodyColor = p.bulleTexte;
    d.elements.arc.borderColor = p.arc;
  }
  d.font.family = "'Patrick Hand SC', 'Nunito', ui-sans-serif, sans-serif";
  d.font.size = 13;
  d.animation = calme ? false : { duration: 700, easing: 'easeOutCubic' };
  d.plugins.tooltip.borderWidth = 2;
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
