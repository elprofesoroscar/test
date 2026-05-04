(() => {
  'use strict';

  const RAZONES = [
    { icon:'fa-solid fa-chart-line',  title:'Resultados desde la primera clase', desc:'No esperes semanas. Notarás el progreso desde el primer día.' },
    { icon:'fa-solid fa-brain',       title:'Diagnóstico constante',              desc:'Identifico tus fortalezas y debilidades para enfocarnos en lo que importa.' },
    { icon:'fa-solid fa-heart',       title:'Trato personalizado y cercano',      desc:'Pregunta una y otra vez. Me encanta explicar hasta que lo entiendas.' },
    { icon:'fa-solid fa-calendar-check', title:'Horario flexible',               desc:'Tardes entre semana y mañanas/tardes de fin de semana.' },
    { icon:'fa-solid fa-puzzle-piece',title:'Método práctico',                   desc:'Enfocado en resolución de problemas y razonamiento lógico.' },
    { icon:'fa-solid fa-trophy',      title:'15+ años de experiencia',            desc:'Alto rendimiento demostrado con cientos de alumnos.' },
    { icon:'fa-solid fa-graduation-cap', title:'Preparación intensiva',           desc:'Especialista en exámenes y comprensión lógica.' },
    { icon:'fa-solid fa-magic',       title:'Polivalente',                        desc:'Descifro cualquier asignatura, incluso si no la conozco bien.' },
    { icon:'fa-solid fa-square-root-variable', title:'Aprendizaje lógico',       desc:'Explico desde la lógica. El alumno razona y demuestra por sí mismo, sin agobios.' }
  ];

  const TESTIMONIOS = [
    { texto:"Oscar no solo explica, entiende cómo pienso y anticipa mis dudas. Gracias a él he pasado de suspender matemáticas a sacar notables. Su método basado en la lógica me ha ayudado a razonar por mí misma.", autor:"María Gómez · 2º Bachillerato" },
    { texto:"Clarísimo, cercano y muy profesional. 100% recomendable. Llegué con un nivel muy bajo en física y en dos meses recuperé todo. Se preocupa por que entiendas el 'por qué' de las cosas, no solo la fórmula.", autor:"Carlos Rodríguez · Universidad (Ingeniería)" },
    { texto:"Gracias a Oscar entendí por fin las matemáticas. Tenía pánico a los exámenes y ahora afronto las pruebas con seguridad. Explica paso a paso, con paciencia infinita.", autor:"Laura Martínez · 4º ESO" },
    { texto:"Mi hijo tenía muchas dificultades con química y física. Oscar no solo le ha ayudado a aprobar, sino que ahora le gustan las ciencias. Como padre, valoro muchísimo su trato cercano.", autor:"Javier Sánchez · padre de alumno de 1º Bachillerato" },
    { texto:"Necesitaba preparar el examen de acceso a grado superior y con Oscar lo conseguí a la primera. Sus clases son dinámicas, con ejemplos prácticos y siempre adaptadas a mi ritmo.", autor:"Ana Belén Torres · acceso a FP Superior" },
    { texto:"Soy estudiante de arquitectura y las asignaturas de cálculo y física se me atragantaban. Oscar tiene una capacidad increíble para simplificar lo complejo. Un profesor excepcional.", autor:"David Ruiz · Universidad (Arquitectura)" }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    initStarfield();
    initSpine3D();
    initTilt();
    initReveal();
    renderPrezi();
    renderTestimonios();
    initNav();
    if (typeof window.initAgenda === 'function') window.initAgenda();
  });

  // ── STARFIELD ──────────────────────────────────────────
  function initStarfield() {
    const c = document.getElementById('bg-stars'); if (!c) return;
    const ctx = c.getContext('2d');
    let stars = [], W = 0, H = 0;
    const COUNT = window.innerWidth < 768 ? 80 : 160;

    function resize() {
      W = c.width = window.innerWidth * devicePixelRatio;
      H = c.height = window.innerHeight * devicePixelRatio;
      c.style.width = '100%'; c.style.height = '100%';
      stars = Array.from({ length: COUNT }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.5 * devicePixelRatio,
        s: .05 + Math.random() * .25,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < .15 ? 'gold' : (Math.random() < .5 ? 'cyan' : 'white')
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.tw += .03;
        const a = .35 + .65 * Math.abs(Math.sin(s.tw));
        const fill = s.hue === 'gold'
          ? `rgba(240,205,131,${a})`
          : s.hue === 'cyan'
            ? `rgba(122,215,255,${a * .85})`
            : `rgba(244,238,219,${a * .7})`;
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        s.y += s.s;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    resize(); tick();
  }

  // ── ESPINA DORSAL 3D (Three.js) ───────────────────────
  function initSpine3D() {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('spine-canvas'); if (!canvas) return;
    if (window.matchMedia('(max-width:880px)').matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const W = () => canvas.clientWidth, H = () => canvas.clientHeight;
    renderer.setSize(W(), H(), false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W() / H(), .1, 100);
    camera.position.set(0, 0, 8);

    const spine = new THREE.Group();
    scene.add(spine);

    const N = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const palette = [
      new THREE.Color(0xf0cd83),
      new THREE.Color(0x7ad7ff),
      new THREE.Color(0x9b7cff)
    ];

    for (let i = 0; i < N; i++) {
      const t = i / N * Math.PI * 8;
      const y = (i / N - .5) * 14;
      const r = 1.4;
      positions[i * 3] = Math.cos(t) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(t) * r;
      const col = palette[i % 3];
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const dotTex = makeDotTexture();
    const mat = new THREE.PointsMaterial({
      size: .28, vertexColors: true, transparent: true, opacity: .95,
      map: dotTex, alphaTest: .01, depthWrite: false, blending: THREE.AdditiveBlending
    });

    spine.add(new THREE.Points(geo, mat));

    // segunda hélice
    const geo2 = geo.clone();
    const pos2 = geo2.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const t = i / N * Math.PI * 8 + Math.PI;
      const y = (i / N - .5) * 14;
      pos2[i * 3] = Math.cos(t) * 1.4;
      pos2[i * 3 + 1] = y;
      pos2[i * 3 + 2] = Math.sin(t) * 1.4;
    }
    spine.add(new THREE.Points(geo2, mat));

    // travesaños
    const lineMat = new THREE.LineBasicMaterial({ color: 0xd4ad5e, transparent: true, opacity: .18 });
    const linesGeo = new THREE.BufferGeometry();
    const lpos = [];
    for (let i = 0; i < N; i += 4) {
      lpos.push(positions[i*3], positions[i*3+1], positions[i*3+2],
                pos2[i*3],     pos2[i*3+1],     pos2[i*3+2]);
    }
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3));
    spine.add(new THREE.LineSegments(linesGeo, lineMat));

    window.addEventListener('resize', () => {
      renderer.setSize(W(), H(), false);
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
    });

    let targetRot = 0, currentRot = 0;
    window.addEventListener('scroll', () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      targetRot = (window.scrollY / max) * Math.PI * 4;
    }, { passive: true });

    function tick() {
      currentRot += (targetRot - currentRot) * .07;
      spine.rotation.y = currentRot;
      spine.rotation.x = Math.sin(currentRot * .3) * .15;
      spine.position.y = -targetRot * .15;
      const t = performance.now() * .0002;
      spine.position.x = Math.sin(t) * .3 + 1.2;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  function makeDotTexture() {
    const s = 64; const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const cx = cv.getContext('2d');
    const g = cx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.4, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  // ── TILT HERO ─────────────────────────────────────────
  function initTilt() {
    const stage = document.querySelector('[data-tilt]'); if (!stage) return;
    if (window.matchMedia('(hover:none)').matches) return;
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

    function onMove(e) {
      const r = stage.getBoundingClientRect();
      tx = -((e.clientY - r.top) / r.height - .5) * 12;
      ty =  ((e.clientX - r.left) / r.width - .5) * 16;
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function apply() {
      cx += (tx - cx) * .12; cy += (ty - cy) * .12;
      stage.style.transform = `rotateX(${cx}deg) rotateY(${cy}deg)`;
      if (Math.abs(tx - cx) > .01 || Math.abs(ty - cy) > .01) {
        raf = requestAnimationFrame(apply);
      } else raf = null;
    }
    function reset() { tx = ty = 0; if (!raf) raf = requestAnimationFrame(apply); }
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', reset);
  }

  // ── REVEAL ON SCROLL ──────────────────────────────────
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = (i % 6) * 60 + 'ms'; io.observe(el); });
  }

  // ── PREZI CARDS ───────────────────────────────────────
  function renderPrezi() {
    const grid = document.getElementById('preziGrid'); if (!grid) return;
    const frag = document.createDocumentFragment();
    RAZONES.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'prezi-card reveal';
      card.innerHTML = `
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <div class="ico"><i class="${r.icon}" aria-hidden="true"></i></div>
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  // ── TESTIMONIOS 3D STACK ──────────────────────────────
  function renderTestimonios() {
    const stage = document.getElementById('testiStage');
    const dotsEl = document.getElementById('testiDots');
    const prev = document.getElementById('testiPrev');
    const next = document.getElementById('testiNext');
    if (!stage) return;

    let idx = 0, timer;
    const cards = [];

    TESTIMONIOS.forEach(t => {
      const card = document.createElement('article');
      card.className = 'testi-card';
      card.innerHTML = `<span class="quote-mark">"</span><p>${t.texto}</p><span class="autor">— ${t.autor}</span>`;
      stage.appendChild(card);
      cards.push(card);
    });

    TESTIMONIOS.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'testi-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Testimonio ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsEl.appendChild(d);
    });

    function update() {
      cards.forEach((c, i) => {
        const offset = i - idx;
        const abs = Math.abs(offset);
        let tx = 0, tz = 0, ry = 0, op = 1, sc = 1;
        if (offset === 0) {
          c.style.zIndex = 10;
        } else if (abs === 1 || (offset === cards.length - 1 && idx === 0) || (offset === -(cards.length - 1) && idx === cards.length - 1)) {
          tx = offset > 0 ? 72 : -72; tz = -180; ry = offset > 0 ? -18 : 18; op = .55; sc = .9; c.style.zIndex = 5;
        } else {
          tx = offset > 0 ? 160 : -160; tz = -360; op = 0; sc = .8; ry = offset > 0 ? -25 : 25; c.style.zIndex = 1;
        }
        c.style.transform = `translateX(${tx}%) translateZ(${tz}px) rotateY(${ry}deg) scale(${sc})`;
        c.style.opacity = op;
        c.style.pointerEvents = abs === 0 ? 'auto' : 'none';
      });
      [...dotsEl.children].forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    function go(i) { idx = (i + cards.length) % cards.length; update(); restart(); }
    function restart() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 6500); }

    prev.addEventListener('click', () => go(idx - 1));
    next.addEventListener('click', () => go(idx + 1));
    stage.addEventListener('mouseenter', () => clearInterval(timer));
    stage.addEventListener('mouseleave', restart);
    update(); restart();
  }

  // ── NAV ───────────────────────────────────────────────
  function initNav() {
    const nav = document.getElementById('siteNav');
    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelectorAll('.nav-links a');

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.forEach(a => a.addEventListener('click', () => {
      if (window.matchMedia('(max-width:920px)').matches) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }));

    document.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    nav.addEventListener('click', e => e.stopPropagation());

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (typeof closeModalSlotLibre === 'function') closeModalSlotLibre();
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // cerrar modal al hacer click fuera
  window.addEventListener('click', e => {
    const m = document.getElementById('modalSlotLibre');
    if (m && e.target === m && typeof closeModalSlotLibre === 'function') closeModalSlotLibre();
  });

})();
