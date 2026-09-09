/* Songs Burger
 *
 * 스크롤 위치로 영상을 스크럽한다.
 * 스크럽이 불가능한 환경(모션 최소화 설정, 저사양, 영상 로드 실패)에서는
 * 조용히 자동 반복 재생으로 내려앉는다. 어느 쪽이든 글은 그대로 읽힌다.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const film  = document.getElementById('film');
  const reel  = document.getElementById('reel');
  const beats = Array.from(document.querySelectorAll('.beat'));

  // 재료 목록은 순서대로 들어오게 인덱스를 심어둔다
  document.querySelectorAll('.stack').forEach((list) => {
    Array.from(list.children).forEach((li, i) => li.style.setProperty('--i', i));
  });

  /* ── 텍스트 등장 ─────────────────────────────────── */

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

  /* ── 영상 ────────────────────────────────────────── */

  if (!film || !reel) return;

  const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse    = window.matchMedia('(pointer: coarse)');
  const smallData = navigator.connection && navigator.connection.saveData;

  // 모바일은 720p를 받을 이유가 없다
  if (coarse.matches || window.innerWidth < 760) {
    const src = document.getElementById('reelSrc');
    if (src && !reel.currentTime) {
      src.src = '/media/hero-480.mp4';
      reel.load();
    }
  }

  let mode = null;   // 'scrub' | 'loop'
  let raf  = 0;
  let duration = 0;

  const loopMode = () => {
    if (mode === 'loop') return;
    mode = 'loop';
    window.removeEventListener('scroll', onScroll);
    reel.loop = true;
    reel.play().catch(() => { /* 자동재생이 막히면 포스터가 남는다 */ });
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
    // 마지막 프레임에 정확히 닿으면 일부 브라우저가 되감는다. 아주 살짝 못 미치게 둔다.
    const t = progress() * (duration - 0.05);
    if (Math.abs(reel.currentTime - t) > 0.01) reel.currentTime = t;
  }

  function onScroll() {
    if (!raf) raf = requestAnimationFrame(apply);
  }

  /* 워드마크는 첫 화면에서만. 아래로 내려가면 큰 글자와 겹친다. */
  const mark = document.querySelector('.mark');
  if (mark) {
    const markWatch = () => {
      mark.dataset.gone = window.scrollY > window.innerHeight * 0.5 ? '1' : '0';
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

  // 영상이 끝내 안 오면 포스터만 남기고 조용히 물러난다
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
