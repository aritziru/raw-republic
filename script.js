/* ============================================================
   RAW Republic — script.js
   Versión: 1.0  |  Todas las funciones interactivas
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   0. ESTADO GLOBAL
───────────────────────────────────────────────────────────── */
let cart = [];                  // Array de items del carrito
let currentProductData = null;  // Producto abierto en el modal
let galleryImages = [];         // Imágenes del carrusel del modal
let galleryIndex  = 0;          // Slide activo del carrusel
const SHIPPING_FREE = 80;       // Umbral envío gratis (€)
const SHIPPING_COST = 4.95;     // Coste de envío (€)


/* ─────────────────────────────────────────────────────────────
   1. SPARKS — Partículas de chispas en el Hero
───────────────────────────────────────────────────────────── */
(function initSparks() {
  const container = document.getElementById('heroSparks');
  if (!container) return;

  const TOTAL = 28;

  for (let i = 0; i < TOTAL; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';

    // Posición horizontal aleatoria
    const left = Math.random() * 100;
    // Duración y retraso aleatorios para que no suban en sincronía
    const duration = 4 + Math.random() * 6;   // entre 4s y 10s
    const delay    = Math.random() * 8;        // retraso inicial
    const size     = 2 + Math.random() * 3;   // tamaño entre 2px y 5px
    const opacity  = 0.4 + Math.random() * 0.5;

    spark.style.cssText = `
      left:${left}%;
      width:${size}px;
      height:${size}px;
      opacity:${opacity};
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(spark);
  }
})();


/* ─────────────────────────────────────────────────────────────
   2. NAVBAR — scroll + fondo + hamburger
───────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (!navbar) return;

  // Añadir clase "scrolled" al bajar
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Hamburger — menú móvil
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    // Cerrar menú al hacer clic en un enlace (móvil)
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();


/* ─────────────────────────────────────────────────────────────
   3. MENÚ ACTIVO — subrayado dinámico al hacer scroll
───────────────────────────────────────────────────────────── */
(function initActiveNav() {
  const links    = document.querySelectorAll('.nav-link[data-section]');
  const sections = [];

  links.forEach(link => {
    const id = link.getAttribute('data-section');
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link });
  });

  if (!sections.length) return;

  function setActive(id) {
    links.forEach(l => l.classList.remove('active'));
    const match = sections.find(s => s.id === id);
    if (match) match.link.classList.add('active');
  }

  // Activar al hacer clic directo
  links.forEach(link => {
    link.addEventListener('click', () => {
      setActive(link.getAttribute('data-section'));
    });
  });

  // IntersectionObserver: detectar la sección más visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, {
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(s => observer.observe(s.el));
})();


/* ─────────────────────────────────────────────────────────────
   4. HOVER CAROUSEL — cambio automático de foto en tarjetas
───────────────────────────────────────────────────────────── */
(function initHoverCarousel() {
  document.querySelectorAll('.product-img-wrap').forEach(wrap => {
    const front = wrap.getAttribute('data-front');
    const back  = wrap.getAttribute('data-back');
    if (!front || !back) return;

    let img = wrap.querySelector('.product-img-main');
    let timer = null;
    let showing = 'front';

    // Si la tarjeta usa placeholder, no hay <img>; la creamos oculta
    // para que el hover la muestre. Si ya existe, usamos la que hay.
    if (!img) {
      img = document.createElement('img');
      img.className = 'product-img-main';
      img.alt = wrap.closest('.product-card')
                  ?.querySelector('.product-name')?.textContent || '';
      img.src = front;
      // Insertamos antes del primer hijo para que quede detrás de los badges
      wrap.insertBefore(img, wrap.firstChild);
    }

    wrap.addEventListener('mouseenter', () => {
      // Alternar cada 2 segundos mientras el ratón está encima
      timer = setInterval(() => {
        showing = (showing === 'front') ? 'back' : 'front';
        img.style.opacity = '0';
        setTimeout(() => {
          img.src     = (showing === 'front') ? front : back;
          img.style.opacity = '1';
        }, 200);
      }, 2000);
    });

    wrap.addEventListener('mouseleave', () => {
      clearInterval(timer);
      timer = null;
      // Volver a la foto de frente
      showing = 'front';
      img.style.opacity = '0';
      setTimeout(() => {
        img.src         = front;
        img.style.opacity = '1';
      }, 200);
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   5. MODAL DE PRODUCTO — abrir / carrusel / añadir al carrito
───────────────────────────────────────────────────────────── */

/**
 * Abre el modal con los datos del producto clicado.
 * @param {HTMLElement} card  — el article.product-card
 */
function openProductModal(card) {
  if (!card) return;

  // Recoger datos del data-attributes de la tarjeta
  const id    = card.dataset.productId   || '';
  const name  = card.dataset.productName || 'Producto';
  const price = card.dataset.productPrice || '0';
  const cat   = card.dataset.productCat   || '';
  const desc  = card.dataset.productDesc  || '';
  const front = card.dataset.imgFront     || '';
  const back  = card.dataset.imgBack      || '';
  const sizes = card.dataset.sizes ? card.dataset.sizes.split(',') : [];
  const colors= card.dataset.colors ? card.dataset.colors.split(',') : [];

  currentProductData = { id, name, price, front, back };

  // Rellenar textos
  document.getElementById('mp-cat').textContent   = cat;
  document.getElementById('modal-producto-title').textContent = name;
  document.getElementById('mp-price').innerHTML   =
    `${parseFloat(price).toFixed(2).replace('.', ',')} <span class="currency">€</span>`;
  document.getElementById('mp-desc').textContent  = desc;

  // Selectores de talla
  const tallaSelect = document.getElementById('mp-talla');
  tallaSelect.innerHTML = '<option value="">— Elige talla —</option>';
  sizes.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.trim();
    opt.textContent = s.trim();
    tallaSelect.appendChild(opt);
  });

  // Selectores de color
  const colorSelect = document.getElementById('mp-color');
  colorSelect.innerHTML = '<option value="">— Elige color —</option>';
  colors.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.trim();
    opt.textContent = c.trim();
    colorSelect.appendChild(opt);
  });

  // Construir array de imágenes para el carrusel
  galleryImages = [];
  if (front) galleryImages.push(front);
  if (back  && back !== front) galleryImages.push(back);
  // Si no hay ninguna imagen real, usamos un placeholder
  if (!galleryImages.length) galleryImages.push('');

  galleryIndex = 0;
  renderGallery();

  // Abrir modal
  openModal('modal-producto');
}

/** Renderiza el carrusel de imágenes del modal */
function renderGallery() {
  const track = document.getElementById('galleryTrack');
  const dots  = document.getElementById('galleryDots');
  if (!track || !dots) return;

  track.innerHTML = '';
  dots.innerHTML  = '';

  galleryImages.forEach((src, i) => {
    // Slide
    const slide = document.createElement('div');
    slide.className = 'gallery-slide' + (i === galleryIndex ? ' active' : '');

    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Vista ${i + 1}`;
      img.loading = 'lazy';
      slide.appendChild(img);
    } else {
      // Placeholder si no hay imagen
      slide.innerHTML = '<div class="product-img-placeholder"><i class="fa-solid fa-shirt"></i><span>Foto próximamente</span></div>';
    }
    track.appendChild(slide);

    // Dot
    const dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === galleryIndex ? ' active' : '');
    dot.setAttribute('aria-label', `Vista ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dots.appendChild(dot);
  });
}

function goToSlide(index) {
  galleryIndex = Math.max(0, Math.min(index, galleryImages.length - 1));
  document.querySelectorAll('#galleryTrack .gallery-slide').forEach((s, i) => {
    s.classList.toggle('active', i === galleryIndex);
  });
  document.querySelectorAll('#galleryDots .gallery-dot').forEach((d, i) => {
    d.classList.toggle('active', i === galleryIndex);
  });
}

function galleryPrev() {
  goToSlide((galleryIndex - 1 + galleryImages.length) % galleryImages.length);
}
function galleryNext() {
  goToSlide((galleryIndex + 1) % galleryImages.length);
}

/** Soporte de swipe táctil en el carrusel del modal */
(function initGallerySwipe() {
  const track = document.getElementById('galleryTrack');
  if (!track) return;
  let startX = 0;

  track.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? galleryNext() : galleryPrev();
    }
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   6. MODAL GENÉRICO — abrir / cerrar
───────────────────────────────────────────────────────────── */

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  // Cerrar al hacer clic en el overlay
  modal.addEventListener('click', function overlayClose(e) {
    if (e.target === modal) {
      closeModal(id);
      modal.removeEventListener('click', overlayClose);
    }
  });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  // Quitar scroll-lock solo si no hay otro modal abierto
  const anyOpen = document.querySelector('.modal-overlay.open');
  if (!anyOpen) document.body.classList.remove('modal-open');
}

// Cerrar con la tecla Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      closeModal(m.id);
    });
    closeCartDrawer();
  }
});


/* ─────────────────────────────────────────────────────────────
   7. CARRITO — lógica completa
───────────────────────────────────────────────────────────── */

/** Abre el drawer lateral del carrito */
function openCartDrawer() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.classList.add('modal-open');
}

/** Cierra el drawer lateral del carrito */
function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.classList.remove('modal-open');
  }
}

// Botón del icono del carrito en la navbar
document.getElementById('cartBtn')?.addEventListener('click', openCartDrawer);

/**
 * Añade un item al carrito desde una tarjeta de producto.
 * Usado en los botones "Añadir al carrito" del catálogo.
 */
function handleAddToCart(btn) {
  if (!btn) return;
  const id    = btn.dataset.productId;
  const name  = btn.dataset.productName;
  const price = parseFloat(btn.dataset.productPrice) || 0;

  // Buscar talla y color en los selects de la misma tarjeta
  const card  = btn.closest('.product-card');
  const talla = card?.querySelector('[data-variant="size"]')?.value  || '';
  const color = card?.querySelector('[data-variant="color"]')?.value || '';

  addItemToCart({ id, name, price, talla, color, img: '' });
}

/**
 * Añade un item al carrito desde el modal de detalle.
 */
function addToCartFromModal() {
  if (!currentProductData) return;

  const talla = document.getElementById('mp-talla')?.value || '';
  const color = document.getElementById('mp-color')?.value || '';

  addItemToCart({
    id:    currentProductData.id,
    name:  currentProductData.name,
    price: parseFloat(currentProductData.price) || 0,
    talla,
    color,
    img:   currentProductData.front || ''
  });

  closeModal('modal-producto');
}

/**
 * Lógica central: añade o incrementa un item en el carrito.
 */
function addItemToCart({ id, name, price, talla, color, img }) {
  // Clave única por producto + variante
  const key = `${id}__${talla}__${color}`;
  const existing = cart.find(i => i.key === key);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ key, id, name, price, talla, color, img, qty: 1 });
  }

  renderCart();
  showToast(`"${name}" añadido al carrito`);
  animateCartIcon();
}

/** Elimina un item del carrito por su key */
function removeCartItem(key) {
  cart = cart.filter(i => i.key !== key);
  renderCart();
}

/** Cambia la cantidad de un item */
function updateCartQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
}

/** Vacía el carrito */
function clearCart() {
  cart = [];
  renderCart();
}

/** Re-renderiza el drawer del carrito con el estado actual */
function renderCart() {
  const listEl    = document.getElementById('cartItemsList');
  const emptyEl   = document.getElementById('cartEmpty');
  const footerEl  = document.getElementById('cartDrawerFooter');
  const countEl   = document.getElementById('cartCount');
  const subEl     = document.getElementById('cartSubtotal');
  const totalEl   = document.getElementById('cartTotal');
  const shipEl    = document.getElementById('cartShipping');

  if (!listEl) return;

  // Total de unidades
  const totalUnits = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping   = (subtotal >= SHIPPING_FREE || subtotal === 0)
                       ? 0 : SHIPPING_COST;
  const total      = subtotal + shipping;

  // Badge del carrito
  if (countEl) {
    countEl.textContent = totalUnits;
    countEl.classList.toggle('has-items', totalUnits > 0);
  }

  if (cart.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl)  emptyEl.style.display  = '';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl)  emptyEl.style.display  = 'none';
  if (footerEl) footerEl.style.display = '';

  // Renderizar items
  listEl.innerHTML = cart.map(item => `
    <li class="cart-item" data-key="${escHtml(item.key)}">
      <div class="cart-item-img">
        ${item.img
          ? `<img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" loading="lazy">`
          : `<div class="cart-item-placeholder"><i class="fa-solid fa-shirt"></i></div>`
        }
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${escHtml(item.name)}</p>
        ${item.talla ? `<span class="cart-item-variant">Talla: ${escHtml(item.talla)}</span>` : ''}
        ${item.color ? `<span class="cart-item-variant">Color: ${escHtml(item.color)}</span>` : ''}
        <p class="cart-item-price">${(item.price * item.qty).toFixed(2).replace('.', ',')} €</p>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.key)}', -1)" aria-label="Restar">−</button>
        <span class="cart-qty">${item.qty}</span>
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.key)}', 1)" aria-label="Sumar">+</button>
        <button class="cart-remove-btn" onclick="removeCartItem('${escHtml(item.key)}')" aria-label="Eliminar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </li>
  `).join('');

  // Totales
  if (subEl)   subEl.textContent  = `${subtotal.toFixed(2).replace('.', ',')} €`;
  if (totalEl) totalEl.textContent = `${total.toFixed(2).replace('.', ',')} €`;
  if (shipEl) {
    shipEl.textContent = shipping === 0
      ? subtotal === 0 ? '— (calculado al pagar)' : 'GRATIS'
      : `${shipping.toFixed(2).replace('.', ',')} €`;
    shipEl.style.color = shipping === 0 && subtotal > 0
      ? 'var(--accent)' : '';
  }
}

/** Pequeña animación de rebote en el icono del carrito */
function animateCartIcon() {
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.classList.add('bounce');
  setTimeout(() => btn.classList.remove('bounce'), 500);
}

/** Helper anti-XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* ─────────────────────────────────────────────────────────────
   8. TOAST — notificación breve
───────────────────────────────────────────────────────────── */
let toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.querySelector('i')?.nextSibling && (toast.childNodes[1].textContent = ' ' + msg);
  toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${escHtml(msg)}`;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}


/* ─────────────────────────────────────────────────────────────
   9. FAQ — acordeón con animación suave
───────────────────────────────────────────────────────────── */
(function initFaq() {
  // Los <details> nativos ya son funcionales, pero añadimos
  // animación de rotación del ícono y cierre de otros items.
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    item.addEventListener('toggle', () => {
      // Rotar el icono
      const icon = item.querySelector('.faq-icon');
      if (icon) icon.style.transform = item.open ? 'rotate(180deg)' : 'rotate(0deg)';

      // Cerrar otros cuando se abre uno nuevo (acordeón)
      if (item.open) {
        items.forEach(other => {
          if (other !== item && other.open) {
            other.open = false;
            const oi = other.querySelector('.faq-icon');
            if (oi) oi.style.transform = 'rotate(0deg)';
          }
        });
      }
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   10. COUNTDOWN — contador para sección Nutrición
───────────────────────────────────────────────────────────── */
(function initCountdown() {
  const target = new Date('2025-09-01T00:00:00');

  function tick() {
    const now  = new Date();
    const diff = target - now;
    if (diff <= 0) return;

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const pad = n => String(n).padStart(2, '0');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('cd-days',  pad(days));
    set('cd-hours', pad(hours));
    set('cd-mins',  pad(mins));
    set('cd-secs',  pad(secs));
  }

  tick();
  setInterval(tick, 1000);
})();


/* ─────────────────────────────────────────────────────────────
   11. NEWSLETTER — formulario de aviso nutrición
───────────────────────────────────────────────────────────── */
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const success = document.getElementById('nutr-success');
  if (success) {
    success.classList.remove('hidden');
    e.target.reset();
    setTimeout(() => success.classList.add('hidden'), 6000);
  }
}


/* ─────────────────────────────────────────────────────────────
   12. CONTACTO — formulario de soporte
───────────────────────────────────────────────────────────── */
function handleContactSubmit(e) {
  e.preventDefault();
  const success = document.getElementById('contact-success');
  if (success) {
    success.classList.remove('hidden');
    e.target.reset();
    setTimeout(() => success.classList.add('hidden'), 8000);
  }
}


/* ─────────────────────────────────────────────────────────────
   13. SMOOTH SCROLL — anclas internas con offset por la navbar
───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('navbar')?.offsetHeight || 70;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   14. SCROLL REVEAL — aparición suave de secciones
───────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll(
    '.product-card, .cat-card, .faq-item, .contact-item, .section-header'
  );

  if (!('IntersectionObserver' in window)) {
    // Fallback: mostrar todo si no hay soporte
    els.forEach(el => el.classList.add('revealed'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => {
    el.classList.add('reveal-hidden');
    io.observe(el);
  });
})();


/* ─────────────────────────────────────────────────────────────
   15. INIT — arranque al cargar el DOM
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Renderizar carrito vacío (actualiza el badge a 0)
  renderCart();

  // Asegurar que el overlay del carrito cierra al hacer clic
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartDrawer);

  console.info('%cRAW Republic JS cargado ✓', 'color:#ff6a00;font-weight:bold;font-size:14px');
});
