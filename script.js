/* ═══════════════════════════════════════════
   RAW Republic — script.js
═══════════════════════════════════════════ */

'use strict';

// ── Navbar scroll effect ──────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });


// ── Mobile hamburger menu ─────────────────
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

// Close nav on link click (mobile)
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});


// ── Active nav link on scroll ─────────────
const sections = document.querySelectorAll('section[id], div[id]');
const allNavLinks = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      allNavLinks.forEach(link => link.style.color = '');
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--accent)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => observer.observe(section));


// ── Cart simulation ───────────────────────
let cartItems = 0;
const cartCount = document.getElementById('cartCount');
const toast     = document.getElementById('toast');

function addToCart() {
  cartItems++;
  cartCount.textContent = cartItems;

  // Bump animation
  cartCount.classList.remove('bump');
  void cartCount.offsetWidth; // reflow
  cartCount.classList.add('bump');
  setTimeout(() => cartCount.classList.remove('bump'), 300);

  showToast('Añadido al carrito');
}

function showToast(msg) {
  toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Cart button click
document.getElementById('cartBtn').addEventListener('click', () => {
  if (cartItems > 0) {
    showToast(`${cartItems} artículo${cartItems !== 1 ? 's' : ''} en tu carrito`);
  } else {
    showToast('Tu carrito está vacío');
  }
});


// ── Countdown timer ───────────────────────
// Target: 90 days from today
const launchDate = new Date();
launchDate.setDate(launchDate.getDate() + 90);

function updateCountdown() {
  const now  = new Date();
  const diff = launchDate - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent  = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent  = '00';
    document.getElementById('cd-secs').textContent  = '00';
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);


// ── Newsletter form ───────────────────────
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const form    = e.target;
  const success = document.getElementById('nutr-success');

  // Simulate API call
  const btn = form.querySelector('button');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
  btn.disabled = true;

  setTimeout(() => {
    form.style.display = 'none';
    success.classList.remove('hidden');
  }, 1200);
}


// ── Contact form ──────────────────────────
function handleContactSubmit(e) {
  e.preventDefault();
  const form    = e.target;
  const success = document.getElementById('contact-success');
  const btn     = form.querySelector('button[type="submit"]');

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
  btn.disabled = true;

  setTimeout(() => {
    form.reset();
    btn.innerHTML = 'Mensaje enviado <i class="fa-solid fa-check"></i>';
    success.classList.remove('hidden');

    setTimeout(() => {
      btn.innerHTML = 'Enviar Mensaje <i class="fa-solid fa-paper-plane"></i>';
      btn.disabled = false;
      success.classList.add('hidden');
    }, 4000);
  }, 1500);
}


// ── Particle generator (Nutrición bg) ────
(function generateParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const x    = Math.random() * 100;
    const delay = Math.random() * 8;
    const dur   = Math.random() * 10 + 8;
    const opacity = Math.random() * 0.15 + 0.03;

    p.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -10px;
      background: var(--accent);
      border-radius: 50%;
      opacity: ${opacity};
      animation: floatUp ${dur}s ${delay}s infinite ease-in;
    `;
    container.appendChild(p);
  }

  // Inject float keyframes once
  if (!document.getElementById('particle-styles')) {
    const style = document.createElement('style');
    style.id = 'particle-styles';
    style.textContent = `
      @keyframes floatUp {
        0%   { transform: translateY(0) translateX(0); opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 0.5; }
        100% { transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 80 + 20)}px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();


// ── Scroll-reveal for cards ───────────────
const revealItems = document.querySelectorAll('.cat-card, .contact-item, .feature-item');

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealItems.forEach(item => {
  item.style.opacity   = '0';
  item.style.transform = 'translateY(24px)';
  item.style.transition = 'opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, box-shadow 0.3s';
  revealObserver.observe(item);
});


// ── Smooth anchor offset (fixed navbar) ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
    const top    = target.getBoundingClientRect().top + window.scrollY - navH - 20;

    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ════════════════════════════════════════
   NUEVAS FUNCIONES — Venta Bajo Pedido
════════════════════════════════════════ */

// ── Modales ────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Cerrar modal al hacer clic fuera del box
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Cerrar modales con tecla Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});


// ── Botón "Añadir al carrito" (bajo pedido) ──
function handleAddToCart(btn) {
  // Encuentra la tarjeta del producto
  const card = btn.closest('.product-card');
  if (!card) return;

  // Valida que se hayan seleccionado talla y color
  const sizeSelect  = card.querySelector('[data-variant="size"]');
  const colorSelect = card.querySelector('[data-variant="color"]');

  if (sizeSelect && !sizeSelect.value) {
    highlightSelect(sizeSelect, 'Por favor elige una talla');
    return;
  }
  if (colorSelect && !colorSelect.value) {
    highlightSelect(colorSelect, 'Por favor elige un color');
    return;
  }

  // Todo OK: actualiza carrito
  const name  = btn.dataset.productName || 'Producto';
  const price = btn.dataset.productPrice || '0.00';

  addToCart();  // función de script.js original (incrementa contador + toast)
  showToast(`${name} añadido — ${price} €`);

  /*
   * INTEGRACIÓN FUTURA:
   * ─────────────────────────────────────
   * Snipcart: cambia el <button> en HTML por uno con clases Snipcart
   *           y borra esta función. Snipcart maneja su propio carrito.
   *
   * Ecwid:    llama a Ecwid.Cart.addProduct({ id, options })
   *           pasando los valores de sizeSelect.value y colorSelect.value.
   *
   * Ejemplo Ecwid:
   *   Ecwid.Cart.addProduct({
   *     id: parseInt(btn.dataset.productId),
   *     quantity: 1,
   *     options: { Talla: sizeSelect.value, Color: colorSelect.value }
   *   });
   */
}

function highlightSelect(select, msg) {
  select.style.borderColor = '#dc4040';
  select.style.boxShadow   = '0 0 0 2px rgba(220,64,64,0.2)';
  showToast(msg);
  setTimeout(() => {
    select.style.borderColor = '';
    select.style.boxShadow   = '';
  }, 2500);
}
