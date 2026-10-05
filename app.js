// ⚠️ CAMBIA ESTO por tu número de WhatsApp (código país + número, sin + ni espacios)
const WHATSAPP_NUMERO = "527571371563";

// ===== ESTADO =====
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let categoriaActiva = "Todas";
let busqueda = "";

// ===== HELPERS =====
const $ = (sel) => document.querySelector(sel);
const guardarCarrito = () => localStorage.setItem("carrito", JSON.stringify(carrito));

// ===== RENDER CATEGORÍAS =====
function renderCategorias() {
  const cats = ["Todas", ...new Set(PRODUCTOS.map(p => p.categoria))];
  $("#categorias").innerHTML = cats.map(c =>
    `<button class="${c === categoriaActiva ? 'activa' : ''}" data-cat="${c}">${c}</button>`
  ).join("");
  document.querySelectorAll("#categorias button").forEach(b => {
    b.onclick = () => { categoriaActiva = b.dataset.cat; renderCategorias(); renderCatalogo(); };
  });
}

// ===== RENDER CATÁLOGO =====
function renderCatalogo() {
  const filtrados = PRODUCTOS.filter(p => {
    const okCat = categoriaActiva === "Todas" || p.categoria === categoriaActiva;
    const okBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return okCat && okBusq;
  });

  if (filtrados.length === 0) {
    $("#catalogo").innerHTML = `<p class="vacio" style="grid-column:1/-1">No hay productos 😢</p>`;
    return;
  }

  $("#catalogo").innerHTML = filtrados.map(p => `
    <div class="producto" data-id="${p.id}">
      <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
      <div class="producto-info">
        <h3>${p.nombre}</h3>
        <p class="precio">$${p.precio}</p>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".producto").forEach(el => {
    el.onclick = () => abrirProducto(Number(el.dataset.id));
  });
}

// ===== MODAL PRODUCTO =====
let tallaSeleccionada = null;

function abrirProducto(id) {
  const p = PRODUCTOS.find(x => x.id === id);
  if (!p) return;
  tallaSeleccionada = p.tallas[0];

  $("#detalleProducto").innerHTML = `
    <img src="${p.imagen}" alt="${p.nombre}">
    <h2>${p.nombre}</h2>
    <p class="precio-grande">$${p.precio}</p>
    <p style="color:#666; margin-bottom:12px">${p.descripcion}</p>
    <p><strong>Tallas:</strong></p>
    <div class="tallas">
      ${p.tallas.map(t => `<button class="${t === tallaSeleccionada ? 'activa':''}" data-talla="${t}">${t}</button>`).join("")}
    </div>
    <button class="btn-primario" id="btnAgregar">➕ Agregar al carrito</button>
  `;

  document.querySelectorAll(".tallas button").forEach(b => {
    b.onclick = () => {
      tallaSeleccionada = b.dataset.talla;
      document.querySelectorAll(".tallas button").forEach(x => x.classList.remove("activa"));
      b.classList.add("activa");
    };
  });

  $("#btnAgregar").onclick = () => {
    agregarAlCarrito(p, tallaSeleccionada);
    cerrarModales();
    abrirCarrito();
  };

  $("#modalProducto").classList.remove("oculto");
}

// ===== CARRITO =====
function agregarAlCarrito(producto, talla) {
  const key = `${producto.id}-${talla}`;
  const existente = carrito.find(i => i.key === key);
  if (existente) existente.cantidad++;
  else carrito.push({
    key,
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    imagen: producto.imagen,
    talla,
    cantidad: 1
  });
  guardarCarrito();
  actualizarContador();
}

function actualizarContador() {
  const total = carrito.reduce((s, i) => s + i.cantidad, 0);
  $("#contadorCarrito").textContent = total;
}

function renderCarrito() {
  if (carrito.length === 0) {
    $("#itemsCarrito").innerHTML = `<p class="vacio">Tu carrito está vacío 🛒</p>`;
    $("#totalCarrito").textContent = "$0";
    return;
  }

  $("#itemsCarrito").innerHTML = carrito.map(i => `
    <div class="item-carrito">
      <img src="${i.imagen}" alt="${i.nombre}">
      <div class="info">
        <h4>${i.nombre}</h4>
        <small>Talla: ${i.talla}</small><br>
        <small>$${i.precio} × ${i.cantidad} = <strong>$${i.precio * i.cantidad}</strong></small>
      </div>
      <div class="controles">
        <button data-menos="${i.key}">−</button>
        <span>${i.cantidad}</span>
        <button data-mas="${i.key}">+</button>
      </div>
    </div>
  `).join("");

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  $("#totalCarrito").textContent = "$" + total.toLocaleString();

  document.querySelectorAll("[data-mas]").forEach(b => {
    b.onclick = () => cambiarCantidad(b.dataset.mas, 1);
  });
  document.querySelectorAll("[data-menos]").forEach(b => {
    b.onclick = () => cambiarCantidad(b.dataset.menos, -1);
  });
}

function cambiarCantidad(key, delta) {
  const item = carrito.find(i => i.key === key);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) carrito = carrito.filter(i => i.key !== key);
  guardarCarrito();
  renderCarrito();
  actualizarContador();
}

// ===== WHATSAPP =====
function enviarWhatsApp() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío 🛒");
    return;
  }

  const lineas = carrito.map(i =>
    `• ${i.nombre} (Talla ${i.talla}) — $${i.precio} × ${i.cantidad} = $${i.precio * i.cantidad}`
  ).join("\n");

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const mensaje =
    `🛒 *NUEVO PEDIDO*\n\n` +
    `${lineas}\n\n` +
    `*Total: $${total.toLocaleString()}*`;

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// ===== MODALES =====
function abrirCarrito() {
  renderCarrito();
  $("#modalCarrito").classList.remove("oculto");
}
function cerrarModales() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("oculto"));
}

// ===== EVENTOS =====
$("#btnCarrito").onclick = abrirCarrito;
$("#btnWhatsApp").onclick = enviarWhatsApp;
$("#buscador").oninput = (e) => { busqueda = e.target.value; renderCatalogo(); };
document.querySelectorAll("[data-cerrar]").forEach(b => b.onclick = cerrarModales);
document.querySelectorAll(".modal").forEach(m => {
  m.onclick = (e) => { if (e.target === m) cerrarModales(); };
});

// ===== INICIO =====
renderCategorias();
renderCatalogo();
actualizarContador();