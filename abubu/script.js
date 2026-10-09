(() => {
  const CAROUSEL_GAMES = [
    {
      name: 'Christmasing Around',
      title: 'Christmasing Around',
      banner: 'assets/CABackground.webp',
      character: 'assets/CAElfGift.png',
      gift: 'assets/CAGift.png',
      logo: 'assets/CALogo.png',
      tags: ['Frens slop', 'Xmas', 'Silly'],
      description: 'Christmasing Around is a chaotic, co op party game about making Christmas as messy and magical as possible. Play with your friends, cause some holiday havoc, and spread joy... or at least try to.',
      buttons: [
        { label: 'Steam', url: 'https://store.steampowered.com/search/?term=Christmasing%20Around', theme: 'steam', external: true },
        { label: 'Presskit', url: 'mailto:hi@abubudance.com?subject=Christmasing%20Around%20press%20kit', theme: 'primary' },
        { label: 'YouTube', url: 'https://www.youtube.com/results?search_query=Christmasing+Around+Abubu+Dance', theme: 'youtube', external: true }
      ]
    },
    {
      name: 'Coming soon',
      title: 'Coming Soon',
      tags: ['In the oven'],
      description: 'Another playful world is on the way. Get in touch with the team to hear what we are making.',
      buttons: [{ label: 'Meet the studio', url: '#about', theme: 'secondary' }]
    },
    {
      name: 'More games soon',
      title: 'More Games Soon',
      tags: ['Stay tuned'],
      description: 'We are working on more playful projects. Follow along for the next reveal.',
      buttons: [{ label: 'Contact us', url: 'mailto:hi@abubudance.com', theme: 'primary' }]
    }
  ];
  const FADE_TOP = 469;
  const MAX_PARTICLES = 100;
  const CURSOR_SIZE = 58;
  const PARTICLE_SPACING = 14;
  const CANDY_SPACING = 54;
  const TRAIL_OFFSET_X = Math.round(CURSOR_SIZE * .58);
  const TRAIL_OFFSET_Y = Math.round(CURSOR_SIZE * .7);
  const shell = document.getElementById('scene-shell');
  const board = document.getElementById('artboard');
  const logo = board.querySelector('.game-logo');
  const trailCanvas = document.getElementById('cursor-trail');
  const trailContext = trailCanvas.getContext('2d');
  const cursorElement = document.getElementById('custom-cursor');
  const carousel = document.getElementById('game-carousel');
  const carouselTrack = carousel.querySelector('.carousel-track');
  const carouselGames = CAROUSEL_GAMES;
  const carouselSlides = carouselGames.map(game => {
    const slide = document.createElement('article');
    slide.className = `game-slide${game.character || game.logo ? '' : ' game-slide--upcoming'}`;
    slide.setAttribute('aria-label', `${game.title || game.name} artwork`);
    if (game.banner) slide.style.backgroundImage = `url("${game.banner}")`;
    if (game.character) {
      const image = document.createElement('img');
      image.className = 'game-slide__character';
      image.src = game.character;
      image.alt = '';
      image.draggable = false;
      slide.append(image);
    }
    if (game.gift) {
      const giftImage = document.createElement('img');
      giftImage.className = 'game-slide__gift';
      giftImage.src = game.gift;
      giftImage.alt = '';
      giftImage.draggable = false;
      slide.append(giftImage);
    }
    if (game.logo) {
      const logoImage = document.createElement('img');
      logoImage.className = 'game-slide__logo';
      logoImage.src = game.logo;
      logoImage.alt = '';
      logoImage.draggable = false;
      slide.append(logoImage);
    }
    if (!game.character && !game.logo) {
      const title = document.createElement('span');
      title.textContent = game.title || game.name;
      slide.append(title);
    }
    carouselTrack.append(slide);
    return slide;
  });
  const carouselStatus = document.getElementById('carousel-status');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let parallaxFrame = 0;
  const gameTags = document.querySelector('.game-tags');
  const gameDescription = document.querySelector('.game-description');
  const gameActions = document.querySelector('.game-actions');
  const gameDetails = document.querySelector('.game-details');
  const buttonThemes = new Set(['youtube', 'primary', 'secondary', 'steam']);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const position = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const particles = [];
  const candyColors = ['#ff4f52', '#35e29b', '#ffd64a', '#fff4dc'];
  const sparkColors = ['#fff7cf', '#ffd858', '#8feaff', '#ffb8ee'];
  let previousPoint = null;
  let candyDistance = 0;
  let lastFrame = 0;
  let trailFrame = 0;
  let activeSlide = 0;
  let carouselTimer = 0;
  let carouselVisible = false;
  let carouselHovered = false;
  let swipeStart = null;
  let detailsTimer = 0;

  const renderGameDetails = () => {
    const game = carouselGames[activeSlide];
    gameTags.replaceChildren(...(game.tags || []).map(tag => {
      const item = document.createElement('span');
      item.textContent = tag;
      return item;
    }));
    gameDescription.textContent = game.description || '';
    gameActions.replaceChildren(...(game.buttons || []).filter(button => button.label && button.url).map(button => {
      const link = document.createElement('a');
      const theme = buttonThemes.has(button.theme) ? button.theme : 'primary';
      link.className = `game-action game-action--${theme}`;
      link.href = button.url;
      link.textContent = button.label;
      if (button.external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${button.label} opens in a new tab`);
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

  const transitionGameDetails = () => {
    clearTimeout(detailsTimer);
    if (reduceMotion.matches) {
      renderGameDetails();
      gameDetails.style.height = 'auto';
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
    }, 105);
  };

  gameDetails.addEventListener('transitionend', event => {
    if (event.propertyName === 'height' && !gameDetails.classList.contains('is-changing')) gameDetails.style.height = 'auto';
  });

  const scheduleCarousel = () => {
    clearTimeout(carouselTimer);
    if (!carouselVisible || carouselHovered || carousel.matches(':focus-visible') || document.hidden || reduceMotion.matches) return;
    carouselTimer = setTimeout(() => {
      flipCarousel(1, false);
    }, 4000);
  };

  const layoutCarousel = () => {
    const count = carouselSlides.length;
    const width = carousel.clientWidth;
    carouselSlides.forEach((slide, index) => {
      const distance = (index - activeSlide + count) % count;
      slide.classList.remove('is-center', 'is-left', 'is-right', 'is-far-left', 'is-far-right');
      if (distance === 0) {
        slide.classList.add('is-center');
        slide.style.setProperty('--shift', '0px');
        slide.setAttribute('aria-hidden', 'false');
        carouselStatus.textContent = carouselGames[index].name;
      } else if (distance === 1) {
        slide.classList.add('is-right');
        slide.style.setProperty('--shift', `${width * .39}px`);
        slide.setAttribute('aria-hidden', 'true');
      } else if (distance === count - 1) {
        slide.classList.add('is-left');
        slide.style.setProperty('--shift', `${width * -.39}px`);
        slide.setAttribute('aria-hidden', 'true');
      } else if (distance < count / 2) {
        slide.classList.add('is-far-right');
        slide.style.setProperty('--shift', `${width * .54}px`);
        slide.setAttribute('aria-hidden', 'true');
      } else {
        slide.classList.add('is-far-left');
        slide.style.setProperty('--shift', `${width * -.54}px`);
        slide.setAttribute('aria-hidden', 'true');
      }
    });
  };

  const flipCarousel = (direction, announce = true) => {
    activeSlide = (activeSlide + direction + carouselSlides.length) % carouselSlides.length;
    carouselStatus.setAttribute('aria-live', announce ? 'polite' : 'off');
    layoutCarousel();
    transitionGameDetails();
    scheduleCarousel();
  };

  carousel.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    carouselHovered = true;
    scheduleCarousel();
  });
  carousel.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    carouselHovered = false;
    scheduleCarousel();
  });
  carousel.addEventListener('focusin', () => {
    scheduleCarousel();
  });
  carousel.addEventListener('focusout', () => {
    scheduleCarousel();
  });
  carousel.addEventListener('pointerdown', event => {
    swipeStart = { x: event.clientX, id: event.pointerId, slide: event.target.closest('.game-slide') };
    carousel.setPointerCapture(event.pointerId);
  });
  carousel.addEventListener('pointerup', event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const distance = event.clientX - swipeStart.x;
    const slide = swipeStart.slide;
    swipeStart = null;
    if (Math.abs(distance) > 40) {
      flipCarousel(distance < 0 ? 1 : -1);
      return;
    }
    if (slide?.classList.contains('is-left')) flipCarousel(-1);
    if (slide?.classList.contains('is-right')) flipCarousel(1);
  });
  carousel.addEventListener('pointercancel', () => { swipeStart = null; });
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
  document.addEventListener('visibilitychange', scheduleCarousel);
  reduceMotion.addEventListener('change', scheduleCarousel);
  new IntersectionObserver(entries => {
    carouselVisible = entries[0].isIntersecting;
    scheduleCarousel();
  }, { threshold: .25 }).observe(carousel);

  const resizeTrail = () => {
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
    const scale = shell.clientWidth / 1232;
    const artHeight = 818 * scale;
    const fadeHeight = 818 - FADE_TOP + innerHeight / scale;
    board.style.setProperty('--scale', scale);
    board.style.setProperty('--fade-height', `${fadeHeight}px`);
    board.style.setProperty('--fade-stop', `${((818 - FADE_TOP) / fadeHeight) * 100}%`);
    board.style.height = `${FADE_TOP + fadeHeight}px`;
    shell.style.height = `${artHeight}px`;
    shell.style.setProperty('--mobile-art-top', `${Math.max(84, (innerHeight - artHeight - 60) / 2)}px`);
    shell.style.setProperty('--mobile-art-height', `${artHeight}px`);
    layoutCarousel();
  };

  const updateParallax = () => {
    parallaxFrame = 0;
    parallaxItems.forEach(item => {
      const amount = Number(item.dataset.parallax) || 0;
      item.style.setProperty('--parallax-shift', `${scrollY * amount}px`);
    });
  };

  const scheduleParallax = () => {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
  };

  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', scheduleParallax, { passive: true });
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
    if (!reduceMotion.matches && event.button === 0) addSparkBurst(event.clientX, event.clientY);
  }, { passive: true });
  addEventListener('pointerup', updateCursorVisibility, { passive: true });
  addEventListener('pointerout', event => {
    if (!event.relatedTarget) {
      previousPoint = null;
      position.targetX = 0;
      position.targetY = 0;
      document.body.classList.remove('cursor-ready');
    }
  });

  function tick() {
    position.x += (position.targetX - position.x) * .065;
    position.y += (position.targetY - position.y) * .065;
    if (!reduceMotion.matches) {
      logo.style.setProperty('--logo-x', `${(position.x * 3.5).toFixed(2)}px`);
      logo.style.setProperty('--logo-y', `${(position.y * 2.5).toFixed(2)}px`);
      requestAnimationFrame(tick);
    }
  }

  renderGameDetails();
  resize();
  updateParallax();
  requestAnimationFrame(() => carousel.classList.add('is-ready'));
  resizeTrail();
  addEventListener('resize', resizeTrail, { passive: true });
  if (!reduceMotion.matches) requestAnimationFrame(tick);
})();
