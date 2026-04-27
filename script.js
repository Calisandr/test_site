/* ============== Морденко Евгения · script.js ============== */

(function(){
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================== */
  /* ---- ANALYTICS HELPER (Yandex.Metrika) ---- */
  /* ============================================== */
  const METRIKA_ID = 99999999; // ← replace with real counter ID in HTML <head> too
  function track(goal, params){
    try {
      if (typeof window.ym === 'function'){
        window.ym(METRIKA_ID, 'reachGoal', goal, params);
      }
    } catch(_) {}
  }

  /* ============================================== */
  /* ---- THEME TOGGLE (light / dark) ---- */
  /* ============================================== */
  const themeToggles = [
    document.getElementById('themeToggle'),
    document.getElementById('themeToggleMobile')
  ].filter(Boolean);

  function getStoredTheme(){
    try { return localStorage.getItem('theme'); } catch(_) { return null; }
  }
  function setTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch(_){}
    track('theme_change', { theme: t });
  }
  themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      // Add transition class temporarily so the swap animates smoothly
      document.documentElement.classList.add('theme-anim');
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
      setTimeout(() => document.documentElement.classList.remove('theme-anim'), 500);
    });
  });
  // Sync with OS theme changes if user hasn't manually picked
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
    if (!getStoredTheme()){
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

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

  /* ---- Scroll progress bar at the very top of the viewport ---- */
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress(){
    if (!scrollProgress) return;
    const h = document.documentElement;
    const scrolled = (h.scrollTop || document.body.scrollTop) /
                     ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight);
    scrollProgress.style.width = (scrolled * 100) + '%';
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
  const testTrack = document.getElementById('testTrack');
  const cards = testTrack && testTrack.children;
  const prev = document.getElementById('testPrev');
  const next = document.getElementById('testNext');
  let index = 0;

  function getVisible(){ return window.innerWidth < 980 ? 1 : 2; }
  function getMaxIndex(){ return Math.max(0, cards.length - getVisible()); }

  function update(){
    if (!cards || !cards[0]) return;
    const trackStyle = window.getComputedStyle(testTrack);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 28;
    const cardWidth = cards[0].getBoundingClientRect().width + gap;
    testTrack.style.transform = `translateX(${-index * cardWidth}px)`;
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
    testTrack.addEventListener('mouseenter', stopAuto);
    testTrack.addEventListener('mouseleave', startAuto);
    testTrack.addEventListener('touchstart', stopAuto, { passive: true });
  }

  /* ---- FAQ + Guide details exclusive open (optional) ---- */
  // No exclusivity — let users open multiple

  /* ---- Custom selects: keeps cursor/arrow behavior fully under site CSS ---- */
  function closeCustomSelects(except){
    document.querySelectorAll('.custom-select.is-open').forEach(widget => {
      if (widget === except) return;
      widget.classList.remove('is-open');
      widget.querySelector('.custom-select__button')?.setAttribute('aria-expanded', 'false');
    });
  }

  function initCustomSelect(select){
    if (!select || select.dataset.customSelectReady) return;
    select.dataset.customSelectReady = 'true';
    select.classList.add('native-select');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const options = Array.from(select.options);
    if (!options.length) return;

    const widget = document.createElement('div');
    widget.className = 'custom-select';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-select__button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');

    const value = document.createElement('span');
    value.className = 'custom-select__value';
    button.appendChild(value);

    const list = document.createElement('div');
    list.className = 'custom-select__list';
    list.setAttribute('role', 'listbox');

    const baseId = select.id || select.name || `select-${Math.random().toString(36).slice(2)}`;
    button.id = `${baseId}-custom-button`;
    list.id = `${baseId}-custom-list`;
    button.setAttribute('aria-controls', list.id);

    options.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'custom-select__option';
      item.setAttribute('role', 'option');
      item.dataset.index = String(index);
      item.textContent = option.textContent;
      item.addEventListener('mousemove', () => setActive(index, false));
      item.addEventListener('click', () => {
        choose(index, true);
        close();
        button.focus({ preventScroll: true });
      });
      list.appendChild(item);
    });

    const items = Array.from(list.children);
    let activeIndex = Math.max(0, select.selectedIndex);

    function sync(){
      const selectedIndex = Math.max(0, select.selectedIndex);
      const selected = options[selectedIndex];
      value.textContent = selected?.textContent || '';
      items.forEach((item, index) => {
        const isSelected = index === selectedIndex;
        item.classList.toggle('is-selected', isSelected);
        item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
      setActive(selectedIndex, false);
    }

    function setActive(index, scroll = true){
      activeIndex = Math.max(0, Math.min(items.length - 1, index));
      items.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === activeIndex);
      });
      if (scroll && widget.classList.contains('is-open')){
        items[activeIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }

    function choose(index, emitChange){
      select.selectedIndex = index;
      sync();
      if (emitChange){
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    function open(){
      closeCustomSelects(widget);
      widget.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      setActive(Math.max(0, select.selectedIndex));
    }

    function close(){
      widget.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }

    function toggle(){
      widget.classList.contains('is-open') ? close() : open();
    }

    button.addEventListener('click', toggle);
    button.addEventListener('keydown', event => {
      const isOpen = widget.classList.contains('is-open');
      if (event.key === 'ArrowDown'){
        event.preventDefault();
        if (!isOpen) open();
        else setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp'){
        event.preventDefault();
        if (!isOpen) open();
        else setActive(activeIndex - 1);
      } else if (event.key === 'Home'){
        event.preventDefault();
        if (!isOpen) open();
        setActive(0);
      } else if (event.key === 'End'){
        event.preventDefault();
        if (!isOpen) open();
        setActive(items.length - 1);
      } else if (event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        if (isOpen){
          choose(activeIndex, true);
          close();
        } else {
          open();
        }
      } else if (event.key === 'Escape'){
        close();
      }
    });

    document.addEventListener('click', event => {
      if (!widget.contains(event.target)) close();
    });

    const field = select.closest('.field');
    const label = field?.querySelector(`label[for="${select.id}"]`);
    label?.addEventListener('click', event => {
      event.preventDefault();
      button.focus({ preventScroll: true });
      open();
    });

    select.addEventListener('change', sync);
    select.after(widget);
    widget.append(button, list);
    sync();
  }

  document.querySelectorAll('.field select').forEach(initCustomSelect);
  document.querySelectorAll('form').forEach(formEl => {
    formEl.addEventListener('reset', () => {
      setTimeout(() => {
        formEl.querySelectorAll('select.native-select').forEach(select => {
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }, 0);
    });
  });

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

      // Collect form data into a plain object
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/send-lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success){
          showSuccess();
        } else if (response.status === 429){
          showError('Слишком много заявок подряд.');
        } else if (response.status === 400){
          showError(data.error || 'Проверьте, что имя и телефон указаны.');
        } else {
          showError('На стороне сервера сбой.');
          console.error('Server error:', response.status, data);
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

  /* ============================================== */
  /* ---- PACKAGE CALCULATOR ---- */
  /* ============================================== */
  (function initCalculator(){
    const slider     = document.getElementById('calcSlider');
    const countEl    = document.getElementById('calcCount');
    const baseEl     = document.getElementById('calcBase');
    const finalEl    = document.getElementById('calcFinal');
    const saveEl     = document.getElementById('calcSave');
    const ctaCount   = document.getElementById('calcCtaCount');
    if (!slider) return;

    const PRICE_PER_SESSION = 5000;

    function pluralSessions(n){
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return 'встреча';
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'встречи';
      return 'встреч';
    }
    function fmt(n){ return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; }

    function calculate(n){
      // Pricing tiers based on real b17 packages:
      //  1–4    → no discount (single sessions)
      //  5–9    → 22 000 ₽ for 5 → 4400/sess
      //  10+    → 40 000 ₽ for 10 → 4000/sess
      const base = n * PRICE_PER_SESSION;
      let finalPrice;
      if (n <= 4)        finalPrice = base;
      else if (n < 10)   finalPrice = 22000 + (n - 5) * 4400;        // extrapolate from 5-pack rate
      else               finalPrice = Math.round(40000 + (n - 10) * 4000); // extrapolate from 10-pack rate

      const saved = base - finalPrice;
      const pct   = base > 0 ? Math.round(saved / base * 100) : 0;
      return { base, finalPrice, saved, pct };
    }

    function render(){
      const n = parseInt(slider.value, 10);
      const { base, finalPrice, saved, pct } = calculate(n);

      countEl.textContent = `${n} ${pluralSessions(n)}`;
      baseEl.textContent  = fmt(base);
      finalEl.textContent = fmt(finalPrice);
      ctaCount.textContent = n;
      // Plural fix in CTA text wrapper
      ctaCount.parentNode.childNodes.forEach(node => {
        if (node.nodeType === 3 && node.textContent.includes('встреч')){
          node.textContent = ` ${pluralSessions(n)}  `;
        }
      });

      if (saved > 0){
        saveEl.innerHTML = `${fmt(saved)} <small>(${pct}%)</small>`;
        saveEl.parentElement.style.display = '';
      } else {
        saveEl.parentElement.style.display = 'none';
      }

      // Visual fill on the slider track
      const p = ((n - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.setProperty('--p', p + '%');
    }

    slider.addEventListener('input', render);
    slider.addEventListener('change', () => track('calc_used', { sessions: parseInt(slider.value, 10) }));
    render();
  })();

  /* ============================================== */
  /* ---- ANALYTICS EVENT TRACKING ---- */
  /* ============================================== */
  // CTA / messenger clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    if (/wa\.me|api\.whatsapp\.com/.test(href))             track('click_whatsapp');
    else if (/^https?:\/\/t\.me/.test(href))                track('click_telegram');
    else if (/vk\.com/.test(href))                          track('click_vk');
    else if (/instagram\.com/.test(href))                   track('click_instagram');
    else if (/^tel:/.test(href))                            track('click_phone');
    else if (/^mailto:/.test(href))                         track('click_email');
    else if (link.dataset.track)                            track(link.dataset.track);
  }, { passive: true });

  // Form submission success → goal "lead_submitted"
  // (Wrap into the existing success handler)
  const _origForm = document.getElementById('bookForm');
  if (_origForm){
    _origForm.addEventListener('submit', () => {
      // Will fire even if validation fails; refine inside form code if needed
      setTimeout(() => {
        if (document.getElementById('formSuccess')?.classList.contains('show')){
          track('lead_submitted');
        }
      }, 100);
    });
  }

  // Section view tracking — fire once per section when 50%+ visible
  const sectionGoals = {
    'about':       'view_about',
    'issues':      'view_issues',
    'credentials': 'view_credentials',
    'planners':    'view_planners',
    'guide':       'view_guide',
    'services':    'view_services',
    'contact':     'view_contact'
  };
  if ('IntersectionObserver' in window){
    const seen = new Set();
    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && !seen.has(en.target.id)){
          seen.add(en.target.id);
          const goal = sectionGoals[en.target.id];
          if (goal) track(goal);
        }
      });
    }, { threshold: 0.5 });
    Object.keys(sectionGoals).forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionIO.observe(el);
    });
  }

  // Scroll-depth: fires once when user reaches bottom of page
  let scrollEnd = false;
  window.addEventListener('scroll', () => {
    if (scrollEnd) return;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100){
      scrollEnd = true;
      track('scroll_to_end');
    }
  }, { passive: true });

})();
