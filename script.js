// ===== VARIABLES GLOBALES =====
let currentSlide = 0;
let autoSlideInterval;

let currentTestimonioSlide = 0;
let autoTestimonioInterval;

// ===== DATOS PARA EL CARRUSEL DE RAZONES =====
const razones = [
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Resultados desde la primera clase',
    desc: 'No esperes semanas. Notarás el progreso desde el primer día.'
  },
  {
    icon: 'fa-solid fa-brain',
    title: 'Diagnóstico constante',
    desc: 'Identifico tus fortalezas y debilidades para enfocarnos en lo que realmente importa.'
  },
  {
    icon: 'fa-solid fa-heart',
    title: 'Trato personalizado y cercano',
    desc: 'Pregunta una y otra vez. Me encanta explicar hasta que lo entiendas.'
  },
  {
    icon: 'fa-solid fa-calendar-check',
    title: 'Horario flexible',
    desc: 'Tardes entre semana y mañanas/tardes de fin de semana.'
  },
  {
    icon: 'fa-solid fa-puzzle-piece',
    title: 'Método práctico',
    desc: 'Enfocado en resolución de problemas y razonamiento lógico.'
  },
  {
    icon: 'fa-solid fa-trophy',
    title: '15+ años de experiencia',
    desc: 'Alto rendimiento demostrado con cientos de alumnos.'
  },
  {
    icon: 'fa-solid fa-graduation-cap',
    title: 'Preparación intensiva',
    desc: 'Especialista en exámenes y comprensión lógica.'
  },
  {
    icon: 'fa-solid fa-magic',
    title: 'Polivalente',
    desc: 'Descifro cualquier asignatura, incluso si no la conozco bien.'
  },
  {
    icon: 'fa-solid fa-square-root-variable',
    title: 'Aprendizaje lógico, no memorístico',
    desc: 'Explico usando la lógica. El alumno aprende a razonar y demostrar por sí mismo, sin agobios.'
  }
];

// ===== DATOS PARA EL CARRUSEL DE TESTIMONIOS =====
const testimonios = [
  {
    texto: "Oscar no solo explica, entiende cómo pienso y anticipa mis dudas. Siempre encuentra la forma de hacer que entienda los conceptos más difíciles. Gracias a él he pasado de suspender matemáticas a sacar notables. Su método de enseñanza basado en la lógica me ha ayudado a razonar por mí misma.",
    autor: "María Gómez, 2º Bachillerato"
  },
  {
    texto: "Clarísimo, cercano y muy profesional. 100% recomendable. Llegué con un nivel muy bajo en física y en dos meses recuperé todo. Lo que más valoro es que se preocupa por que entiendas el 'por qué' de las cosas, no solo la fórmula. Mis notas han mejorado muchísimo.",
    autor: "Carlos Rodríguez, Universidad (Ingeniería)"
  },
  {
    texto: "Gracias a Oscar entendí por fin las matemáticas. Su método es increíble. Tenía pánico a los exámenes y ahora afronto las pruebas con seguridad. Explica paso a paso, con paciencia infinita, y siempre está disponible para resolver dudas fuera de clase.",
    autor: "Laura Martínez, 4º ESO"
  },
  {
    texto: "Mi hijo tenía muchas dificultades con química y física. Oscar no solo le ha ayudado a aprobar, sino que ahora le gustan las ciencias. Como padre, valoro muchísimo su trato cercano y la forma en que motiva a los alumnos. Totalmente recomendable.",
    autor: "Javier Sánchez, padre de alumno de 1º Bachillerato"
  },
  {
    texto: "Necesitaba preparar el examen de acceso a grado superior y con Oscar lo conseguí a la primera. Sus clases son muy dinámicas, con ejemplos prácticos y siempre adaptadas a mi ritmo. Me enviaba ejercicios personalizados y los corregíamos juntos. Un 10.",
    autor: "Ana Belén Torres, acceso a FP Superior"
  },
  {
    texto: "Soy estudiante de arquitectura y las asignaturas de cálculo y física se me atragantaban. Oscar tiene una capacidad increíble para simplificar lo complejo. Sus explicaciones lógicas hacen que todo tenga sentido. Además, siempre se adapta a mis horarios. Un profesor excepcional.",
    autor: "David Ruiz, Universidad (Arquitectura)"
  }
];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  cargarCarrusel();
  cargarTestimonios();
  iniciarAutoSlide();
  iniciarAutoTestimonios();
  configurarObservadoresHover();
  configurarNavegacion();
  if (typeof initAgenda === 'function') initAgenda();
});

function configurarNavegacion() {
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!nav || !toggle || !links) return;

  function setMenuOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    setMenuOpen(!nav.classList.contains('is-open'));
  });

  links.querySelectorAll('a').forEach(function(anchor) {
    anchor.addEventListener('click', function() {
      if (window.matchMedia('(max-width: 960px)').matches) {
        setMenuOpen(false);
      }
    });
  });

  document.addEventListener('click', function() {
    if (nav.classList.contains('is-open')) {
      setMenuOpen(false);
    }
  });

  nav.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

function slideStep(track) {
  if (!track || !track.children.length) return 300;
  const first = track.children[0];
  const gap = parseFloat(getComputedStyle(track).gap) || 20;
  return first.offsetWidth + gap;
}

function syncCarruselDotsFromScroll() {
  const track = document.getElementById('carruselTrack');
  if (!track || !track.children.length) return;
  const step = slideStep(track);
  const idx = Math.round(track.scrollLeft / step);
  currentSlide = Math.min(Math.max(idx, 0), razones.length - 1);
  actualizarDots();
}

function syncTestimoniosDotsFromScroll() {
  const track = document.getElementById('testimoniosTrack');
  if (!track || !track.children.length) return;
  const step = slideStep(track);
  const idx = Math.round(track.scrollLeft / step);
  currentTestimonioSlide = Math.min(Math.max(idx, 0), testimonios.length - 1);
  actualizarDotsTestimonios();
}

function configurarObservadoresHover() {
  const carruselTrack = document.getElementById('carruselTrack');
  const carruselWrap = document.querySelector('.carrusel-container');
  const testimoniosTrack = document.getElementById('testimoniosTrack');
  const testimoniosWrap = document.querySelector('.testimonios-carrusel-container');

  let carruselScrollPending = false;
  let testimoniosScrollPending = false;

  if (carruselTrack && carruselWrap) {
    carruselWrap.addEventListener('mouseenter', detenerAutoSlide);
    carruselWrap.addEventListener('mouseleave', reanudarAutoSlide);
    carruselWrap.addEventListener('focusin', detenerAutoSlide);
    carruselWrap.addEventListener('focusout', function(e) {
      if (!carruselWrap.contains(e.relatedTarget)) reanudarAutoSlide();
    });
    carruselTrack.addEventListener('scroll', function() {
      if (carruselScrollPending) return;
      carruselScrollPending = true;
      requestAnimationFrame(function() {
        carruselScrollPending = false;
        syncCarruselDotsFromScroll();
      });
    }, { passive: true });
  }

  if (testimoniosTrack && testimoniosWrap) {
    testimoniosWrap.addEventListener('mouseenter', detenerAutoTestimonios);
    testimoniosWrap.addEventListener('mouseleave', reanudarAutoTestimonios);
    testimoniosWrap.addEventListener('focusin', detenerAutoTestimonios);
    testimoniosWrap.addEventListener('focusout', function(e) {
      if (!testimoniosWrap.contains(e.relatedTarget)) reanudarAutoTestimonios();
    });
    testimoniosTrack.addEventListener('scroll', function() {
      if (testimoniosScrollPending) return;
      testimoniosScrollPending = true;
      requestAnimationFrame(function() {
        testimoniosScrollPending = false;
        syncTestimoniosDotsFromScroll();
      });
    }, { passive: true });
  }
}

// ===== FUNCIONES DEL CARRUSEL PRINCIPAL =====
function cargarCarrusel() {
  const track = document.getElementById('carruselTrack');
  const dotsContainer = document.getElementById('carruselDots');
  
  track.innerHTML = '';
  dotsContainer.innerHTML = '';
  
  razones.forEach((razon, index) => {
    const card = document.createElement('div');
    card.className = 'carrusel-card';
    card.innerHTML = `
      <i class="${razon.icon}"></i>
      <h3>${razon.title}</h3>
      <p>${razon.desc}</p>
    `;
    track.appendChild(card);
    
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.onclick = () => irASlide(index);
    dotsContainer.appendChild(dot);
  });
  
  actualizarDots();
}

function moverCarrusel(direccion) {
  const track = document.getElementById('carruselTrack');
  if (!track || !track.children.length) return;
  const scrollAmount = slideStep(track);

  track.scrollBy({
    left: direccion * scrollAmount,
    behavior: 'smooth'
  });

  currentSlide = Math.min(Math.max(currentSlide + direccion, 0), razones.length - 1);
  actualizarDots();
}

function irASlide(index) {
  const track = document.getElementById('carruselTrack');
  if (!track || !track.children.length) return;
  const step = slideStep(track);

  track.scrollTo({
    left: index * step,
    behavior: 'smooth'
  });

  currentSlide = index;
  actualizarDots();
}

function actualizarDots() {
  const dots = document.querySelectorAll('.carrusel-dots .dot');
  dots.forEach((dot, index) => {
    if (index === currentSlide) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function iniciarAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(() => {
    const track = document.getElementById('carruselTrack');
    const maxScroll = track.scrollWidth - track.clientWidth;
    
    if (track.scrollLeft >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
      currentSlide = 0;
    } else {
      moverCarrusel(1);
    }
    actualizarDots();
  }, 4000);
}

window.addEventListener('resize', function() {
  syncCarruselDotsFromScroll();
  syncTestimoniosDotsFromScroll();
});

function detenerAutoSlide() {
  clearInterval(autoSlideInterval);
}

function reanudarAutoSlide() {
  iniciarAutoSlide();
}

// ===== FUNCIONES DEL CARRUSEL DE TESTIMONIOS =====
function cargarTestimonios() {
  const track = document.getElementById('testimoniosTrack');
  const dotsContainer = document.getElementById('testimoniosDots');
  
  if (!track) {
    console.error("No se encontró el track de testimonios");
    return;
  }
  if (!dotsContainer) {
    console.error("No se encontró el contenedor de dots");
    return;
  }
  
  track.innerHTML = '';
  dotsContainer.innerHTML = '';
  
  testimonios.forEach((testimonio, index) => {
    const card = document.createElement('div');
    card.className = 'testimonio-card';
    card.innerHTML = `
      <i class="fas fa-quote-left"></i>
      <p>"${testimonio.texto}"</p>
      <span class="testimonio-autor">— ${testimonio.autor}</span>
    `;
    track.appendChild(card);
    
    const dot = document.createElement('span');
    dot.className = 'testimonio-dot'; // Clase DIFERENTE para evitar conflictos
    dot.onclick = () => irATestimonio(index);
    dotsContainer.appendChild(dot);
  });
  
  actualizarDotsTestimonios();
}

function moverTestimonios(direccion) {
  const track = document.getElementById('testimoniosTrack');
  if (!track || track.children.length === 0) return;

  const scrollAmount = slideStep(track);

  track.scrollBy({
    left: direccion * scrollAmount,
    behavior: 'smooth'
  });

  currentTestimonioSlide = Math.min(Math.max(currentTestimonioSlide + direccion, 0), testimonios.length - 1);
  actualizarDotsTestimonios();
}

function irATestimonio(index) {
  const track = document.getElementById('testimoniosTrack');
  if (!track || track.children.length === 0) return;

  const step = slideStep(track);

  track.scrollTo({
    left: index * step,
    behavior: 'smooth'
  });

  currentTestimonioSlide = index;
  actualizarDotsTestimonios();
}

function actualizarDotsTestimonios() {
  const dots = document.querySelectorAll('.testimonio-dot'); // Clase específica
  dots.forEach((dot, index) => {
    if (index === currentTestimonioSlide) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function iniciarAutoTestimonios() {
  if (autoTestimonioInterval) clearInterval(autoTestimonioInterval);
  
  autoTestimonioInterval = setInterval(() => {
    const track = document.getElementById('testimoniosTrack');
    if (!track || track.children.length === 0) return;
    
    const maxScroll = track.scrollWidth - track.clientWidth;
    
    if (track.scrollLeft >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
      currentTestimonioSlide = 0;
    } else {
      moverTestimonios(1);
    }
    actualizarDotsTestimonios();
  }, 5000);
}

function detenerAutoTestimonios() {
  clearInterval(autoTestimonioInterval);
}

function reanudarAutoTestimonios() {
  iniciarAutoTestimonios();
}
// ===== FUNCIONES DEL MODAL PRINCIPAL (clases) =====
function openModal() {
  document.getElementById('modal').style.display = 'block';
  document.getElementById('modalName').value = '';
  document.getElementById('modalLevel').value = '';
  document.getElementById('modalSubject').value = '';
  document.getElementById('modalProfile').value = '';
  document.getElementById('modalSchedule').value = '';
}

function openModalWithData(nivel) {
  document.getElementById('modal').style.display = 'block';
  document.getElementById('modalLevel').value = nivel;
  document.getElementById('modalName').value = '';
  document.getElementById('modalSubject').value = '';
  document.getElementById('modalProfile').value = '';
  document.getElementById('modalSchedule').value = '';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function sendWhatsApp() {
  const name = document.getElementById('modalName').value;
  const level = document.getElementById('modalLevel').value;
  const subject = document.getElementById('modalSubject').value;
  const profile = document.getElementById('modalProfile').value;
  const schedule = document.getElementById('modalSchedule').value;
  
  if (!name || !level || !subject || !schedule) {
    alert('Por favor, completa todos los campos obligatorios (Nombre, Nivel, Asignatura y Horario)');
    return;
  }
  
  const phone = '34644719635';
  const message = `Hola Oscar, soy ${name}.

📚 Nivel académico: ${level}
📖 Asignatura(s): ${subject}
📊 Perfil del alumno: ${profile || 'No especificado'}
⏰ Disponibilidad: ${schedule}

Quedo a la espera de tu respuesta. ¡Gracias!`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  closeModal();
}

// ===== FUNCIONES PARA MODAL DE TÉRMINOS =====
function openTerminos() {
  document.getElementById('modalTerminos').style.display = 'block';
}

function closeTerminos() {
  document.getElementById('modalTerminos').style.display = 'none';
}

// ===== FUNCIONES PARA MODAL DE EQUIPO =====
function openModalEquipo() {
  document.getElementById('modalEquipo').style.display = 'block';
  document.getElementById('equipoNombre').value = '';
  document.getElementById('equipoFormacion').value = '';
  document.getElementById('equipoExperiencia').value = '';
  document.getElementById('equipoDisponibilidad').value = '';
}

function closeModalEquipo() {
  document.getElementById('modalEquipo').style.display = 'none';
}

function sendWhatsAppEquipo() {
  const nombre = document.getElementById('equipoNombre').value;
  const formacion = document.getElementById('equipoFormacion').value;
  const experiencia = document.getElementById('equipoExperiencia').value;
  const disponibilidad = document.getElementById('equipoDisponibilidad').value;
  
  if (!nombre || !formacion || !disponibilidad) {
    alert('Por favor, completa los campos obligatorios (Nombre, Formación y Disponibilidad)');
    return;
  }
  
  const phone = '34644719635';
  const message = `Hola Oscar, me interesa formar parte de tu equipo docente.

👤 Nombre: ${nombre}
🎓 Formación: ${formacion}
📝 Experiencia: ${experiencia || 'No especificada'}
⏰ Disponibilidad: ${disponibilidad}

Quedo a la espera de tu respuesta.`;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  closeModalEquipo();
}

// ===== FUNCIONES PARA MODAL DE QUEJAS =====
function openModalQuejas() {
  document.getElementById('modalQuejas').style.display = 'block';
  document.getElementById('quejasNombre').value = '';
  document.getElementById('quejasMensaje').value = '';
}

function closeModalQuejas() {
  document.getElementById('modalQuejas').style.display = 'none';
}

function sendWhatsAppQuejas() {
  const nombre = document.getElementById('quejasNombre').value;
  const mensaje = document.getElementById('quejasMensaje').value;
  
  if (!mensaje) {
    alert('Por favor, escribe tu queja o sugerencia');
    return;
  }
  
  const phone = '34644719635';
  const nombreTexto = nombre ? `Nombre: ${nombre}` : 'Anónimo';
  
  const message = `📢 QUEJA O SUGERENCIA

${nombreTexto}

Mensaje: ${mensaje}`;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  closeModalQuejas();
}

// ===== FUNCIONES PARA ENLACES PEQUEÑOS =====
function openTrabajaConmigo() {
  const phone = '34644719635';
  const message = `Hola Oscar, me interesa formar parte de tu equipo docente.

Mi formación: 
Mi experiencia: 
Disponibilidad: `;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function openFAQ() {
  const faqSection = document.querySelector('.faq-section');
  if (faqSection) {
    faqSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// ===== CERRAR MODALES AL HACER CLICK FUERA =====
window.onclick = function(event) {
  const modal = document.getElementById('modal');
  const modalTerminos = document.getElementById('modalTerminos');
  const modalEquipo = document.getElementById('modalEquipo');
  const modalQuejas = document.getElementById('modalQuejas');
  const modalSlotLibre = document.getElementById('modalSlotLibre');

  if (event.target === modal) closeModal();
  if (event.target === modalTerminos) closeTerminos();
  if (event.target === modalEquipo) closeModalEquipo();
  if (event.target === modalQuejas) closeModalQuejas();
  if (event.target === modalSlotLibre && typeof closeModalSlotLibre === 'function') closeModalSlotLibre();
}

// ===== CERRAR MODALES CON TECLA ESC =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeTerminos();
    closeModalEquipo();
    closeModalQuejas();
    if (typeof closeModalSlotLibre === 'function') closeModalSlotLibre();
    const nav = document.querySelector('.site-nav');
    const t = document.querySelector('.nav-toggle');
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (t) t.setAttribute('aria-expanded', 'false');
    }
  }
});
