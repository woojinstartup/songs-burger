/* Songs Burger
 *
 * Scroll position drives the film: the page scrubs video.currentTime.
 * Where scrubbing is unwelcome or impossible — reduced motion, data saver,
 * a film that never arrives — it steps back to a quiet loop, or to the
 * poster. The words stay readable in every one of those cases.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const film  = document.getElementById('film');
  const reel  = document.getElementById('reel');
  const beats = Array.from(document.querySelectorAll('.beat'));

  // Index each filling so the list arrives one line at a time.
  document.querySelectorAll('.stack').forEach((list) => {
    Array.from(list.children).forEach((li, i) => li.style.setProperty('--i', i));
  });

  /* ── Entrances ───────────────────────────────────── */

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-on');
      });
    }, { rootMargin: '-22% 0px -22% 0px' });
    beats.forEach((b) => io.observe(b));
  } else {
    beats.forEach((b) => b.classList.add('is-on'));
  }

  /* ── The film ────────────────────────────────────── */

  if (!film || !reel) return;

  const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse    = window.matchMedia('(pointer: coarse)');
  const smallData = navigator.connection && navigator.connection.saveData;

  /* Pick a print that matches the screen. The film is the product, so a wide
     display gets the 1080p master rather than a 720p file stretched to fit;
     a phone has no use for either. */
  (() => {
    const src = document.getElementById('reelSrc');
    if (!src) return;
    const w    = window.innerWidth * (window.devicePixelRatio || 1);
    const want = (coarse.matches || window.innerWidth < 760) ? '/media/hero-480.mp4'
               : (w >= 1280 && !smallData)                   ? '/media/hero-1080.mp4'
               : '/media/hero-720.mp4';
    if (!src.src.endsWith(want)) {
      src.src = want;
      reel.load();
    }
  })();

  let mode = null;   // 'scrub' | 'loop'
  let raf  = 0;
  let duration = 0;

  const loopMode = () => {
    if (mode === 'loop') return;
    mode = 'loop';
    window.removeEventListener('scroll', onScroll);
    reel.loop = true;
    reel.play().catch(() => { /* blocked autoplay just leaves the poster */ });
  };

  const scrubMode = () => {
    if (mode === 'scrub') return;
    mode = 'scrub';
    reel.loop = false;
    reel.pause();
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
  };

  function progress() {
    const r = film.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / span));
  }

  function apply() {
    raf = 0;
    if (!duration) return;
    // Landing exactly on the final frame makes some browsers rewind.
    // Stop a hair short of it.
    const t = progress() * (duration - 0.05);
    if (Math.abs(reel.currentTime - t) > 0.01) reel.currentTime = t;
  }

  function onScroll() {
    if (!raf) raf = requestAnimationFrame(apply);
  }

  /* The wordmark belongs to the first screen only — further down it
     collides with the headlines. */
  const mark = document.querySelector('.mark');
  if (mark) {
    const markWatch = () => {
      mark.dataset.gone = window.scrollY > window.innerHeight * 0.15 ? '1' : '0';
    };
    window.addEventListener('scroll', markWatch, { passive: true });
    markWatch();
  }

  function decide() {
    if (reduced.matches) { loopMode(); return; }
    if (smallData)       { loopMode(); return; }
    scrubMode();
  }

  reel.addEventListener('loadedmetadata', () => {
    duration = reel.duration || 0;
    decide();
  });

  // If the film never arrives, stand down and leave the poster.
  reel.addEventListener('error', () => {
    window.removeEventListener('scroll', onScroll);
    mode = 'dead';
  });

  reduced.addEventListener('change', decide);

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (mode === 'scrub') apply(); }, 120);
  }, { passive: true });

  if (reel.readyState >= 1) {
    duration = reel.duration || 0;
    decide();
  }
})();
