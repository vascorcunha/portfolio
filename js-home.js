/* ================================================================
   V — Menu controller
   - State management (home / creative / photography)
   - Loading screen (CSS-driven; skipped on refresh in same tab)
   - Keyboard navigation (Arrows + Escape)
   - Lazy-loading of grid GIFs / images on first panel open
   ================================================================ */
(function () {
  'use strict';

  const VALID_STATES = ['home', 'creative', 'photography'];
  const LOADER_SEEN_KEY = 'v-loader-seen';

  const body = document.body;
  const loadingScreen = document.getElementById('loadingScreen');
  const creativePanel = document.getElementById('creativePanel');
  const photographyPanel = document.getElementById('photographyPanel');

  /* ----------------------------------------------------------------
     Loading screen
     - Animation runs once per browser session via CSS.
     - On refresh (same tab/session), we skip it entirely.
     ---------------------------------------------------------------- */
  if (loadingScreen) {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(LOADER_SEEN_KEY) === '1';
    } catch (_) { /* sessionStorage may be blocked — fall through and play loader */ }

    if (alreadySeen) {
      // Skip animations entirely
      loadingScreen.classList.add('is-skipped');
      loadingScreen.setAttribute('aria-hidden', 'true');
    } else {
      try { sessionStorage.setItem(LOADER_SEEN_KEY, '1'); } catch (_) { /* ignore */ }
      // After the CSS fadeOut completes (~3s total), mark hidden for a11y
      setTimeout(() => loadingScreen.setAttribute('aria-hidden', 'true'), 3000);
    }
  }

  /* ----------------------------------------------------------------
     Lazy load — set --gif and <img src> only when a panel opens
     ---------------------------------------------------------------- */
  const lazyHydrated = new WeakSet();

  function hydratePanel(panel) {
    if (!panel || lazyHydrated.has(panel)) return;
    lazyHydrated.add(panel);

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Set background-image on .creative-img-wrap and .photo-img-wrap
    panel.querySelectorAll('[data-gif]').forEach((wrap) => {
      const url = wrap.getAttribute('data-gif');
      if (url) wrap.style.setProperty('--gif', `url('${url}')`);
    });

    // Set src on <img data-src="..."> (mobile creative grid + all photo tiles).
    // On mobile photography tiles the GIF IS the visible background, so
    // we skip loading the static cover image to save bandwidth.
    panel.querySelectorAll('img[data-src]').forEach((img) => {
      if (isMobile && img.closest('.photo-img-wrap')) return;
      const url = img.getAttribute('data-src');
      if (url && !img.src) {
        img.src = url;
        img.loading = 'lazy';
        img.decoding = 'async';
      }
    });
  }

  /* ----------------------------------------------------------------
     State management
     ---------------------------------------------------------------- */
  function setState(next) {
    if (!VALID_STATES.includes(next)) next = 'home';

    body.setAttribute('data-state', next);

    if (creativePanel) {
      creativePanel.setAttribute('aria-hidden', next === 'creative' ? 'false' : 'true');
    }
    if (photographyPanel) {
      photographyPanel.setAttribute('aria-hidden', next === 'photography' ? 'false' : 'true');
    }

    if (next === 'creative') hydratePanel(creativePanel);
    if (next === 'photography') hydratePanel(photographyPanel);
  }

  /* ----------------------------------------------------------------
     Click delegation — any element with [data-action]
     ---------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;

    const action = trigger.getAttribute('data-action');

    if (action === 'home') {
      e.preventDefault();
      setState('home');
      return;
    }

    if (action === 'open') {
      e.preventDefault();
      const target = trigger.getAttribute('data-target');
      setState(target);
    }
  });

  /* ----------------------------------------------------------------
     Keyboard navigation
       ←  open Creative
       →  open Photography
       Esc / ↑ / ↓ (mobile)  go home
       Space                  open the logo link (Who Am I)
     Ignored when focus is inside a link/button inside an open panel,
     so the user can still tab through tiles normally.
     ---------------------------------------------------------------- */
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  function isInteractiveFocus(el) {
    if (!el || el === document.body) return false;
    return el.tagName === 'BUTTON' || el.tagName === 'A';
  }

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;

    const state = body.getAttribute('data-state') || 'home';
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Spacebar → open the logo link (Who Am I).
    // Skip when focus is on a button/anchor so Space still activates that
    // element as the user expects (keyboard a11y).
    if (e.key === ' ' || e.key === 'Spacebar') {
      if (!isInteractiveFocus(document.activeElement)) {
        e.preventDefault();
        const logo = document.querySelector('.menu-logo-link');
        if (logo) logo.click();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        if (state !== 'home') {
          e.preventDefault();
          setState('home');
        }
        break;

      case 'ArrowLeft':
        if (!isMobile && state === 'home') {
          e.preventDefault();
          setState('creative');
        } else if (!isMobile && state === 'photography') {
          e.preventDefault();
          setState('home');
        }
        break;

      case 'ArrowRight':
        if (!isMobile && state === 'home') {
          e.preventDefault();
          setState('photography');
        } else if (!isMobile && state === 'creative') {
          e.preventDefault();
          setState('home');
        }
        break;

      case 'ArrowUp':
        if (isMobile && state === 'home') {
          e.preventDefault();
          setState('creative');
        } else if (isMobile && state === 'photography') {
          e.preventDefault();
          setState('home');
        }
        break;

      case 'ArrowDown':
        if (isMobile && state === 'home') {
          e.preventDefault();
          setState('photography');
        } else if (isMobile && state === 'creative') {
          e.preventDefault();
          setState('home');
        }
        break;

      default:
        break;
    }
  });

  /* ----------------------------------------------------------------
     Init
     ---------------------------------------------------------------- */
  setState('home');
})();