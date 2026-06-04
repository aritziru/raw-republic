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

  // ── Dropdowns ──
  const dropdowns = document.querySelectorAll('.nav-item-dropdown');

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-link-dropdown');

    // Mobile: click toggle
    trigger.addEventListener('click', (e) => {
      const isMobile = window.innerWidth <= 900;
      if (!isMobile) return; // en desktop el CSS hover lo gestiona

      e.preventDefault();
      const isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen);

      // Cerrar los otros dropdowns abiertos
      dropdowns.forEach(other => {
        if (other !== dropdown) {
          other.classList.remove('open');
          other.querySelector('.nav-link-dropdown')
               .setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Soporte teclado desktop
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen);
      }
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });

    // Cerrar al hacer clic fuera (desktop)
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Al hacer clic en un item del dropdown, cerrar todo el menú (móvil)
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdowns.forEach(d => d.classList.remove('open'));
      if (navLinks) navLinks.classList.remove('open');
      if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Hamburger — menú móvil
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
      if (!open) {
        dropdowns.forEach(d => d.classList.remove('open'));
      }
    });

    // Cerrar menú al hacer clic en un enlace normal (móvil)
    navLinks.querySelectorAll('a.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        dropdowns.forEach(d => d.classList.remove('open'));
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
  const third = card.dataset.imgThird     || '';
  const sizes = card.dataset.sizes ? card.dataset.sizes.split(',') : [];
  const colors= card.dataset.colors ? card.dataset.colors.split(',') : [];

  currentProductData = { id, name, price, front, back, third };

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
  if (third && third !== front && third !== back) galleryImages.push(third);
  // Si no hay ninguna imagen real, usamos un placeholder
  if (!galleryImages.length) galleryImages.push('');

  galleryIndex = 0;
  renderGallery();

  // Abrir modal
  openModal('modal-producto');

  /* ── Notificar al sistema de temas qué categoría se está viendo ── */
  if (window.RRTheme) {
    const catKey = cat.toLowerCase().trim();
    /* Buscar en CAT_THEME si existe como clave directa; si no,
       intentar deducirlo por palabras clave en el nombre */
    const CAT_THEME = window.RRTheme._catTheme || {};
    let theme = CAT_THEME[catKey] || null;
    if (!theme) {
      if (/sudadera|chaqueta|hoodie|abrigo|t[eé]rmi|arctic|polar|invierno/i.test(catKey + ' ' + name)) theme = 'snow';
      else if (/camiseta|top|short|pantalón|pantalon|verano|sol|sun|vest|tank/i.test(catKey + ' ' + name)) theme = 'sun';
      else if (/accesorios|muñequera|gorra|botella|tape|calcet|malla|gym|legging/i.test(catKey + ' ' + name)) theme = 'gym';
    }
    if (theme) window.RRTheme.setContext(theme, true);
  }
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

  /* Al cerrar el modal de producto, liberar el contexto de tema ── */
  if (id === 'modal-producto' && window.RRTheme) {
    window.RRTheme.clearModal();
  }
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
  // Cerrar mega menús abiertos para evitar solapamiento visual
  document.querySelectorAll('.mega-parent.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.nav-item-dropdown.open').forEach(el => el.classList.remove('open'));

  const drawer  = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');

  if (!drawer || !overlay) return;

  // Forzar z-index correctos en línea (garantía extra)
  overlay.style.cssText += ';z-index:1090 !important;position:fixed !important;';
  drawer.style.cssText  += ';z-index:1091 !important;position:fixed !important;';

  overlay.classList.add('open');
  drawer.classList.add('open');
  document.body.classList.add('modal-open');
}

/** Cierra el drawer lateral del carrito */
function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.classList.remove('modal-open');
  }
  // Resetear panel de reserva al cerrar el carrito
  const payPanel    = document.getElementById('cartPaymentPanel');
  const reservaForm = document.getElementById('cartReservaForm');
  if (payPanel)    payPanel.style.display    = '';
  if (reservaForm) reservaForm.style.display = 'none';
  // Resetear el formulario de reserva si existe
  const formReserva = document.getElementById('formReserva');
  if (formReserva) formReserva.reset();
  // Cerrar panel visual de tarjeta si estaba abierto
  const cardPanel = document.getElementById('cardFieldsPanel');
  if (cardPanel) cardPanel.style.display = 'none';
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

  // ── Validación obligatoria ──
  if (!talla || !color) {
    showToast('Selecciona una talla y un color antes de continuar.', 'error');
    return;
  }

  addItemToCart({ id, name, price, talla, color, img: '' });
}

/**
 * Añade un item al carrito desde el modal de detalle.
 */
function addToCartFromModal() {
  if (!currentProductData) return;

  const talla = document.getElementById('mp-talla')?.value || '';
  const color = document.getElementById('mp-color')?.value || '';

  // ── Validación obligatoria ──
  if (!talla || !color) {
    showToast('Selecciona una talla y un color antes de continuar.', 'error');
    return;
  }

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
  listEl.innerHTML = cart.map(item => {
    // Construir texto de variantes para el formulario de reserva
    const metaParts = [];
    if (item.talla) metaParts.push(`Talla: ${item.talla}`);
    if (item.color) metaParts.push(`Color: ${item.color}`);
    const metaText = metaParts.join(' · ');

    return `
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
        <span class="cart-item-meta" style="display:none">${escHtml(metaText)}</span>
        <p class="cart-item-price">${(item.price * item.qty).toFixed(2).replace('.', ',')} €</p>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.key)}', -1)" aria-label="Restar">−</button>
        <span class="cart-item-qty cart-qty">${item.qty}</span>
        <button class="cart-qty-btn" onclick="updateCartQty('${escHtml(item.key)}', 1)" aria-label="Sumar">+</button>
        <button class="cart-remove-btn" onclick="removeCartItem('${escHtml(item.key)}')" aria-label="Eliminar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </li>
  `;
  }).join('');

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

/**
 * Muestra una notificación toast integrada en el estilo de la web.
 * @param {string} msg   — Texto del mensaje
 * @param {'success'|'error'|'warning'} [type='success']
 */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Iconos según tipo
  const icons = {
    success: 'fa-check-circle',
    error:   'fa-triangle-exclamation',
    warning: 'fa-circle-info',
  };
  const icon = icons[type] || icons.success;

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${escHtml(msg)}`;

  // Clases de variante
  toast.classList.remove('toast--success', 'toast--error', 'toast--warning');
  toast.classList.add(`toast--${type}`);
  toast.classList.add('show');

  clearTimeout(toastTimer);
  // Los errores se quedan un poco más
  const duration = type === 'error' ? 4500 : 3000;
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
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
  const target = new Date('2027-01-01T00:00:00');

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
   15. FILTRO DE CATÁLOGO — desde el menú de navegación
───────────────────────────────────────────────────────────── */

/**
 * Filtra las tarjetas del catálogo por categoría y hace scroll hasta él.
 * @param {string} cat  — valor de data-filter del enlace del menú
 *                        ('camiseta' | 'sudadera' | 'pantalon' | 'conjunto' |
 *                         'nueva' | 'oferta' | 'bolsa' | 'gorra' |
 *                         'munequera' | 'botella' | 'todo')
 */
/**
 * Restablece el catálogo mostrando todos los productos y limpia cualquier
 * filtro activo. Lo llaman los botones "Ver toda la colección".
 */
function resetCatalog() {
  // Mostrar todas las tarjetas del catálogo
  document.querySelectorAll('#catalogo .product-card').forEach(card => {
    card.style.display = '';
  });

  // Limpiar clase .active de los enlaces de filtro del menú
  document.querySelectorAll('.dropdown-item[data-filter]').forEach(link => {
    link.classList.remove('active');
  });
}

function filterAndScrollTo(cat) {
  // Mapa de filtro → { section, cats }
  // section: filtra por data-section del article (null = sin restricción de sección)
  // cats: filtra por data-product-cat (null = mostrar todos de esa sección)
  const catMap = {
    // ── ROPA ──────────────────────────────────────────────────────
    'camiseta':  { section: 'ropa', cats: ['camiseta'] },
    'sudadera':  { section: 'ropa', cats: ['sudadera', 'hoodie'] },
    'pantalon':  { section: 'ropa', cats: ['pantalón', 'pantalon', 'shorts', 'mallas', 'leggings'] },
    'conjunto':  { section: 'ropa', cats: ['conjunto'] },
    'chaqueta':  { section: 'ropa', cats: ['chaqueta', 'abrigo', 'cortavientos'] },
    'chaqueta-urbana': { section: 'ropa', cats: ['chaqueta', 'abrigo'] },
    'hoodie':    { section: 'ropa', cats: ['sudadera', 'hoodie'] },
    'nueva':     { section: null,   cats: ['nueva temporada'] },
    'oferta':    { section: null,   cats: ['oferta'] },
    // ── ACCESORIOS ────────────────────────────────────────────────
    'bolsa':     { section: 'accesorios', cats: ['bolsa', 'mochila'] },
    'gorra':     { section: 'accesorios', cats: ['gorra', 'gorro'] },
    'munequera': { section: 'accesorios', cats: ['muñequera', 'munequera', 'cinta', 'gimnasio'] },
    'botella':   { section: 'accesorios', cats: ['botella', 'hidratación', 'hidratacion'] },
    'tape':      { section: 'accesorios', cats: ['tape', 'cinta crossfit', 'cinta'] },
    'top':       { section: 'ropa',       cats: ['top', 'tops'] },
    'casual':    { section: 'ropa',       cats: ['camiseta', 'casual'] },
    'shorts':    { section: 'ropa',       cats: ['shorts', 'short'] },
    'todo':      null,   // null = mostrar todos
  };

  const rule  = catMap[cat] ?? null;
  const cards = document.querySelectorAll('#catalogo .product-card');

  cards.forEach(card => {
    if (!rule) {
      // "todo" — mostrar todo
      card.style.display = '';
      return;
    }
    const productCat     = (card.dataset.productCat || '').toLowerCase();
    const productSection = (card.dataset.section    || '').toLowerCase();

    // Filtro por sección (ropa vs accesorios)
    const sectionOk = !rule.section || productSection === rule.section;
    // Filtro por sub-categoría de producto
    const catOk     = !rule.cats   || rule.cats.some(k => productCat.includes(k));

    card.style.display = (sectionOk && catOk) ? '' : 'none';
  });

  // Scroll suave a la sección del catálogo
  const section = document.getElementById('catalogo');
  if (section) {
    const offset = section.getBoundingClientRect().top + window.scrollY - 80; // 80 = altura navbar
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }

  // Marcar el enlace activo en el menú y limpiar los demás
  document.querySelectorAll('.dropdown-item[data-filter]').forEach(link => {
    link.classList.toggle('active', link.dataset.filter === cat);
  });

  // Cerrar el menú desplegable en móvil
  document.querySelectorAll('.nav-item-dropdown.open').forEach(d => d.classList.remove('open'));
}

// Conectar los enlaces del menú con data-filter al filtro del catálogo
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dropdown-item[data-filter]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      filterAndScrollTo(this.dataset.filter);
    });
  });
});


/* ─────────────────────────────────────────────────────────────
   16. INIT — arranque al cargar el DOM
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Renderizar carrito vacío (actualiza el badge a 0)
  renderCart();

  // Asegurar que el overlay del carrito cierra al hacer clic
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartDrawer);

  console.info('%cRAW Republic JS cargado ✓', 'color:#ff6a00;font-weight:bold;font-size:14px');
});

/* ══════════════════════════════════════════════════════════════
   RAW Republic — SCROLL THEMES  (v3 — context-aware)
   ══════════════════════════════════════════════════════════════
   Fuentes de verdad (por prioridad):
     1. contextTheme  — impuesto por filtros del menú o apertura de modal
     2. scrollTheme   — calculado continuamente por scroll
   Mientras contextTheme !== null, el scroll no lo sobreescribe.
   contextTheme se limpia automáticamente al cerrar el modal o al
   llegar a una sección cuyo tema difiera del contexto impuesto
   (excepción: el modal fuerza el bloqueo hasta que se cierre).
   ══════════════════════════════════════════════════════════════ */
(function initScrollThemes() {

  /* ── Definición de temas ──────────────────────────────────── */
  const THEMES = {
    fire: {
      bg:         '#0a0a0a',
      sparkColor: '#ff6a00',
      sparkGlow:  'rgba(255,106,0,0.5)',
      sparkHsl:   [15, 25, 50, 20],
    },
    sun: {
      bg:         '#090800',
      sparkColor: '#ffd000',
      sparkGlow:  'rgba(255,210,0,0.55)',
      sparkHsl:   [42, 16, 65, 25],
    },
    snow: {
      bg:         '#04080f',
      sparkColor: '#a0c8ff',
      sparkGlow:  'rgba(150,200,255,0.45)',
      sparkHsl:   [210, 30, 78, 20],
    },
    gym: {
      bg:         '#080808',
      sparkColor: '#c84000',
      sparkGlow:  'rgba(200,80,0,0.45)',
      sparkHsl:   [10, 15, 40, 20],
    },
  };

  /* ── Mapa de filtros de menú → tema ─────────────────────────
     Cubre todos los data-filter usados en filterAndScrollTo.   */
  const FILTER_THEME = {
    // Verano
    'camiseta': 'sun',  'top': 'sun', 'casual': 'sun',
    'pantalon': 'sun',  'shorts': 'sun',
    // Invierno
    'sudadera': 'snow', 'chaqueta': 'snow',
    'hoodie': 'snow',   'chaqueta-urbana': 'snow',
    // Gym / accesorios
    'munequera': 'gym', 'botella': 'gym',
    'gorra': 'gym',     'tape': 'gym', 'bolsa': 'gym',
    // Mostrar todo → resetear al scroll
    'todo': null,
  };

  /* ── Mapa de categorías de producto → tema ──────────────────
     Para leer el tema de una prenda cuando se abre su modal.   */
  const CAT_THEME = {
    // Verano
    'camiseta técnica': 'sun',
    'camiseta sin mangas': 'sun',
    'pantalón corto técnico': 'sun',
    'shorts': 'sun',
    'sudadera deportiva': 'sun',
    // Invierno
    'sudadera': 'snow',
    'chaquetas / abrigo': 'snow',
    'camiseta térmica': 'snow',
    'pantalón técnico de invierno': 'snow',
    // Gym (ropa)
    'ropa mujer / tops': 'gym',
    'ropa mujer / mallas': 'gym',
    'mallas hombre': 'gym',
    'camiseta gym hombre': 'gym',
    // Accesorios
    'accesorios / calcetines': 'gym',
    'accesorios / gimnasio': 'gym',
    'accesorios / gorras': 'gym',
    'accesorios / hidratación': 'gym',
    'accesorios / tape crossfit': 'gym',
  };

  /* ── Estado ──────────────────────────────────────────────── */
  let currentTheme  = 'fire';   // tema actualmente aplicado
  let scrollTheme   = 'fire';   // último tema calculado por scroll
  let contextTheme  = null;     // tema forzado (filtro / modal); null = libre
  let modalOpen     = false;    // hay un modal de producto abierto

  const body       = document.body;
  const heroSparks = document.getElementById('heroSparks');

  /* ── API pública — permite que openProductModal lo llame ─── */
  window.RRTheme = {
    /** Forzar tema por contexto (filtro/modal). pass null para liberar. */
    setContext(theme, fromModal) {
      modalOpen    = !!fromModal;
      contextTheme = theme;
      const effective = contextTheme ?? scrollTheme;
      applyTheme(effective);
    },
    /** Notificar que el modal se cerró. */
    clearModal() {
      modalOpen    = false;
      contextTheme = null;
      applyTheme(scrollTheme);
    },
    /** Obtener tema actual */
    current() { return currentTheme; },
  };

  /* ── Aplicar tema al body ─────────────────────────────────── */
  function applyTheme(name) {
    if (!THEMES[name] || name === currentTheme) return;
    currentTheme = name;

    const t = THEMES[name];
    body.style.setProperty('--scroll-bg', t.bg);
    body.classList.remove('theme-fire', 'theme-sun', 'theme-snow', 'theme-gym');
    body.classList.add('theme-' + name);

    bodyParticles = [];
    updateHeroSparkColors(t);
  }

  /* ── Hero sparks ──────────────────────────────────────────── */
  function updateHeroSparkColors(t) {
    if (!heroSparks) return;
    heroSparks.style.setProperty('--spark-color', t.sparkColor);
    heroSparks.style.setProperty('--spark-glow',  t.sparkGlow);
    heroSparks.querySelectorAll('.spark').forEach(s => {
      const h = t.sparkHsl[0] + Math.random() * t.sparkHsl[1];
      const l = t.sparkHsl[2] + Math.random() * t.sparkHsl[3];
      s.style.background = `hsl(${h},100%,${l}%)`;
      s.style.boxShadow  = `0 0 6px 2px ${t.sparkGlow}`;
    });
  }

  /* ── Canvas de partículas del body ───────────────────────── */
  let bodyCanvas, bodyCtx, bodyRaf;
  let bodyParticles = [];

  function buildBodyCanvas() {
    bodyCanvas = document.createElement('canvas');
    bodyCanvas.id = 'bodyParticleCanvas';
    bodyCanvas.style.cssText = [
      'position:fixed','inset:0','width:100%','height:100%',
      'pointer-events:none','z-index:0',
    ].join(';');
    document.body.insertBefore(bodyCanvas, document.body.firstChild);
    bodyCtx = bodyCanvas.getContext('2d');
    resizeBodyCanvas();
    window.addEventListener('resize', resizeBodyCanvas, { passive: true });
  }

  function resizeBodyCanvas() {
    if (!bodyCanvas) return;
    bodyCanvas.width  = window.innerWidth;
    bodyCanvas.height = window.innerHeight;
  }

  function spawnBodyParticle() {
    const t      = THEMES[currentTheme];
    const isSnow = currentTheme === 'snow';
    const h = t.sparkHsl[0] + Math.random() * t.sparkHsl[1];
    const l = t.sparkHsl[2] + Math.random() * t.sparkHsl[3];
    bodyParticles.push({
      x:         Math.random() * window.innerWidth,
      y:         isSnow ? -8 : window.innerHeight + 8,
      size:      1.5 + Math.random() * 2.5,
      color:     `hsl(${h},${isSnow ? 40 + Math.random()*30 : 100}%,${l}%)`,
      glow:      t.sparkGlow,
      vx:        (Math.random() - 0.5) * (isSnow ? 0.5 : 0.4),
      vy:        isSnow ? (0.3 + Math.random() * 0.6) : -(0.5 + Math.random() * 0.8),
      life:      0,
      maxLife:   180 + Math.random() * 120,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.015 + Math.random() * 0.015,
      swayAmp:   isSnow ? 0.5 + Math.random() * 0.4 : 0,
      twinkle:   currentTheme === 'sun' ? Math.random() * Math.PI * 2 : null,
      tSpeed:    0.05 + Math.random() * 0.05,
    });
  }

  function bodyLoop() {
    bodyRaf = requestAnimationFrame(bodyLoop);
    if (!bodyCtx || !bodyCanvas) return;
    const W = bodyCanvas.width, H = bodyCanvas.height;
    bodyCtx.clearRect(0, 0, W, H);

    if (Math.random() < 0.4) spawnBodyParticle();
    if (bodyParticles.length > 80) bodyParticles.splice(0, bodyParticles.length - 80);

    for (let i = bodyParticles.length - 1; i >= 0; i--) {
      const p = bodyParticles[i];
      p.life++;
      p.swayPhase += p.swaySpeed;
      p.x += p.vx + Math.sin(p.swayPhase) * p.swayAmp;
      p.y += p.vy;

      const prog = p.life / p.maxLife;
      let alpha = prog < 0.1 ? prog / 0.1 : prog > 0.8 ? (1 - prog) / 0.2 : 1;
      if (p.twinkle !== null) { p.twinkle += p.tSpeed; alpha *= 0.55 + 0.45 * Math.sin(p.twinkle); }

      bodyCtx.save();
      bodyCtx.globalAlpha = alpha * 0.65;
      bodyCtx.shadowColor = p.glow;
      bodyCtx.shadowBlur  = p.size * 4;

      if (currentTheme === 'snow') {
        bodyCtx.strokeStyle = p.color;
        bodyCtx.lineWidth   = p.size * 0.3;
        bodyCtx.translate(p.x, p.y);
        for (let a = 0; a < 3; a++) {
          bodyCtx.beginPath();
          bodyCtx.moveTo(-p.size, 0); bodyCtx.lineTo(p.size, 0);
          bodyCtx.stroke();
          bodyCtx.rotate(Math.PI / 3);
        }
      } else {
        bodyCtx.fillStyle = p.color;
        bodyCtx.beginPath();
        bodyCtx.arc(p.x, p.y, p.size * (1 - prog * 0.4), 0, Math.PI * 2);
        bodyCtx.fill();
      }
      bodyCtx.restore();

      if (p.life >= p.maxLife || p.y < -20 || p.y > H + 20) bodyParticles.splice(i, 1);
    }
  }

  /* ── Detección de tema por scroll ─────────────────────────── */
  function initObserver() {
    const themeMap = {
      'inicio':             'fire',
      'top-ventas':         'fire',
      'catalogo':           'fire',
      'seccion-verano':     'sun',
      'seccion-invierno':   'snow',
      'seccion-gimnasio':   'gym',
      'seccion-accesorios': 'gym',
      'accesorios':         'gym',
      'nutricion':          'fire',
      'faq':                'fire',
      'contacto':           'fire',
    };

    function buildBreakpoints() {
      const points = [];
      document.querySelectorAll('section[id]').forEach(sec => {
        const theme = themeMap[sec.id];
        if (theme) points.push({ y: sec.offsetTop, theme });
      });
      document.querySelectorAll('.subseccion-anchor[data-theme]').forEach(anchor => {
        let sib = anchor.nextElementSibling;
        while (sib && !sib.classList.contains('product-card')) sib = sib.nextElementSibling;
        const y = sib ? sib.offsetTop : anchor.parentElement.offsetTop;
        points.push({ y, theme: anchor.dataset.theme });
      });
      points.sort((a, b) => a.y - b.y);
      return points;
    }

    let breakpoints = buildBreakpoints();
    window.addEventListener('resize', () => { breakpoints = buildBreakpoints(); }, { passive: true });

    function onScroll() {
      const mid = window.scrollY + window.innerHeight * 0.45;
      let chosen = 'fire';
      for (const bp of breakpoints) {
        if (bp.y <= mid) chosen = bp.theme;
        else break;
      }
      scrollTheme = chosen;

      /* Solo aplicar si no hay un modal abierto ni un contexto forzado */
      if (!modalOpen && contextTheme === null) applyTheme(scrollTheme);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    buildBodyCanvas();
    bodyLoop();
    initObserver();
    updateHeroSparkColors(THEMES.fire);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Interceptar filterAndScrollTo para imponer el tema correcto ─
     Se ejecuta después del DOMContentLoaded, cuando filterAndScrollTo
     ya existe en el scope global.                                    */
  document.addEventListener('DOMContentLoaded', () => {
    const _orig = window.filterAndScrollTo;
    if (typeof _orig !== 'function') return;

    window.filterAndScrollTo = function (cat) {
      /* Determinar el tema que corresponde al filtro */
      const hasKey = Object.prototype.hasOwnProperty.call(FILTER_THEME, cat);
      if (hasKey) {
        const targetTheme = FILTER_THEME[cat]; // null significa "liberar"
        contextTheme = targetTheme;
        modalOpen    = false;
        applyTheme(targetTheme ?? scrollTheme);
      }
      /* Llamar a la función original para que el scroll y el filtrado
         ocurran normalmente. El onScroll no sobreescribirá porque
         contextTheme !== null (a menos que sea "todo"). */
      _orig.call(this, cat);
    };
  });

})();



/* ══════════════════════════════════════════════════════════════
   RAW Republic — MEGA-MENÚ: Partículas dinámicas por temporada
   ══════════════════════════════════════════════════════════════ */
(function initMegaMenu() {

  /* ─── Modos de partículas disponibles ─────────────────────── */
  const MODES = {
    fire: {
      label:   'COLECCIÓN ACTIVA',
      bgFrom:  '#0d0d0d',
      bgTo:    '#120800',
      spawn: () => ({
        color: `hsl(${15 + Math.random() * 25}, 100%, ${50 + Math.random() * 20}%)`,
        glow:  'rgba(255,100,0,0.6)',
        size:  2 + Math.random() * 3,
        vx:    (Math.random() - 0.5) * 0.8,
        vy:    -(1.2 + Math.random() * 1.6),
        life:  0,
        maxLife: 90 + Math.random() * 60,
        wobble: (Math.random() - 0.5) * 0.04,
      }),
    },
    sun: {
      label:   'VERANO 2026',
      bgFrom:  '#0d0a00',
      bgTo:    '#150d00',
      spawn: () => ({
        color: `hsl(${42 + Math.random() * 16}, 100%, ${65 + Math.random() * 25}%)`,
        glow:  'rgba(255,210,0,0.7)',
        size:  2.5 + Math.random() * 4,
        vx:    (Math.random() - 0.5) * 0.5,
        vy:    -(0.6 + Math.random() * 0.9),
        life:  0,
        maxLife: 120 + Math.random() * 80,
        wobble: (Math.random() - 0.5) * 0.02,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.06 + Math.random() * 0.06,
      }),
    },
    snow: {
      label:   'INVIERNO 2026',
      bgFrom:  '#04080f',
      bgTo:    '#060c18',
      spawn: () => ({
        color: `hsl(210, ${40 + Math.random() * 30}%, ${80 + Math.random() * 18}%)`,
        glow:  'rgba(180,220,255,0.5)',
        size:  2 + Math.random() * 4,
        vx:    (Math.random() - 0.5) * 0.6,
        vy:    0.4 + Math.random() * 0.8,
        life:  0,
        maxLife: 160 + Math.random() * 100,
        wobble: (Math.random() - 0.5) * 0.015,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.02,
        swayAmp:   0.4 + Math.random() * 0.5,
      }),
    },
  };

  /* ─── Estado ───────────────────────────────────────────────── */
  let canvas, ctx, raf, particles = [];
  let currentMode = 'fire';
  let targetMode  = 'fire';
  let transitionAlpha = 1;   // 1 = modo actual fully shown

  /* ─── Crear canvas en la columna visual ────────────────────── */
  function buildCanvas() {
    const col = document.querySelector('#megaPanelRopa .mega-col--visual');
    if (!col || document.getElementById('megaParticleCanvas')) return;

    /* Fondo oscuro base */
    const bgDiv = document.createElement('div');
    bgDiv.style.cssText = 'position:absolute;inset:0;background:#0d0d0d;z-index:0;';
    col.insertBefore(bgDiv, col.firstChild);

    canvas = document.createElement('canvas');
    canvas.id = 'megaParticleCanvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;';
    col.insertBefore(canvas, col.firstChild);

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    /* Ocultar imágenes antiguas si las hubiera */
    col.querySelectorAll('.mega-visual__img').forEach(img => { img.style.opacity = '0'; });
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  /* ─── Loop de animación ─────────────────────────────────────── */
  function startLoop() {
    if (raf) return;
    loop();
  }

  function stopLoop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    particles = [];
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!ctx || !canvas) return;

    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;

    /* Fade-clear */
    ctx.clearRect(0, 0, W, H);

    /* Fondo degradado según modo */
    const m = MODES[currentMode];
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, m.bgFrom);
    grad.addColorStop(1, m.bgTo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* Añadir nuevas partículas */
    const spawnRate = currentMode === 'snow' ? 1 : 2;
    for (let i = 0; i < spawnRate; i++) {
      const p = m.spawn();
      if (currentMode === 'snow') {
        p.x = Math.random() * W;
        p.y = -p.size;
      } else {
        p.x = W * 0.2 + Math.random() * W * 0.6;
        p.y = H + p.size;
      }
      particles.push(p);
    }

    /* Limitar cantidad */
    if (particles.length > 160) particles.splice(0, particles.length - 160);

    /* Dibujar y actualizar */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;

      /* Movimiento */
      p.wobble += (Math.random() - 0.5) * 0.005;
      p.wobble *= 0.95;
      p.vx += p.wobble;

      if (currentMode === 'snow' && p.swayPhase !== undefined) {
        p.swayPhase += p.swaySpeed;
        p.x += Math.sin(p.swayPhase) * p.swayAmp;
      }

      p.x += p.vx;
      p.y += p.vy;

      /* Opacidad basada en ciclo de vida */
      const progress = p.life / p.maxLife;
      let alpha;
      if (progress < 0.1)      alpha = progress / 0.1;
      else if (progress > 0.8) alpha = (1 - progress) / 0.2;
      else                     alpha = 1;

      /* Twinkle para sol */
      if (p.twinkle !== undefined) {
        p.twinkle += p.twinkleSpeed;
        alpha *= 0.6 + 0.4 * Math.sin(p.twinkle);
      }

      /* Copos: forma de copo (círculo pequeño con cruz) */
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;

      if (currentMode === 'snow') {
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = p.size * 0.35;
        ctx.shadowColor = p.glow;
        ctx.shadowBlur  = p.size * 2;
        const r = p.size;
        for (let a = 0; a < 3; a++) {
          ctx.beginPath();
          ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
          ctx.stroke();
          ctx.rotate(Math.PI / 3);
        }
      } else {
        /* Fuego / Sol: círculo con glow */
        const size = currentMode === 'sun'
          ? p.size * (0.8 + 0.4 * Math.sin(p.twinkle || 0))
          : p.size * (1 - progress * 0.5);

        ctx.shadowColor = p.glow;
        ctx.shadowBlur  = size * 4;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      /* Eliminar si caducada o fuera de pantalla */
      if (p.life >= p.maxLife ||
          p.y < -20 || p.y > H + 20 ||
          p.x < -20 || p.x > W + 20) {
        particles.splice(i, 1);
      }
    }

    /* Etiqueta de temporada */
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.font = 'bold 10px "Barlow Condensed", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = currentMode === 'snow' ? '#a0c8ff' : currentMode === 'sun' ? '#ffd060' : '#ff8030';
    ctx.fillText(m.label.toUpperCase(), 18, H - 18);
    ctx.restore();
  }

  /* ─── Cambiar modo con transición ──────────────────────────── */
  function setMode(mode) {
    if (!MODES[mode]) return;
    if (mode === currentMode) return;
    particles = [];           // limpiar para transición limpia
    currentMode = mode;
    updateVisualLabel(mode);
  }

  /* ─── Etiqueta de texto (megaVisualName) ────────────────────── */
  const megaVisualName = document.getElementById('megaVisualName');
  function updateVisualLabel(mode) {
    if (!megaVisualName) return;
    megaVisualName.style.opacity = '0';
    setTimeout(() => {
      megaVisualName.textContent  = MODES[mode].label;
      megaVisualName.style.opacity = '1';
    }, 150);
  }

  /* ─── Bind de hovers ────────────────────────────────────────── */
  function bindHovers() {
    /* Fila Verano */
    document.querySelectorAll('#megaPanelRopa .mega-category').forEach(cat => {
      cat.addEventListener('mouseenter', () => {
        const src = (cat.getAttribute('data-img') || '').toLowerCase();
        if (src.includes('verano'))   setMode('sun');
        if (src.includes('invierno')) setMode('snow');
      });
    });

    /* Encabezados Gym/Vestir → vuelven a fuego */
    document.querySelectorAll('#megaPanelRopa .mega-subheading').forEach(h => {
      h.addEventListener('mouseenter', () => setMode('fire'));
    });
    document.querySelectorAll('#megaPanelRopa .mega-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        let prev = item.previousElementSibling;
        while (prev) {
          if (prev.classList.contains('mega-subheading')) { setMode('fire'); break; }
          prev = prev.previousElementSibling;
        }
      });
    });

    /* Al abrir el panel: resetear a fuego */
    const dropdownRopa = document.getElementById('dropdownRopa');
    if (dropdownRopa) {
      dropdownRopa.addEventListener('mouseenter', () => {
        particles = [];
        setMode('fire');
        startLoop();
      });
      dropdownRopa.addEventListener('mouseleave', () => {
        /* Pequeño delay para que la animación de cierre del panel termine */
        setTimeout(() => {
          if (!dropdownRopa.matches(':hover')) stopLoop();
        }, 450);
      });
    }
  }

  /* ─── Inicialización ────────────────────────────────────────── */
  function init() {
    buildCanvas();
    updateVisualLabel('fire');
    bindHovers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Conectar mega-items con el filtro del catálogo */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mega-item[data-filter]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof filterAndScrollTo === 'function') {
          filterAndScrollTo(this.dataset.filter);
        }
      });
    });
  });

})();


/* ─────────────────────────────────────────────────────────────
   CATALOG VIEW TOGGLE — alterna 1 columna / 2 columnas (móvil)
───────────────────────────────────────────────────────────── */
function setCatalogView(mode) {
  const grid       = document.getElementById('mainProductGrid');
  const btnSingle  = document.getElementById('viewBtnSingle');
  const btnCompact = document.getElementById('viewBtnCompact');
  if (!grid) return;

  if (mode === 'compact') {
    grid.classList.add('view-compact');
    btnCompact?.classList.add('active');
    btnSingle?.classList.remove('active');
    try { localStorage.setItem('rawCatalogView', 'compact'); } catch(e) {}
  } else {
    grid.classList.remove('view-compact');
    btnSingle?.classList.add('active');
    btnCompact?.classList.remove('active');
    try { localStorage.setItem('rawCatalogView', 'single'); } catch(e) {}
  }
}

/* Restaurar preferencia guardada al cargar */
document.addEventListener('DOMContentLoaded', function () {
  try {
    const saved = localStorage.getItem('rawCatalogView');
    if (saved === 'compact') setCatalogView('compact');
  } catch(e) {}
});
