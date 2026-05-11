/* ==================================================================
   PROJECT PAGE — script
   ==================================================================
   Jobs:
   1. Smooth-scroll the "Back to top" button and the headline tap.
   2. Shared lightbox that handles both IMAGES and VIDEOS, plus a
      separate PDF lightbox.
   3. Auto-fill grid items that end up alone in their row.
   ================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Custom scroll-to with optional duration and easing ---- */
  function smoothScrollTo(targetY, options = {}) {
    const DURATION = options.duration ?? 400;
    const easeFn   = options.ease ?? ((t) => 1 - Math.pow(1 - t, 3));
    const start    = window.scrollY;
    const distance = targetY - start;
    const startTs  = performance.now();

    function step(now) {
      const elapsed  = now - startTs;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = easeFn(progress);
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const easeOutCubic   = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => (t < 0.5)
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;


  /* ---- 1. "Back to top" button ---- */
  const backBtn = document.querySelector('.back-to-top-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (event) => {
      event.preventDefault();
      smoothScrollTo(0);
      history.replaceState(null, '', window.location.pathname);
    });
  }


  /* ---- 1b. Click headline → soft scroll to next section ---- */
  const headline    = document.querySelector('.hero-headline');
  const nextSection = document.querySelector('.project-info');
  if (headline && nextSection) {
    headline.addEventListener('click', () => {
      smoothScrollTo(nextSection.offsetTop, {
        duration: 900,
        ease: easeInOutCubic,
      });
    });
  }


  /* ==================================================================
     2. SHARED LIGHTBOX — handles images AND videos
  ================================================================== */

  // Read each inline overlay's media data. An overlay can contain
  // EITHER an <img> OR a <video> (not both).
  const inlineOverlays = Array.from(
    document.querySelectorAll('.popup-overlay:not(.popup-pdf)')
  );

  const mediaData = inlineOverlays.map((o) => {
    const video = o.querySelector('video');
    if (video) {
      return {
        type: 'video',
        src:  video.querySelector('source')?.src || video.src,
        hash: '#' + o.id,
      };
    }
    const img = o.querySelector('img');
    return {
      type: 'image',
      src:  img.src,
      alt:  img.alt || '',
      hash: '#' + o.id,
    };
  });

  // Replace the inline overlays with one shared lightbox
  inlineOverlays.forEach((o) => o.remove());

  const lb = document.createElement('div');
  lb.className = 'popup-overlay shared-lightbox';
  lb.innerHTML = `
    <button type="button" class="close-btn" aria-label="Close">✕</button>
    <button type="button" class="lightbox-nav prev" aria-label="Previous">‹</button>
    <button type="button" class="lightbox-nav next" aria-label="Next">›</button>
  `;
  document.body.appendChild(lb);

  let currentIdx = -1;

  // Preload only IMAGES (videos are heavy; the browser handles them)
  function preload(idx) {
    const data = mediaData[idx];
    if (data && data.type === 'image') {
      const i = new Image();
      i.src = data.src;
    }
  }

  function openLightbox(idx) {
    if (idx < 0 || idx >= mediaData.length) return;

    // Remove (and pause) any previous media element
    const prev = lb.querySelector('.lb-media');
    if (prev) {
      if (prev.tagName === 'VIDEO') prev.pause();
      prev.remove();
    }

    const data = mediaData[idx];
    let el;
    if (data.type === 'video') {
      el = document.createElement('video');
      el.src         = data.src;
      el.controls    = true;     // user can pause, scrub, unmute
      el.autoplay    = true;     // start playing on open
      el.muted       = true;     // start muted (controls let you unmute)
      el.playsInline = true;     // don't force fullscreen on iOS
      el.setAttribute('controlsList', 'nodownload');
    } else {
      el = document.createElement('img');
      el.src = data.src;
      el.alt = data.alt;
    }
    el.classList.add('lb-media');

    // Insert FIRST so close-btn / arrows stay layered above
    lb.insertBefore(el, lb.firstChild);

    currentIdx = idx;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Preload neighbours for snappier nav (images only)
    preload((idx + 1) % mediaData.length);
    preload((idx - 1 + mediaData.length) % mediaData.length);
  }

  function navigateLightbox(direction) {
    if (currentIdx === -1 || !lb.classList.contains('is-open')) return;
    const next = (currentIdx + direction + mediaData.length) % mediaData.length;
    openLightbox(next);
  }

  function closeAllLightboxes() {
    document.querySelectorAll('.popup-overlay.is-open').forEach((o) => {
      o.classList.remove('is-open');
      const v = o.querySelector('video');
      if (v) v.pause();          // stop sound when closing
    });
    document.body.style.overflow = '';
    currentIdx = -1;
  }

  // OPEN: clicking a thumbnail in the grid (image OR video)
  document.querySelectorAll('.image-grid a').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      const idx  = mediaData.findIndex((d) => d.hash === hash);
      if (idx === -1) return;
      event.preventDefault();
      openLightbox(idx);
    });
  });

  // OPEN: clicking a PDF link
  document.querySelectorAll('.pdf-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      const overlay = document.querySelector(hash);
      if (!overlay || !overlay.classList.contains('popup-overlay')) return;
      event.preventDefault();
      const pdfPath = link.getAttribute('data-pdf');
      const iframe  = overlay.querySelector('iframe');
      if (pdfPath && iframe && iframe.src !== pdfPath) iframe.src = pdfPath;
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  // Nav arrows
  lb.querySelectorAll('.lightbox-nav').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const direction = btn.classList.contains('next') ? 1 : -1;
      navigateLightbox(direction);
    });
  });

  // Close buttons
  document.querySelectorAll('.popup-overlay .close-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      closeAllLightboxes();
    });
  });

  // Click backdrop to close
  document.querySelectorAll('.popup-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeAllLightboxes();
    });
  });

  // Keyboard
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape')          closeAllLightboxes();
    else if (event.key === 'ArrowRight') navigateLightbox(1);
    else if (event.key === 'ArrowLeft')  navigateLightbox(-1);
  });


  /* ==================================================================
     3. AUTO-FILL grid items that end up ALONE on a row
  ================================================================== */
  function adjustGridOrphans() {
    const grid = document.querySelector('.image-grid');
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll(':scope > a'));

    items.forEach((item) => item.classList.remove('fill-row'));

    const rows = new Map();
    items.forEach((item) => {
      const top = Math.round(item.offsetTop);
      if (!rows.has(top)) rows.set(top, []);
      rows.get(top).push(item);
    });

    rows.forEach((row) => {
      if (row.length === 1 && !row[0].classList.contains('span-two')) {
        row[0].classList.add('fill-row');
      }
    });
  }

  requestAnimationFrame(adjustGridOrphans);
  window.addEventListener('load', adjustGridOrphans);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(adjustGridOrphans, 150);
  });

});