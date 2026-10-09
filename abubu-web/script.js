(() => {
  const t = text => window.studioLanguage.t(text);
  const BACKGROUND_PARALLAX_SPEED = 3.;
  const WHAT_WE_LOVE = [
    { title: 'Silly games', content: '• Online parties\n• Incremental Games\n• Stories to Remember' },
    { title: 'Playful art', content: '• 2D Pixel art\n• 3D Low Poly\n• Full of character' },
    { title: 'Good company', content: '• Happy Dev\n• Fair play\n• Healthy community' },
    { title: 'Yuck!', content: '• Soulless\n• Pay to win\n• Games without :Đ' }
  ];
  const valueList = document.querySelector('.value-list');
  valueList.style.setProperty('--value-count', String(WHAT_WE_LOVE.length));
  const renderValues = () => {
    valueList.replaceChildren();
  WHAT_WE_LOVE.forEach(value => {
    const card = document.createElement('article');
    card.className = 'value-item';
    const title = document.createElement('h3');
    title.textContent = t(value.title);
    const content = document.createElement('p');
    content.textContent = t(value.content);
    card.append(title, content);
    valueList.append(card);
    window.renderDesignHeading(title, t(value.title));
  });
  };
  renderValues();
  const PARTNER_LOGO_TINT = '#22cfff';
  if (PARTNER_LOGO_TINT) {
    const namespace = 'http://www.w3.org/2000/svg';
    const tintSvg = document.createElementNS(namespace, 'svg');
    tintSvg.setAttribute('width', '0');
    tintSvg.setAttribute('height', '0');
    tintSvg.setAttribute('aria-hidden', 'true');
    tintSvg.style.position = 'absolute';
    const defs = document.createElementNS(namespace, 'defs');
    const filter = document.createElementNS(namespace, 'filter');
    filter.id = 'partner-logo-tint';
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const flood = document.createElementNS(namespace, 'feFlood');
    flood.setAttribute('flood-color', PARTNER_LOGO_TINT);
    flood.setAttribute('result', 'tint');
    const composite = document.createElementNS(namespace, 'feComposite');
    composite.setAttribute('in', 'tint');
    composite.setAttribute('in2', 'SourceAlpha');
    composite.setAttribute('operator', 'in');
    filter.append(flood, composite);
    const shadedFilter = document.createElementNS(namespace, 'filter');
    shadedFilter.id = 'partner-logo-shaded-tint';
    shadedFilter.setAttribute('color-interpolation-filters', 'sRGB');
    const luminance = document.createElementNS(namespace, 'feColorMatrix');
    luminance.setAttribute('type', 'saturate');
    luminance.setAttribute('values', '0');
    luminance.setAttribute('result', 'shading');
    const shadedFlood = flood.cloneNode();
    const blend = document.createElementNS(namespace, 'feBlend');
    blend.setAttribute('in', 'shading');
    blend.setAttribute('in2', 'tint');
    blend.setAttribute('mode', 'multiply');
    blend.setAttribute('result', 'shadedTint');
    const shadedComposite = composite.cloneNode();
    shadedComposite.setAttribute('in', 'shadedTint');
    shadedFilter.append(luminance, shadedFlood, blend, shadedComposite);
    defs.append(filter, shadedFilter);
    tintSvg.append(defs);
    document.body.append(tintSvg);
  }
  const PARTNERS_IN_CRIME = [
    { name: 'Nono Pain Gain', image: 'assets/partner-nono.png', width: 171 },
    { name: 'Indie Games Vietnam', image: 'assets/indie_games_vn.svg', width: 190, url: 'https://indiegamesvn.com/' },
    { name: 'Bueno Interactive', image: 'assets/bueno_brand.webp', width: 186, url: 'https://thebuenointeractive.com/' }
  ];
  const partnerList = document.querySelector('.partner-list');
  const partnerTrack = document.createElement('div');
  partnerTrack.className = 'partner-track';
  const partnerGroup = document.createElement('div');
  partnerGroup.className = 'partner-group';
  partnerTrack.append(partnerGroup);
  partnerList.append(partnerTrack);
  PARTNERS_IN_CRIME.forEach(partner => {
    const item = document.createElement(partner.url ? 'a' : 'div');
    item.className = 'partner-logo';
    if (partner.url) {
      item.href = partner.url;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    }
    const image = document.createElement('img');
    image.src = partner.image;
    image.alt = partner.name;
    image.decoding = 'async';
    if (PARTNER_LOGO_TINT) image.style.filter = partner.preserveShading ? 'url(#partner-logo-shaded-tint)' : 'url(#partner-logo-tint)';
    item.style.setProperty('--partner-width', String(partner.width || 200));
    item.append(image);
    partnerGroup.append(item);
  });
  const partnerReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const updatePartnerMarquee = () => {
    const overflow = partnerGroup.getBoundingClientRect().width > partnerList.clientWidth + 1;
    partnerList.classList.toggle('is-overflowing', overflow);
    partnerList.tabIndex = overflow ? 0 : -1;
    partnerList.setAttribute('aria-label', t('Partner logos'));
    const animate = overflow && !partnerReducedMotion.matches;
    const existingCopy = partnerTrack.querySelector('.partner-group-copy');
    if (animate && !existingCopy) {
      const copy = partnerGroup.cloneNode(true);
      copy.classList.add('partner-group-copy');
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      copy.querySelectorAll('img').forEach(image => image.alt = '');
      partnerTrack.append(copy);
    } else if (!animate && existingCopy) existingCopy.remove();
    const gap = parseFloat(getComputedStyle(partnerTrack).columnGap) || 0;
    const distance = partnerGroup.getBoundingClientRect().width + gap;
    partnerTrack.style.setProperty('--marquee-distance', `${distance}px`);
    partnerTrack.style.setProperty('--marquee-duration', `${distance / 18}s`);
  };
  const partnerResizeObserver = new ResizeObserver(updatePartnerMarquee);
  partnerResizeObserver.observe(partnerList);
  partnerResizeObserver.observe(partnerGroup);
  partnerReducedMotion.addEventListener('change', updatePartnerMarquee);
  document.addEventListener('studio-language-change', updatePartnerMarquee);
  const partnerVisibilityObserver = new IntersectionObserver(entries => {
    partnerList.classList.toggle('is-visible', entries[0].isIntersecting);
  });
  partnerVisibilityObserver.observe(partnerList);
  updatePartnerMarquee();
  const CAROUSEL_GAMES = [
    {
      name: 'Christmasing Around', title: 'Christmasing Around',
      banner: 'assets/christmasing_around.svg',
      tags: ['Party chaos', 'Christmas', 'Coming soon'],
      description: 'Christmasing Around is a chaotic online party game about making Christmas as messy and magical as possible. Play with your friends, cause some holiday havoc, and spread joy... or at least try to. Very fren slop!',
      buttons: [
        { label: 'Wishlist on Steam', url: 'https://store.steampowered.com/search/?term=Christmasing%20Around', theme: 'steam', external: true },
        { label: 'Youtube', url: 'https://www.youtube.com/results?search_query=Christmasing+Around+Abubu+Dance', theme: 'youtube', external: true }
      ]
    },
    {
      name: 'Open The Gate: Just A Little', banner: 'assets/open_gate.jpg', tags: ['Tower defense', 'Tiny armies', 'Released'],
      description: 'Defend a medieval castle from approaching legions in a tower defense adventure with tiny units. Build your army, position your soldiers, and decide how far to open the enemy gate.',
      buttons: [
        { label: 'Play on Steam', url: 'https://store.steampowered.com/app/4244210/Open_The_Gate_Just_A_Little/', theme: 'steam', external: true },
        { label: 'Youtube', url: 'https://www.youtube.com/watch?v=LPRYP-czswE', theme: 'youtube', external: true },
        { label: 'Presskit', url: 'https://drive.google.com/drive/folders/154kV0awuWA8mcl8ZRMvERtZYBu8cMQQX', theme: 'drive', external: true }
      ]
    },
    {
      name: 'Hangul Typing Tale', banner: 'assets/hangul.jpg', tags: ['Typing', 'Story', 'Pixel art'],
      description: 'Learn to type Korean from zero! Help a foreign princess fight her way through Korean birds to rescue her prince on the moon. Professor Duck guides you through letters, words, mini games, and a story with more than ten chapters.',
      buttons: [
        { label: 'Steam', url: 'https://store.steampowered.com/app/3320380/Hangul_Typing_Tale/', theme: 'steam', external: true },
        { label: 'Youtube', url: 'https://www.youtube.com/watch?v=tRDNqa-1gbs', theme: 'youtube', external: true },
        { label: 'App Store', url: 'https://apps.apple.com/us/app/hangul-typing-tale/id6737801764', theme: 'primary', external: true }
      ]
    },
    {
      name: 'Cat Boxing', banner: 'assets/cat_boxing.jpg', tags: ['Cats', 'Puzzle', 'Relaxing'],
      description: 'Fit adorable cats into tight spaces! A relaxing puzzle with procedurally generated levels, so no two puzzles are ever the same. Drag, drop, and unlock eight cat and box styles.',
      buttons: [
        { label: 'App Store', url: 'https://apps.apple.com/us/app/cat-boxing-piece-puzzle/id6748878193', theme: 'primary', external: true },
        { label: 'Youtube', url: 'https://www.youtube.com/shorts/lJ7V8WwEcLs', theme: 'youtube', external: true }
      ]
    },
    {
      name: 'Sa Hinh 3D', banner: 'assets/sa_hinh.jpg', tags: ['Driving', 'Simulation', '3D'],
      description: 'Get behind the wheel for the Vietnamese B1 driving license exam. Steer through eleven driving tests with timing, scoring, different view angles, and a simulated automatic transmission.',
      buttons: [
        { label: 'App Store', url: 'https://apps.apple.com/app/h%E1%BB%8Dc-l%C3%A1i-sa-hinh-3d/id6748861501', theme: 'primary', external: true },
        { label: 'Youtube', url: 'https://www.youtube.com/watch?v=hAWOOVInc80', theme: 'youtube', external: true }
      ]
    },
    {
      name: 'Bubble It Out', banner: 'assets/bubble_it_out.webp', posterPosition: 'center top', tags: ['Game jam', 'Story', 'One day'],
      description: 'Follow little Tomacaro as they survive a conversation between two strangers. A tiny story made by four friends in one day, with a happy ending... perhaps?',
      buttons: [{ label: 'Play on itch.io', url: 'https://vitsoonyoung.itch.io/bubble-it-out', theme: 'primary', external: true }]
    },
    {
      name: 'Slap Ashes', banner: 'assets/slap_ashes.jpg', tags: ['Game jam', 'Four veggies', 'Three days'],
      description: 'Four veggies search for the meaning of life on a stage. Only one stays. A silly game jam experiment made by four friends in three days.',
      buttons: [{ label: 'Play on itch.io', url: 'https://vitsoonyoung.itch.io/slap-ashes', theme: 'primary', external: true }]
    }
  ];
  const MAX_PARTICLES = 100;
  const CURSOR_SIZE = 58;
  const PARTICLE_SPACING = 14;
  const CANDY_SPACING = 54;
  const TRAIL_OFFSET_X = Math.round(CURSOR_SIZE * .58);
  const TRAIL_OFFSET_Y = Math.round(CURSOR_SIZE * .7);
  const shell = document.getElementById('scene-shell');
  const board = document.getElementById('artboard');
  const trailCanvas = document.getElementById('cursor-trail');
  const trailContext = trailCanvas.getContext('2d');
  const cursorElement = document.getElementById('custom-cursor');
  const carousel = document.getElementById('game-carousel');
  const carouselTrack = carousel.querySelector('.carousel-track');
  const carouselGames = CAROUSEL_GAMES;
  const carouselSlides = carouselGames.map(game => {
    const slide = document.createElement('article');
    slide.className = 'game-slide';
    slide.setAttribute('aria-label', `${game.title || game.name} artwork`);
    const image = document.createElement('img');
    image.className = 'game-slide__poster';
    image.src = game.banner;
    image.alt = game.name;
    image.style.objectPosition = game.posterPosition || 'center top';
    image.style.transformOrigin = game.posterPosition || 'center top';
    image.draggable = false;
    image.loading = 'lazy';
    image.decoding = 'async';
    slide.append(image);
    carouselTrack.append(slide);
    return slide;
  });
  const carouselStatus = document.getElementById('carousel-status');
  const gameTags = document.querySelector('.game-tags');
  const gameDescription = document.querySelector('.game-description');
  const gameActions = document.querySelector('.game-actions');
  const gameDetails = document.querySelector('.game-details');
  const gameVideo = document.querySelector('.game-video');
  const buttonThemes = new Set(['youtube', 'primary', 'steam', 'drive', 'google-drive']);
  const decorations = [...document.querySelectorAll('[data-parallax]')];
  const showcase = document.querySelector('.showcase');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const position = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const particles = [];
  const candyColors = ['#ff4f52', '#35e29b', '#ffd64a', '#fff4dc'];
  const sparkColors = ['#fff7cf', '#ffd858', '#8feaff', '#ffb8ee'];
  let previousPoint = null;
  let previousMotion = null;
  let cursorFocus = 0;
  let focus = 0;
  let candyDistance = 0;
  let lastFrame = 0;
  let trailFrame = 0;
  let activeSlide = 0;
  let swipeStart = null;
  let detailsTimer = 0;
  let selectionScrollTimer = 0;
  let sceneFrame = 0;
  let heroVisible = true;
  let showcaseVisible = true;
  let shellHeight = 0;
  let decorationMetrics = [];


  const youtubeVideoId = link => {
    try {
      const url = new URL(link);
      const host = url.hostname.toLowerCase();
      let id = null;
      if (host === 'youtu.be') id = url.pathname.split('/')[1];
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
        id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([^/]+)/.exec(url.pathname)?.[1];
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  };
  const renderGameVideo = game => {
    const id = (game.buttons || []).map(button => youtubeVideoId(button.url)).find(Boolean);
    if (!id) {
      gameVideo.replaceChildren();
      gameVideo.hidden = true;
      return;
    }
    gameVideo.hidden = false;
    let player = gameVideo.querySelector('iframe');
    if (player?.dataset.videoId !== id) {
      player = document.createElement('iframe');
      player.dataset.videoId = id;
      player.src = `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`;
      player.loading = 'lazy';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      player.allowFullscreen = true;
      gameVideo.replaceChildren(player);
    }
    player.title = `${game.name} ${t('video trailer')}`;
  };

  const renderGameDetails = () => {
    const game = CAROUSEL_GAMES[activeSlide];
    renderGameVideo(game);
    gameTags.replaceChildren(...(game.tags || []).map(tag => {
      const item = document.createElement('span');
      item.textContent = t(tag);
      return item;
    }));
    const nameHeading = document.querySelector('.game-name');
    nameHeading.textContent = game.name;
    window.renderDesignHeading(nameHeading, game.name);
    gameDescription.textContent = t(game.description || '');
    gameActions.replaceChildren(...(game.buttons || []).filter(button => button.label && button.url).map(button => {
      const link = document.createElement('a');
      const requestedTheme = (button.theme || '').toLowerCase().replace(/[\s_]+/g, '-');
      const inferredTheme = /(?:youtube\.com|youtu\.be)/.test(button.url) ? 'youtube' : /drive\.google\.com/.test(button.url) ? 'drive' : 'primary';
      const theme = buttonThemes.has(requestedTheme) ? requestedTheme : inferredTheme;
      link.className = `game-action game-action--${theme}`;
      link.href = button.url;
      link.textContent = t(button.label);
      if (theme === 'steam') {
        const icon = document.createElement('img');
        icon.src = 'assets/steam_icon.png';
        icon.alt = '';
        icon.className = 'steam-icon';
        link.prepend(icon);
      }
      if (button.external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${t(button.label)} ${t('opens in a new tab')}`);
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 16 16');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M8.5 2.5h5v5m0-5L7 9m5.5.5v4h-10v-10h4');
        icon.append(path);
        link.append(icon);
      }
      return link;
    }));
  };

  const revealGameSection = () => {
    const section = carousel.closest('.games');
    const sectionTop = scrollY + section.getBoundingClientRect().top - 12;
    const bottomElement = gameVideo.hidden ? gameActions : gameVideo;
    const contentBottom = scrollY + bottomElement.getBoundingClientRect().bottom + 24;
    const top = Math.max(0, sectionTop, contentBottom - innerHeight);
    window.scrollTo({ top, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  };
  const scheduleSelectionScroll = () => {
    clearTimeout(selectionScrollTimer);
    selectionScrollTimer = setTimeout(revealGameSection, reduceMotion.matches ? 0 : 320);
  };
  const transitionGameDetails = (revealSelection = false) => {
    clearTimeout(detailsTimer);
    clearTimeout(selectionScrollTimer);
    if (reduceMotion.matches) {
      renderGameDetails();
      gameDetails.style.height = 'auto';
      if (revealSelection) scheduleSelectionScroll();
      return;
    }
    const previousHeight = gameDetails.getBoundingClientRect().height;
    gameDetails.style.height = `${previousHeight}px`;
    gameDetails.classList.add('is-changing');
    detailsTimer = setTimeout(() => {
      renderGameDetails();
      gameDetails.style.height = 'auto';
      const nextHeight = gameDetails.offsetHeight;
      gameDetails.style.height = `${previousHeight}px`;
      gameDetails.offsetHeight;
      gameDetails.style.height = `${nextHeight}px`;
      gameDetails.classList.remove('is-changing');
      if (revealSelection) scheduleSelectionScroll();
    }, 105);
  };

  gameDetails.addEventListener('transitionend', event => {
    if (event.propertyName === 'height' && !gameDetails.classList.contains('is-changing')) gameDetails.style.height = 'auto';
  });


  const layoutCarousel = (position = activeSlide) => {
    const count = carouselSlides.length;
    const width = carousel.clientWidth;
    const centerWidth = innerWidth <= 600 ? 78 : 63;
    carousel.style.aspectRatio = String(16 / (9 * centerWidth / 100));
    carouselSlides.forEach((slide, index) => {
      const distance = ((index - position + count / 2) % count + count) % count - count / 2;
      const depth = Math.abs(distance);
      const near = Math.min(depth, 1);
      const far = Math.max(0, Math.min(depth - 1, 1));
      slide.hidden = depth > 2.6;
      slide.classList.toggle('is-center', depth < .5);
      slide.classList.remove('is-left', 'is-right', 'is-far-left', 'is-far-right');
      const capsuleWidth = centerWidth - near * (centerWidth - 30) - far * 10;
      slide.style.width = `${capsuleWidth}%`;
      slide.style.height = `${capsuleWidth / centerWidth * 100}%`;
      slide.style.zIndex = String(Math.round(50 - depth * 10));
      slide.style.borderRadius = `calc(${42 - near * 19} * var(--u))`;
      slide.style.setProperty('--shift', `${Math.sign(distance) * width * (near * .27 + far * .13 + Math.max(0, depth - 2) * .1)}px`);
      slide.setAttribute('aria-hidden', String(index !== activeSlide));
      slide.setAttribute('aria-label', `${carouselGames[index].name}${index === activeSlide ? `. ${t('Selected game')}` : ` ${t('artwork')}`}`);
    });
    carouselStatus.textContent = carouselGames[activeSlide].name;
  };

  const flipCarousel = (direction, announce = true) => {
    activeSlide = (activeSlide + direction + carouselSlides.length) % carouselSlides.length;
    carouselStatus.setAttribute('aria-live', announce ? 'polite' : 'off');
    layoutCarousel();
    transitionGameDetails(true);
  };

  document.querySelector('.carousel-control--previous').addEventListener('click', () => flipCarousel(-1));
  document.querySelector('.carousel-control--next').addEventListener('click', () => flipCarousel(1));

  carousel.addEventListener('pointerdown', event => {
    if (event.target.closest('.carousel-control') || event.button !== 0) return;
    swipeStart = { x: event.clientX, lastX: event.clientX, time: performance.now(), velocity: 0, position: activeSlide, start: activeSlide, id: event.pointerId, slide: event.target.closest('.game-slide'), moved: false };
    carousel.setPointerCapture(event.pointerId);
  });
  carousel.addEventListener('pointermove', event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const now = performance.now();
    const step = Math.max(65, carousel.clientWidth * .22);
    swipeStart.velocity = (event.clientX - swipeStart.lastX) / Math.max(16, now - swipeStart.time);
    swipeStart.lastX = event.clientX;
    swipeStart.time = now;
    swipeStart.position = swipeStart.start - (event.clientX - swipeStart.x) / step;
    if (Math.abs(event.clientX - swipeStart.x) > 5) swipeStart.moved = true;
    carousel.classList.toggle('is-dragging', swipeStart.moved);
    layoutCarousel(swipeStart.position);
  });
  const finishDrag = (event, cancelled = false) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const drag = swipeStart;
    swipeStart = null;
    carousel.classList.remove('is-dragging');
    if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
    const count = carouselSlides.length;
    if (drag.moved) {
      const speed = performance.now() - drag.time < 100 && !cancelled ? drag.velocity : 0;
      const momentum = Math.max(-2.5, Math.min(2.5, speed * 180 / Math.max(65, carousel.clientWidth * .22)));
      activeSlide = ((Math.round(drag.position - momentum) % count) + count) % count;
      layoutCarousel();
      carouselStatus.setAttribute('aria-live', 'polite');
      transitionGameDetails(!cancelled);
    } else if (!cancelled && drag.slide) {
      const index = carouselSlides.indexOf(drag.slide);
      if (index !== activeSlide) flipCarousel(index - activeSlide);
      else scheduleSelectionScroll();
    } else layoutCarousel();
  };
  carousel.addEventListener('pointerup', event => finishDrag(event));
  carousel.addEventListener('pointercancel', event => finishDrag(event, true));
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      flipCarousel(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      flipCarousel(1);
    }
  });

  const resizeTrail = () => {
    if (matchMedia('(pointer: coarse)').matches) {
      trailCanvas.width = 1;
      trailCanvas.height = 1;
      return;
    }
    const ratio = Math.min(devicePixelRatio || 1, 2);
    trailCanvas.width = Math.round(innerWidth * ratio);
    trailCanvas.height = Math.round(innerHeight * ratio);
    trailContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addParticle = (x, y, type) => {
    if (MAX_PARTICLES < 1) return;
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const candy = type === 'candy';
    particles.push({
      x,
      y,
      vx: (Math.random() - .5) * (candy ? 9 : 22),
      vy: candy ? -8 - Math.random() * 12 : 10 + Math.random() * 25,
      size: candy ? 1 : 2.2 + Math.random() * 2.4,
      life: candy ? 1.25 + Math.random() * .35 : .55 + Math.random() * .45,
      age: 0,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * 2.2,
      color: candyColors[Math.floor(Math.random() * candyColors.length)],
      candy
    });
  };

  const addSparkBurst = (x, y) => {
    for (let index = 0; index < 14; index += 1) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const angle = index * Math.PI * 2 / 14 + (Math.random() - .5) * .24;
      const speed = 130 + Math.random() * 120;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 9,
        life: .25 + Math.random() * .18,
        age: 0,
        rotation: angle,
        color: sparkColors[index % sparkColors.length],
        spark: true
      });
    }
    if (!trailFrame) trailFrame = requestAnimationFrame(animateTrail);
  };

  const drawSpark = particle => {
    const fade = Math.max(0, 1 - particle.age / particle.life);
    const length = particle.size * (.35 + fade * .65);
    trailContext.globalAlpha = fade;
    trailContext.strokeStyle = particle.color;
    trailContext.shadowColor = particle.color;
    trailContext.shadowBlur = 12 * fade;
    trailContext.lineWidth = 1.2 + fade * 1.4;
    trailContext.lineCap = 'round';
    trailContext.beginPath();
    trailContext.moveTo(-length, 0);
    trailContext.lineTo(0, 0);
    trailContext.stroke();
    trailContext.globalAlpha = 1;
    trailContext.shadowBlur = 0;
  };

  const drawStar = particle => {
    const fade = Math.max(0, 1 - particle.age / particle.life);
    const radius = particle.size * fade;
    const glow = trailContext.createRadialGradient(0, 0, 0, 0, 0, radius * 3.2);
    glow.addColorStop(0, `${particle.color}bb`);
    glow.addColorStop(1, `${particle.color}00`);
    trailContext.fillStyle = glow;
    trailContext.beginPath();
    trailContext.arc(0, 0, radius * 3.2, 0, Math.PI * 2);
    trailContext.fill();
    trailContext.strokeStyle = `rgba(255, 250, 218, ${fade * .9})`;
    trailContext.lineWidth = Math.max(.6, radius * .42);
    trailContext.beginPath();
    trailContext.moveTo(-radius * 1.6, 0);
    trailContext.lineTo(radius * 1.6, 0);
    trailContext.moveTo(0, -radius * 1.6);
    trailContext.lineTo(0, radius * 1.6);
    trailContext.stroke();
  };

  const drawCandy = particle => {
    const fade = Math.max(0, 1 - particle.age / particle.life);
    trailContext.globalAlpha = fade;
    trailContext.strokeStyle = '#fff5dc';
    trailContext.lineWidth = 4;
    trailContext.lineCap = 'round';
    trailContext.lineJoin = 'round';
    trailContext.beginPath();
    trailContext.moveTo(-3, 8);
    trailContext.lineTo(-3, -1);
    trailContext.quadraticCurveTo(-3, -7, 2, -7);
    trailContext.quadraticCurveTo(7, -7, 7, -2);
    trailContext.stroke();
    trailContext.strokeStyle = '#ef394c';
    trailContext.lineWidth = 1.8;
    trailContext.setLineDash([2.4, 2.1]);
    trailContext.lineDashOffset = particle.age * 8;
    trailContext.beginPath();
    trailContext.moveTo(-3, 8);
    trailContext.lineTo(-3, -1);
    trailContext.quadraticCurveTo(-3, -7, 2, -7);
    trailContext.quadraticCurveTo(7, -7, 7, -2);
    trailContext.stroke();
    trailContext.setLineDash([]);
    trailContext.globalAlpha = 1;
  };

  const animateTrail = timestamp => {
    const elapsed = Math.min((timestamp - (lastFrame || timestamp)) / 1000, .04);
    lastFrame = timestamp;
    trailContext.clearRect(0, 0, innerWidth, innerHeight);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += elapsed;
      if (particle.age >= particle.life) {
        particles.splice(index, 1);
        continue;
      }
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      if (particle.spark) {
        const drag = Math.exp(-7 * elapsed);
        particle.vx *= drag;
        particle.vy *= drag;
      } else {
        particle.vy += (particle.candy ? 17 : 12) * elapsed;
        particle.rotation += particle.spin * elapsed;
      }
      trailContext.save();
      trailContext.translate(particle.x, particle.y);
      trailContext.rotate(particle.rotation);
      if (particle.spark) drawSpark(particle);
      else if (particle.candy) drawCandy(particle);
      else drawStar(particle);
      trailContext.restore();
    }

    if (particles.length) trailFrame = requestAnimationFrame(animateTrail);
    else {
      trailFrame = 0;
      lastFrame = 0;
    }
  };

  const resize = () => {
    board.style.setProperty('--scale', shell.clientWidth / 1232);
    shellHeight = shell.offsetHeight;
    decorationMetrics = decorations.map(element => ({ element, depth: Number(element.dataset.parallax), top: element.offsetTop, height: element.offsetHeight }));
    layoutCarousel();
  };

  addEventListener('resize', resize, { passive: true });
  const updateCursorVisibility = event => {
    if (event.pointerType === 'touch') return true;
    const sourceWidth = cursorElement.naturalWidth || 48;
    const sourceHeight = cursorElement.naturalHeight || 58;
    const cursorWidth = CURSOR_SIZE * sourceWidth / sourceHeight;
    cursorElement.style.width = `${cursorWidth}px`;
    cursorElement.style.left = `${event.clientX - cursorWidth * 4 / sourceWidth}px`;
    cursorElement.style.top = `${event.clientY - CURSOR_SIZE * 3 / sourceHeight}px`;
    const target = event.target instanceof Element ? event.target : document.elementFromPoint(event.clientX, event.clientY);
    if (!target) return false;
    const cursor = getComputedStyle(target).cursor;
    const useNativeCursor = cursor !== 'auto' && cursor !== 'default' && cursor !== 'none' && !cursor.startsWith('url(');
    document.body.classList.toggle('cursor-ready', !useNativeCursor && cursorElement.complete && !!cursorElement.naturalWidth);
    return useNativeCursor;
  };

  addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const now = performance.now();
    if (previousMotion) {
      const speed = Math.hypot(event.clientX - previousMotion.x, event.clientY - previousMotion.y) / Math.max(16, now - previousMotion.time);
      cursorFocus = Math.min(2.5, speed * .7);
    }
    previousMotion = { x: event.clientX, y: event.clientY, time: now };
    const useNativeCursor = updateCursorVisibility(event);
    const trailX = event.clientX + TRAIL_OFFSET_X;
    const trailY = event.clientY + TRAIL_OFFSET_Y;
    if (!reduceMotion.matches && !useNativeCursor) {
      if (previousPoint) {
        const dx = trailX - previousPoint.x;
        const dy = trailY - previousPoint.y;
        const distance = Math.hypot(dx, dy);
        const count = Math.min(8, Math.ceil(distance / PARTICLE_SPACING));
        for (let index = 0; index < count; index += 1) {
          const t = (index + 1) / count;
          const x = previousPoint.x + dx * t;
          const y = previousPoint.y + dy * t;
          addParticle(x, y, 'star');
          candyDistance += distance / count;
          if (candyDistance >= CANDY_SPACING) {
            addParticle(x, y, 'candy');
            candyDistance = 0;
          }
        }
      } else {
        addParticle(trailX, trailY, 'star');
      }
      previousPoint = { x: trailX, y: trailY };
      if (particles.length && !trailFrame) trailFrame = requestAnimationFrame(animateTrail);
    } else previousPoint = null;
    if (reduceMotion.matches) return;
    position.targetX = Math.max(-1, Math.min(1, (event.clientX / innerWidth - .5) * 2));
    position.targetY = Math.max(-1, Math.min(1, (event.clientY / innerHeight - .5) * 2));
  }, { passive: true });
  addEventListener('pointerdown', event => {
    updateCursorVisibility(event);
    if (!reduceMotion.matches && event.pointerType !== 'touch' && event.button === 0) addSparkBurst(event.clientX, event.clientY);
  }, { passive: true });
  addEventListener('pointerup', updateCursorVisibility, { passive: true });
  addEventListener('pointerout', event => {
    if (!event.relatedTarget) {
      previousPoint = null;
      previousMotion = null;
      position.targetX = 0;
      position.targetY = 0;
      document.body.classList.remove('cursor-ready');
    }
  });

  let floatingPhase = 0;
  let previousSceneTime = 0;
  let scrollTarget = scrollY;
  let scrollPosition = scrollY;
  let skyScrollPosition = scrollY;
  addEventListener('scroll', () => { scrollTarget = scrollY; }, { passive: true });

  function startScene() {
    if (!sceneFrame && !document.hidden && !reduceMotion.matches && (heroVisible || showcaseVisible)) sceneFrame = requestAnimationFrame(tick);
  }

  function tick(time) {
    sceneFrame = 0;
    if (document.hidden || reduceMotion.matches || (!heroVisible && !showcaseVisible)) return;
    const elapsed = previousSceneTime ? Math.min(50, time - previousSceneTime) : 0;
    previousSceneTime = time;
    floatingPhase += elapsed * BACKGROUND_PARALLAX_SPEED;
    position.x += (position.targetX - position.x) * .065;
    position.y += (position.targetY - position.y) * .065;
    if (heroVisible) {
      board.style.setProperty('--pointer-x', position.x.toFixed(3));
      board.style.setProperty('--pointer-y', position.y.toFixed(3));
      board.style.setProperty('--background-pointer-x', (position.x * BACKGROUND_PARALLAX_SPEED).toFixed(3));
      board.style.setProperty('--background-pointer-y', (position.y * BACKGROUND_PARALLAX_SPEED).toFixed(3));
    }
    scrollPosition += (scrollTarget - scrollPosition) * .06;
    const skyEasing = 1 - Math.exp(-elapsed * .0037 * Math.abs(BACKGROUND_PARALLAX_SPEED));
    skyScrollPosition += (scrollTarget - skyScrollPosition) * skyEasing;
    cursorFocus *= .94;
    focus += (cursorFocus - focus) * .12;
    if (showcaseVisible) {
      const skyOffset = Math.tanh((skyScrollPosition - shellHeight) * .0008) * 100 * BACKGROUND_PARALLAX_SPEED;
      showcase.style.setProperty('--sky-offset', `${skyOffset.toFixed(2)}px`);
      showcase.style.setProperty('--motion-blur', `${focus.toFixed(2)}px`);
      decorationMetrics.forEach(({ element, depth, top, height }, index) => {
        const speed = BACKGROUND_PARALLAX_SPEED;
        const amplitude = Math.min(1, Math.abs(speed));
        const drift = Math.sin(floatingPhase / 3400 + index * 1.8) * 8 * amplitude;
        const distance = scrollPosition + innerHeight / 2 - (shellHeight + top + height / 2);
        const scrollShift = distance * depth * speed;
        const floatY = Math.cos(floatingPhase / 2900 + index) * 7 * amplitude;
        element.style.translate = `${(position.x * depth * speed * 35 + drift).toFixed(2)}px ${(scrollShift + floatY).toFixed(2)}px`;
      });
    }
    startScene();
  }

  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === shell) heroVisible = entry.isIntersecting;
      else showcaseVisible = entry.isIntersecting;
    });
    startScene();
  });
  sceneObserver.observe(shell);
  sceneObserver.observe(showcase);
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('animations-paused', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(sceneFrame);
      sceneFrame = 0;
      previousSceneTime = 0;
      cancelAnimationFrame(trailFrame);
      trailFrame = 0;
      lastFrame = 0;
      particles.length = 0;
      trailContext.clearRect(0, 0, innerWidth, innerHeight);
    } else startScene();
  });
  reduceMotion.addEventListener('change', startScene);

  document.addEventListener('studio-language-change', () => {
    renderValues();
    renderGameDetails();
    layoutCarousel();
  });
  renderGameDetails();
  resize();
  requestAnimationFrame(() => carousel.classList.add('is-ready'));
  resizeTrail();
  addEventListener('resize', resizeTrail, { passive: true });
  startScene();
})();
