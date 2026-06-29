/* Tastry — small set of progressive enhancements */

(function () {
  // Reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('in'));
  }

  // Hero molecule -> preference curve animation
  const stage = document.getElementById('hero-visual');
  if (stage) {
    const playable = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (playable) {
      // After a short delay, switch the "phase" class so the SVG morphs.
      setTimeout(() => stage.classList.add('phase-2'), 900);
      setTimeout(() => stage.classList.add('phase-3'), 2200);
    } else {
      stage.classList.add('phase-2', 'phase-3');
    }
  }

  // Accuracy chart: a small interactive hover that highlights individual rows
  const chart = document.getElementById('accuracy-chart');
  if (chart) {
    const rows = chart.querySelectorAll('[data-row]');
    rows.forEach((r) => {
      r.addEventListener('mouseenter', () => r.classList.add('hot'));
      r.addEventListener('mouseleave', () => r.classList.remove('hot'));
    });
  }

  // Year stamp
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Video modal
  const vModal = document.getElementById('video-modal');
  const vFrame = document.getElementById('video-frame');
  const vTriggers = document.querySelectorAll('[data-video]');

  function openVideo(url) {
    if (!vModal || !vFrame) return;
    const sep = url.indexOf('?') > -1 ? '&' : '?';
    vFrame.innerHTML =
      '<iframe src="' + url + sep + 'autoplay=1" ' +
      'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    vModal.classList.add('open');
    vModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeVideo() {
    if (!vModal || !vFrame) return;
    vModal.classList.remove('open');
    vModal.setAttribute('aria-hidden', 'true');
    vFrame.innerHTML = ''; // stop playback
    document.body.style.overflow = '';
  }

  vTriggers.forEach((t) =>
    t.addEventListener('click', () => openVideo(t.getAttribute('data-video')))
  );
  if (vModal) {
    vModal.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', closeVideo)
    );
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideo();
  });
})();
