/* ================================================================
   Playlist Covers — lightbox controller
   - Click a tile        → open lightbox with that image
   - Click outside img   → close
   - Click X / press Esc → close
   ================================================================ */
(function () {
  'use strict';

  const grid = document.getElementById('projectGrid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (!grid || !lightbox || !lightboxImg || !lightboxClose) return;

  // Remember which element opened the lightbox so we can restore focus
  let lastOpener = null;

  function openLightbox(src, alt) {
    if (!src) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    // Move focus to the close button for keyboard users
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    // Free memory / stop GIF playback
    lightboxImg.removeAttribute('src');
    lightboxImg.alt = '';
    if (lastOpener) {
      lastOpener.focus();
      lastOpener = null;
    }
  }

  // Open on tile click (event delegation)
  grid.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    e.preventDefault();
    lastOpener = tile;
    openLightbox(tile.dataset.full, tile.querySelector('img')?.alt);
  });

  // Close on X
  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  // Click on the dark backdrop (anywhere outside the image) → close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      e.preventDefault();
      closeLightbox();
    }
  });
})();