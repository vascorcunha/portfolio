/* ============================================================
   FILTER LOGIC
   ------------------------------------------------------------
   Each album <a> in .photo-grid carries one or more tag-X
   classes (e.g. tag-18, tag-50, tag-eventos).

   Clicking a .filter-btn:
     - "all"     → remove dimming on the grid, all albums normal
     - tag       → grid gets .filter-active; albums with the
                   matching tag-X class get .is-match (full
                   color); the rest are dimmed by CSS.
   ============================================================ */
(function () {
  const grid    = document.querySelector('.photo-grid');
  const buttons = document.querySelectorAll('.filter-btn');
  if (!grid || !buttons.length) return;

  const albums = grid.querySelectorAll(':scope > a');

  function applyFilter(filter) {
    if (filter === 'all') {
      grid.classList.remove('filter-active');
      albums.forEach((a) => a.classList.remove('is-match'));
      return;
    }
    grid.classList.add('filter-active');
    const matchClass = 'tag-' + filter;
    albums.forEach((a) => {
      a.classList.toggle('is-match', a.classList.contains(matchClass));
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  });
})();