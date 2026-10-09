(() => {
  const card = document.getElementById('about-sticker');
  const canvas = card.querySelector('canvas');
  const context = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const front = card.querySelector('.about-video');
  const poster = new Image();
  poster.src = front.getAttribute('poster');
  let userPaused = reduceMotion.matches;
  let inView = false;
  let hintFrame = 0;
  let videoFrame = 0;
  const hintPeel = .028;
  let width = 0;
  let height = 0;
  let peel = 0;
  let corner = 'top-right';
  let interacted = false;
  let dragStart = null;
  let animation = 0;
  let motionFrame = 0;
  let motionTime = 0;
  let targetPeel = 0;
  let peelVelocity = 0;
  let glowX = .5;
  let glowY = .5;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const depthLimit = () => width + height;
  const mapPoint = (x, y) => [corner.endsWith('right') ? x : width - x, corner.startsWith('top') ? y : height - y];

  const clipPolygon = (points, depth, keepFront) => {
    const distance = ([x, y]) => width - x + y;
    const inside = point => keepFront ? distance(point) >= depth : distance(point) <= depth;
    const result = [];
    points.forEach((point, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const previousInside = inside(previous);
      const pointInside = inside(point);
      if (previousInside !== pointInside) {
        const previousDistance = distance(previous);
        const nextDistance = distance(point);
        const progress = (depth - previousDistance) / (nextDistance - previousDistance);
        result.push([previous[0] + (point[0] - previous[0]) * progress, previous[1] + (point[1] - previous[1]) * progress]);
      }
      if (pointInside) result.push(point);
    });
    return result;
  };

  const tracePolygon = points => {
    context.beginPath();
    points.forEach(([x, y], index) => {
      if (index) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    context.closePath();
  };

  const traceRoundedPolygon = (points, radii) => {
    context.beginPath();
    points.forEach(([x, y], index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const next = points[(index + 1) % points.length];
      const incoming = Math.hypot(previous[0] - x, previous[1] - y);
      const outgoing = Math.hypot(next[0] - x, next[1] - y);
      const radius = Math.min(radii[index], incoming * .45, outgoing * .45);
      const startX = x + (previous[0] - x) * radius / (incoming || 1);
      const startY = y + (previous[1] - y) * radius / (incoming || 1);
      const endX = x + (next[0] - x) * radius / (outgoing || 1);
      const endY = y + (next[1] - y) * radius / (outgoing || 1);
      if (index) context.lineTo(startX, startY);
      else context.moveTo(startX, startY);
      context.quadraticCurveTo(x, y, endX, endY);
    });
    context.closePath();
  };

  const transformToCorner = () => {
    if (corner === 'top-left') {
      context.translate(width, 0);
      context.scale(-1, 1);
    } else if (corner === 'bottom-right') {
      context.translate(0, height);
      context.scale(1, -1);
    } else if (corner === 'bottom-left') {
      context.translate(width, height);
      context.scale(-1, -1);
    }
  };

  const coverImage = () => {
    const drawable = front.readyState >= 2 ? front : poster;
    const sourceWidth = drawable === front ? front.videoWidth : poster.naturalWidth;
    const sourceHeight = drawable === front ? front.videoHeight : poster.naturalHeight;
    if (!sourceWidth || !sourceHeight) return;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    context.drawImage(drawable, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
  };

  const render = () => {
    if (!width || !height || (!front.videoWidth && !poster.naturalWidth)) return;
    const depth = peel * depthLimit();
    const rectangle = [[0, 0], [width, 0], [width, height], [0, height]];
    const remaining = clipPolygon(rectangle, depth, true);
    context.clearRect(0, 0, width, height);

    if (remaining.length > 2) {
      context.save();
      tracePolygon(remaining.map(point => mapPoint(...point)));
      context.clip();
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      coverImage();
      const light = context.createRadialGradient(glowX * width, glowY * height, 4, glowX * width, glowY * height, width * .65);
      light.addColorStop(0, 'rgba(255, 255, 255, .56)');
      light.addColorStop(.25, 'rgba(117, 235, 255, .21)');
      light.addColorStop(.55, 'rgba(246, 143, 255, .12)');
      light.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.globalAlpha = card.classList.contains('is-hovered') ? .85 : .12;
      context.fillStyle = light;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (depth < 1) return;
    const peeled = clipPolygon(rectangle, depth, false);
    const folded = peeled.map(([x, y]) => {
      const offset = depth - (width - x + y);
      return [x - offset, y + offset];
    });

    context.save();
    transformToCorner();
    context.beginPath();
    context.moveTo(width - depth, 0);
    context.lineTo(width - depth + height, height);
    context.shadowColor = 'rgba(5, 6, 36, .75)';
    context.shadowBlur = 16 + peel * 30;
    context.shadowOffsetX = 7;
    context.shadowOffsetY = 8;
    context.strokeStyle = 'rgba(10, 10, 45, .28)';
    context.lineWidth = 8;
    context.stroke();
    context.restore();

    if (folded.length > 2) {
      context.save();
      transformToCorner();
      traceRoundedPolygon(folded, peeled.map(([x, y]) =>
        (x === 0 || x === width) && (y === 0 || y === height) ? 10 : 0
      ));
      context.shadowColor = 'rgba(5, 6, 36, .55)';
      context.shadowBlur = 12 + peel * 22;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 7;
      const paper = context.createLinearGradient(width - depth, 0, width, Math.min(depth, height));
      paper.addColorStop(0, '#fffefb');
      paper.addColorStop(.38, '#e6eaf1');
      paper.addColorStop(.7, '#faf9f5');
      paper.addColorStop(1, '#cdd6e5');
      context.fillStyle = paper;
      context.fill();
      context.shadowColor = 'transparent';
      context.clip();
      context.transform(0, 1, 1, 0, width - depth, depth - width);
      context.fillStyle = 'rgba(66, 77, 105, .13)';
      context.font = '600 12px system-ui';
      for (let row = -2; row * 43 < height + 86; row += 1) {
        for (let column = -2; column * 125 < width + 250; column += 1) context.fillText('Abubu Dance', column * 125, row * 43);
      }
      context.restore();
    }

    context.save();
    transformToCorner();
    context.beginPath();
    context.moveTo(width - depth, 0);
    context.lineTo(width - depth + height, height);
    context.strokeStyle = 'rgba(20, 24, 58, .32)';
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = 'rgba(255, 255, 255, .9)';
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();
  };

  const setPeel = value => {
    peel = clamp(value, 0, 1);
    render();
    const lifted = peel > hintPeel + .01;
    card.setAttribute('aria-pressed', String(lifted));
    card.setAttribute('aria-label', window.studioLanguage.t(lifted ? 'Unpeel the studio sticker' : 'Peel any corner of the studio sticker to reveal Than the cat'));
  };

  const stopMotion = () => {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    motionTime = 0;
    peelVelocity = 0;
  };

  const movePeel = time => {
    const elapsed = motionTime ? Math.min((time - motionTime) / 1000, .032) : 1 / 60;
    motionTime = time;
    const stiffness = dragStart ? 190 : 95;
    const damping = dragStart ? 25 : 19;
    peelVelocity += ((targetPeel - peel) * stiffness - peelVelocity * damping) * elapsed;
    const next = peel + peelVelocity * elapsed;
    setPeel(next);
    if ((peel === 0 && peelVelocity < 0) || (peel === 1 && peelVelocity > 0)) peelVelocity = 0;
    if (Math.abs(targetPeel - peel) < .0005 && Math.abs(peelVelocity) < .003) {
      setPeel(targetPeel);
      stopMotion();
      return;
    }
    motionFrame = requestAnimationFrame(movePeel);
  };

  const startMotion = () => {
    if (reduceMotion.matches) {
      setPeel(targetPeel);
      return;
    }
    if (!motionFrame) motionFrame = requestAnimationFrame(movePeel);
  };

  const animateTo = (value, duration) => {
    cancelAnimationFrame(animation);
    stopMotion();
    if (reduceMotion.matches) {
      setPeel(value);
      return;
    }
    const initial = peel;
    const startTime = performance.now();
    const animate = time => {
      const progress = clamp((time - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPeel(initial + (value - initial) * eased);
      if (progress < 1) animation = requestAnimationFrame(animate);
      else animation = 0;
    };
    animation = requestAnimationFrame(animate);
  };

  const togglePeel = () => {
    const expand = peel <= hintPeel + .01;
    animateTo(expand ? 1 : hintPeel, expand ? Math.max(650, (1 - peel) * 1300) : 650);
  };

  const findCorner = (x, y) => {
    const horizontal = x < width * .32 ? 'left' : x > width * .68 ? 'right' : null;
    const vertical = y < height * .32 ? 'top' : y > height * .68 ? 'bottom' : null;
    return horizontal && vertical ? `${vertical}-${horizontal}` : null;
  };

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    render();
  };

  card.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const bounds = card.getBoundingClientRect();
    const localX = (event.clientX - bounds.left) * width / bounds.width;
    const localY = (event.clientY - bounds.top) * height / bounds.height;
    const nextCorner = peel > hintPeel + .01 ? corner : findCorner(localX, localY);
    if (!nextCorner) return;
    event.preventDefault();
    interacted = true;
    cancelAnimationFrame(animation);
    animation = 0;
    stopMotion();
    if (corner !== nextCorner) {
      corner = nextCorner;
      setPeel(0);
    }
    targetPeel = peel;
    dragStart = { x: event.clientX, y: event.clientY, depth: peel * depthLimit(), movement: 0, velocity: 0, lastTime: performance.now(), lastMoveTime: 0 };
    card.classList.add('is-dragging');
    card.setPointerCapture(event.pointerId);
  });

  const updateDragTarget = event => {
    const inwardX = (event.clientX - dragStart.x) * (corner.endsWith('right') ? -1 : 1);
    const inwardY = (event.clientY - dragStart.y) * (corner.startsWith('top') ? 1 : -1);
    dragStart.movement = Math.max(dragStart.movement, Math.abs(inwardX) + Math.abs(inwardY));
    const nextTarget = clamp((dragStart.depth + (inwardX + inwardY) * .5) / depthLimit(), 0, 1);
    const now = performance.now();
    const elapsed = Math.max((now - dragStart.lastTime) / 1000, .008);
    const speed = clamp((nextTarget - targetPeel) / elapsed, -3, 3);
    dragStart.velocity = dragStart.velocity * .5 + speed * .5;
    dragStart.lastTime = now;
    if (nextTarget !== targetPeel) dragStart.lastMoveTime = now;
    targetPeel = nextTarget;
    startMotion();
  };

  card.addEventListener('pointermove', event => {
    if (dragStart) {
      updateDragTarget(event);
      return;
    }
    if (event.pointerType !== 'mouse' || reduceMotion.matches) return;
    const bounds = card.getBoundingClientRect();
    glowX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    glowY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    card.classList.add('is-hovered');
    card.style.setProperty('--tilt-x', `${((.5 - glowY) * 12).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${((glowX - .5) * 12).toFixed(2)}deg`);
    render();
  });

  const endDrag = event => {
    if (!dragStart) return;
    if (event.type === 'pointerup') updateDragTarget(event);
    const moved = dragStart.movement > 6;
    const recent = Math.exp(-(performance.now() - dragStart.lastMoveTime) / 90);
    const momentum = clamp(dragStart.velocity * recent * .14, -.18, .18);
    dragStart = null;
    card.classList.remove('is-dragging');
    if (!moved) togglePeel();
    else if (event.type === 'pointerup') {
      targetPeel = clamp(targetPeel + momentum, 0, 1);
      startMotion();
    }
  };

  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  card.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('pointerup', endDrag);

  card.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    interacted = true;
    corner = 'top-right';
    togglePeel();
  });

  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-hovered');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    render();
  });

  poster.addEventListener('load', () => {
    card.classList.add('is-ready');
    render();
  });
  if (poster.complete && poster.naturalWidth) card.classList.add('is-ready');
  front.addEventListener('loadeddata', () => {
    card.classList.add('is-ready');
    render();
  });
  front.addEventListener('seeked', render);
  const scheduleVideo = () => {
    if (videoFrame || !inView || front.paused || document.hidden) return;
    videoFrame = front.requestVideoFrameCallback ? front.requestVideoFrameCallback(renderVideo) : requestAnimationFrame(renderVideo);
  };
  const renderVideo = () => {
    videoFrame = 0;
    if (inView && !front.paused && !document.hidden) render();
    scheduleVideo();
  };
  const stopVideoFrame = () => {
    if (front.cancelVideoFrameCallback) front.cancelVideoFrameCallback(videoFrame);
    else cancelAnimationFrame(videoFrame);
    videoFrame = 0;
  };
  const updateVideo = () => {
    if (inView && !userPaused && !document.hidden) front.play().catch(() => {});
    else front.pause();
    if (inView) {
      render();
      startHint();
    }
  };
  front.addEventListener('play', scheduleVideo);
  front.addEventListener('pause', stopVideoFrame);
  if (front.readyState >= 2) card.classList.add('is-ready');
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    updateVideo();
  }, { threshold: .05 }).observe(card);
  reduceMotion.addEventListener('change', () => {
    userPaused = reduceMotion.matches;
    updateVideo();
  });
  document.addEventListener('visibilitychange', updateVideo);
  new ResizeObserver(resize).observe(canvas);

  const startHint = () => {
    if (!hintFrame && !interacted && inView && !document.hidden && !reduceMotion.matches) hintFrame = requestAnimationFrame(pulseHint);
  };
  const pulseHint = time => {
    hintFrame = 0;
    if (interacted || !inView || document.hidden || reduceMotion.matches) return;
    if (!dragStart && !animation) {
      corner = 'top-right';
      peel = hintPeel + Math.sin(time / 1150) * .008;
      if (front.paused || !front.requestVideoFrameCallback) render();
    }
    startHint();
  };

  document.addEventListener('studio-language-change', render);
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    if (!interacted) animateTo(hintPeel, 1500);
  }, { threshold: .35 });
  observer.observe(card);
})();
