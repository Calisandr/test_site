/* ============== Морденко Евгения · script.js ============== */

(function(){
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Loader ---- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader && loader.classList.add('is-hidden'), 600);
  });
  // safety
  setTimeout(() => loader && loader.classList.add('is-hidden'), 3000);

  /* ---- Lenis smooth scroll ---- */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !reduceMotion){
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---- Custom cursor: now handled purely via CSS url() — no JS needed ---- */

  /* ---- Magnetic buttons ---- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches){
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = el.classList.contains('btn') ? 0.35 : 0.18;
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---- Scroll progress ---- */
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress(){
    const h = document.documentElement;
    const scrolled = (h.scrollTop || document.body.scrollTop) /
                     ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight);
    if (scrollProgress) scrollProgress.style.width = (scrolled * 100) + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ---- Nav scrolled state ---- */
  const nav = document.getElementById('nav');
  function onScroll(){
    const scrolled = window.scrollY > 40;
    nav.classList.toggle('scrolled', scrolled);
    // Mirror on body so the fixed-positioned burger (which lives outside <nav>)
    // can also react to the scrolled state
    document.body.classList.toggle('nav-scrolled', scrolled);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Burger mobile menu ---- */
  const burger = document.getElementById('burger');
  const navMobile = document.getElementById('navMobile');
  function closeMobile(){
    burger.classList.remove('active');
    navMobile.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = navMobile.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (lenis){ isOpen ? lenis.stop() : lenis.start(); }
  });
  navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));
  document.addEventListener('click', e => {
    if (navMobile.classList.contains('open') &&
        !navMobile.contains(e.target) &&
        !burger.contains(e.target)) closeMobile();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMobile.classList.contains('open')) closeMobile();
  });

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion){
    revealEls.forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
      el.classList.add('in');
    });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---- Hero text split + reveal ---- */
  if (typeof gsap !== 'undefined' && !reduceMotion){
    const heroDisplay = document.querySelector('.hero .display[data-split]');
    if (heroDisplay){
      const words = heroDisplay.innerHTML.split(/(\s+)/);
      heroDisplay.innerHTML = words.map(w => {
        if (w.trim() === '') return w;
        return `<span class="word"><span class="word-inner" style="display:inline-block">${w}</span></span>`;
      }).join('');
      heroDisplay.querySelectorAll('.word').forEach(el => {
        el.style.display = 'inline-block';
        el.style.overflow = 'hidden';
        el.style.verticalAlign = 'top';
        // padding/negative margin gives room for descenders & commas
        el.style.paddingBottom = '0.18em';
        el.style.marginBottom = '-0.18em';
      });
      gsap.from('.hero .display .word-inner', {
        y: '110%',
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.04,
        delay: 0.7,
        onComplete: () => {
          // remove clipping after animation so punctuation never gets cut later (resize, etc.)
          heroDisplay.querySelectorAll('.word').forEach(el => {
            el.style.overflow = 'visible';
          });
        }
      });
    }

    // Hero other elements
    gsap.from('.hero__label, .hero__lede, .hero__cta, .hero__stats', {
      opacity: 0, y: 30,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 1.3
    });
    gsap.from('.hero__portrait', {
      opacity: 0, scale: 0.95,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.9
    });
  }

  /* ---- Hero parallax on portrait ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion){
    const portrait = document.querySelector('.hero__portrait');
    if (portrait){
      gsap.to(portrait, {
        y: -80,
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }
    // Orbs subtle parallax
    gsap.to('.hero__orb--1', {
      y: -120, x: -40,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
    });
    gsap.to('.hero__orb--2', {
      y: 100, x: 40,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
    });
  }

  /* ---- Number counters ---- */
  function animateCounter(el, target, duration = 2000){
    const start = performance.now();
    const startVal = 0;
    function tick(now){
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = v.toLocaleString('ru-RU');
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('ru-RU');
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length){
    const ioCounter = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          const target = parseInt(e.target.dataset.counter, 10);
          animateCounter(e.target, target);
          ioCounter.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => ioCounter.observe(el));
  }

  /* ---- Auto-size cert seals: tag each by character count ---- */
  document.querySelectorAll('.cert__seal').forEach(el => {
    const len = el.textContent.trim().length;
    el.setAttribute('data-len', len);
  });

  /* ---- Credentials tabs ---- */
  const tabs = document.querySelectorAll('.creds__tab');
  const panels = document.querySelectorAll('.creds__panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`.creds__panel[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
      if (typeof gsap !== 'undefined' && !reduceMotion){
        gsap.from(`.creds__panel[data-panel="${target}"] .cert`, {
          opacity: 0, y: 30,
          stagger: 0.06,
          duration: 0.6,
          ease: 'power3.out'
        });
      }
    });
  });

  /* ---- Testimonials slider ---- */
  const track = document.getElementById('testTrack');
  const cards = track && track.children;
  const prev = document.getElementById('testPrev');
  const next = document.getElementById('testNext');
  let index = 0;

  function getVisible(){ return window.innerWidth < 980 ? 1 : 2; }
  function getMaxIndex(){ return Math.max(0, cards.length - getVisible()); }

  function update(){
    if (!cards || !cards[0]) return;
    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 28;
    const cardWidth = cards[0].getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-index * cardWidth}px)`;
  }

  if (prev && next){
    prev.addEventListener('click', () => { index = Math.max(0, index - 1); update(); restartAuto(); });
    next.addEventListener('click', () => { index = Math.min(getMaxIndex(), index + 1); update(); restartAuto(); });
    window.addEventListener('resize', () => { index = Math.min(index, getMaxIndex()); update(); });

    let auto;
    function startAuto(){
      clearInterval(auto);
      auto = setInterval(() => {
        index = index >= getMaxIndex() ? 0 : index + 1;
        update();
      }, 7000);
    }
    function stopAuto(){ clearInterval(auto); }
    function restartAuto(){ stopAuto(); startAuto(); }
    startAuto();
    track.addEventListener('mouseenter', stopAuto);
    track.addEventListener('mouseleave', startAuto);
    track.addEventListener('touchstart', stopAuto, { passive: true });
  }

  /* ---- FAQ + Guide details exclusive open (optional) ---- */
  // No exclusivity — let users open multiple

  /* ---- Form: real submission via Web3Forms ---- */
  const form = document.getElementById('bookForm');
  if (form){
    const success    = document.getElementById('formSuccess');
    const errorBox   = document.getElementById('formError');
    const errorText  = document.getElementById('formErrorText');
    const content    = form.querySelector('.form__content');
    const submitBtn  = form.querySelector('button[type="submit"]');
    const submitOriginalHTML = submitBtn.innerHTML;

    function showSuccess(){
      content.style.display = 'none';
      errorBox.classList.remove('show');
      success.classList.add('show');
      setTimeout(() => {
        form.reset();
        content.style.display = 'block';
        success.classList.remove('show');
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitOriginalHTML;
      }, 8000);
    }

    function showError(msg){
      errorText.innerHTML = msg + ' Или напишите в&nbsp;<a href="https://api.whatsapp.com/send/?phone=79236108440" target="_blank" rel="noopener">WhatsApp</a> / <a href="https://t.me/morodenko" target="_blank" rel="noopener">Telegram</a>.';
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitOriginalHTML;
    }

    function flagInvalid(field){
      field.style.borderColor = 'var(--terracotta)';
      field.style.boxShadow = '0 0 0 4px rgba(184,89,58,.12)';
      setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 2500);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.classList.remove('show');

      const name  = form.querySelector('#fName').value.trim();
      const phone = form.querySelector('#fPhone').value.trim();

      // Local validation: name + phone are required
      let invalid = false;
      if (!name)  { flagInvalid(form.querySelector('#fName'));  invalid = true; }
      if (!phone || phone.replace(/\D/g, '').length < 11) {
        flagInvalid(form.querySelector('#fPhone'));
        invalid = true;
      }
      if (invalid) return;

      // Honeypot: if filled, silently "succeed" — bot trap
      if (form.querySelector('input[name="botcheck"]').checked){
        showSuccess();
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="form__spinner"></span> Отправляю…';

      try {
        const formData = new FormData(form);
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success){
          showSuccess();
        } else {
          // Common Web3Forms errors → user-friendly message
          const msg = (data && data.message) ? data.message : '';
          if (/access[_ ]?key/i.test(msg)){
            showError('Сервис формы временно недоступен.');
            console.error('Web3Forms key error:', msg);
          } else {
            showError('Что-то пошло не так.');
            console.error('Web3Forms error:', data);
          }
        }
      } catch (err){
        showError('Нет связи с сервером.');
        console.error('Network error:', err);
      }
    });

    /* Phone mask */
    const phoneInput = form.querySelector('#fPhone');
    phoneInput.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.startsWith('8')) val = '7' + val.slice(1);
      if (!val.startsWith('7') && val.length > 0) val = '7' + val;
      val = val.slice(0, 11);
      let formatted = '+7';
      if (val.length > 1) formatted += ' (' + val.slice(1, 4);
      if (val.length >= 5) formatted += ') ' + val.slice(4, 7);
      if (val.length >= 8) formatted += '-' + val.slice(7, 9);
      if (val.length >= 10) formatted += '-' + val.slice(9, 11);
      e.target.value = formatted;
    });
  }

  /* ---- Smooth anchor scroll (uses Lenis if available) ---- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target){
        e.preventDefault();
        const offset = 70;
        if (lenis){
          lenis.scrollTo(target, { offset: -offset, duration: 1.4 });
        } else {
          const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  /* ---- Subtle hover tilt for planner cards ---- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches){
    document.querySelectorAll('.planner').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-12px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---- 3D mouse-tracked tilt for certificate cards ---- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches){
    document.querySelectorAll('.cert').forEach(card => {
      let raf;
      card.addEventListener('mousemove', e => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. 0.5
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          // tilt amount: 8deg max
          card.style.setProperty('--tilt-x', `${(-py * 9).toFixed(2)}deg`);
          card.style.setProperty('--tilt-y', `${(px * 9).toFixed(2)}deg`);
          // parallax shift for inner elements
          card.style.setProperty('--shift-x', `${(px * 8).toFixed(2)}px`);
          card.style.setProperty('--shift-y', `${(py * 8).toFixed(2)}px`);
        });
      });
      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--shift-x', '0px');
        card.style.setProperty('--shift-y', '0px');
      });
    });
  }

  /* ============================================== */
  /* ---- 3D AMBIENT SHADER BACKGROUND ---- */
  /*  Single fullscreen quad with slow plasma flow   */
  /*  — GPU-only, ZERO scroll dependency, ~30 fps    */
  /* ============================================== */
  function init3DBackground(){
    if (typeof THREE === 'undefined' || reduceMotion) return;
    const container = document.getElementById('bg3d');
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // fixed pixel ratio = much faster, blur hides aliasing anyway
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uRes;
        varying vec2 vUv;

        // hash + value noise — cheap on mobile
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
        }

        void main(){
          vec2 uv = vUv;
          float aspect = uRes.x / uRes.y;
          vec2 p = uv * vec2(aspect, 1.0) * 1.8;

          float t = uTime * 0.04;
          float n = noise(p + vec2(t, t * 0.6));
          n = mix(n, noise(p * 2.0 - vec2(t * 0.7, t * 0.4)), 0.55);

          // Palette colors (matching site CSS)
          vec3 cTerra = vec3(0.722, 0.349, 0.227);  // #b8593a terracotta
          vec3 cSage  = vec3(0.482, 0.541, 0.435);  // #7b8a6f sage
          vec3 cGold  = vec3(0.784, 0.608, 0.290);  // #c89b4a gold

          vec3 col = mix(cSage, cTerra, smoothstep(0.35, 0.75, n));
          col = mix(col, cGold, smoothstep(0.65, 0.92, n) * 0.4);

          // Soft vignette so corners fade — keeps text in middle clean
          float dist = length(uv - 0.5);
          float vign = smoothstep(0.85, 0.25, dist);

          // Final alpha is intentionally LOW so it never competes with text
          float alpha = vign * 0.18;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let running = true;
    let lastTime = 0;
    const fpsCap = 1000 / 30; // 30 fps is plenty for slow ambient motion
    let startTime = performance.now();

    function loop(now){
      if (!running) return;
      requestAnimationFrame(loop);
      if (now - lastTime < fpsCap) return;
      lastTime = now;
      material.uniforms.uTime.value = (now - startTime) * 0.001;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);

    // Resize — debounced, no per-scroll updates
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      }, 200);
    });

    // Pause when tab hidden — saves battery & CPU
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){ running = false; }
      else if (!running){ running = true; requestAnimationFrame(loop); }
    });
  }
  init3DBackground();

})();
