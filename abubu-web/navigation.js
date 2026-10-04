(() => {
  const header = document.getElementById('site-header');
  const toggle = header.querySelector('.site-menu-toggle');
  const navigation = document.getElementById('site-nav');
  const compact = matchMedia('(max-width: 900px)');
  let previousScroll = Math.max(0, window.scrollY);
  let frame = 0;

  const showHeader = () => {
    header.classList.remove('is-hidden');
    header.inert = false;
  };

  const hideHeader = () => {
    header.classList.add('is-hidden');
    header.inert = true;
  };

  const closeMenu = () => {
    navigation.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };

  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    showHeader();
  });

  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  compact.addEventListener('change', closeMenu);

  const updateHeader = () => {
    frame = 0;
    const currentScroll = Math.max(0, window.scrollY);
    const movement = currentScroll - previousScroll;
    if (currentScroll < 90 || toggle.getAttribute('aria-expanded') === 'true') showHeader();
    else if (movement > 5 && currentScroll > 150) hideHeader();
    else if (movement < -5) showHeader();
    previousScroll = currentScroll;
  };

  window.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateHeader);
  }, { passive: true });

  const sections = document.querySelectorAll('.reveal-on-scroll');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    sections.forEach(section => section.classList.add('is-visible'));
  } else {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    sections.forEach(section => observer.observe(section));
  }
})();
