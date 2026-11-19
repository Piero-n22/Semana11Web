// ============================================================================
// Pastelería Mishky · Catálogo dinámico
// Carga data/productos.json con fetch, genera los filtros por
// categoría, renderiza las tarjetas con <template> e incluye retos y modal.
// ============================================================================

const RUTA_DATOS = "data/productos.json";
const TODAS = "Todas";

// --- Referencias al DOM -----------------------------------------------------
const contFiltros = document.querySelector("#filtros");
const grilla = document.querySelector("#grilla");
const estado = document.querySelector("#estado");
const plantilla = document.querySelector("#tpl-producto");

// Referencias de los retos adicionales
const inputBuscador = document.querySelector("#buscador");
const selectOrden = document.querySelector("#orden");
const checkDisponibles = document.querySelector("#solo-disponibles");

// Referencias del modal de detalle
const modal = document.querySelector("#modal-detalle");
const btnCerrarModal = modal.querySelector(".modal__cerrar");

// --- Estado de la aplicación ------------------------------------------------
let productos = [];
let categoriaActiva = decodeURIComponent(location.hash.slice(1)) || TODAS;
let textoBusqueda = "";
let ordenActual = "defecto";
let soloDisponibles = false;

// Formato de moneda peruana: S/ 89.90
const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

// --- 1. Cargar los datos desde el archivo JSON ------------------------------
async function cargarProductos() {
  const respuesta = await fetch(RUTA_DATOS);
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${RUTA_DATOS} (HTTP ${respuesta.status})`);
  }

  const datos = await respuesta.json();
  if (!Array.isArray(datos)) {
    throw new Error("El archivo JSON debe contener un arreglo de productos");
  }

  return datos;
}

// --- 2. Generar los botones de filtro ---------------------------------------
function obtenerCategorias(lista) {
  return [TODAS, ...new Set(lista.map((p) => p.categoria))];
}

function renderizarFiltros(categorias) {
  const fragmento = document.createDocumentFragment();

  categorias.forEach((cat) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filtro";
    boton.dataset.categoria = cat;

    const total =
      cat === TODAS
        ? productos.length
        : productos.filter((p) => p.categoria === cat).length;

    boton.textContent = `${cat} (${total})`;
    boton.setAttribute("aria-pressed", String(cat === categoriaActiva));
    fragmento.append(boton);
  });

  contFiltros.replaceChildren(fragmento);
}

// --- 3. Crear una tarjeta a partir de un producto ---------------------------
function crearTarjeta(p) {
  const nodo = plantilla.content.cloneNode(true);
  const tarjeta = nodo.querySelector(".tarjeta");
  const cuerpo = nodo.querySelector(".tarjeta__cuerpo");
  const img = nodo.querySelector("img");
  const etiqueta = nodo.querySelector(".etiqueta");

  img.src = p.imagen;
  img.alt = p.nombre;
  img.onerror = () => {
    img.onerror = null;
    img.src = "img/sin-imagen.jpg";
  };

  nodo.querySelector(".btn-info").dataset.id = p.id;
  nodo.querySelector(".tarjeta__categoria").textContent = p.categoria;
  nodo.querySelector(".tarjeta__nombre").textContent = p.nombre;
  nodo.querySelector(".tarjeta__descripcion").textContent = p.descripcion;
  nodo.querySelector(".tarjeta__precio").textContent = soles.format(p.precio);
  nodo.querySelector(".tarjeta__porciones").textContent =
    p.porciones > 1 ? `${p.porciones} porciones` : "1 unidad";

  if (p.stock === 0) {
    etiqueta.textContent = "Agotado";
    etiqueta.classList.add("etiqueta--agotado");
    etiqueta.hidden = false;
    tarjeta.classList.add("tarjeta--agotado");
  } else if (p.destacado) {
    etiqueta.textContent = "Favorito";
    etiqueta.hidden = false;
  }

  // Botón integrado para agregar al carrito
  const btnAgregar = document.createElement("button");
  btnAgregar.type = "button";
  btnAgregar.className = "mishky-add-btn";
  btnAgregar.textContent = p.stock === 0 ? "Sin stock" : "Agregar al pedido";
  btnAgregar.disabled = p.stock === 0;

  btnAgregar.addEventListener("click", () => {
    agregarProductoMishky(p.nombre, p.precio);
    btnAgregar.textContent = "✓ Agregado";
    setTimeout(() => {
      btnAgregar.textContent = "Agregar al pedido";
    }, 900);
  });

  cuerpo.appendChild(btnAgregar);

  return nodo;
}

// --- 4. Renderizar la lista filtrada y ordenada -----------------------------
function renderizarCatalogo() {
  let filtrados =
    categoriaActiva === TODAS
      ? productos
      : productos.filter((p) => p.categoria === categoriaActiva);

  if (textoBusqueda !== "") {
    filtrados = filtrados.filter((p) =>
      p.nombre.toLowerCase().includes(textoBusqueda)
    );
  }

  if (soloDisponibles) {
    filtrados = filtrados.filter((p) => p.stock > 0);
  }

  const lista =
    ordenActual === "defecto"
      ? filtrados
      : [...filtrados].sort((a, b) =>
          ordenActual === "asc" ? a.precio - b.precio : b.precio - a.precio
        );

  if (lista.length === 0) {
    grilla.replaceChildren();
    estado.textContent = "No hay productos que coincidan con tu búsqueda.";
    return;
  }

  const fragmento = document.createDocumentFragment();
  lista.forEach((p) => fragmento.append(crearTarjeta(p)));
  grilla.replaceChildren(fragmento);

  const texto =
    categoriaActiva === TODAS ? "en total" : `en «${categoriaActiva}»`;
  estado.textContent = `Mostrando ${lista.length} productos ${texto}.`;
}

// --- 5. Delegación de eventos y escuchadores de retos -----------------------
contFiltros.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".filtro");
  if (!boton || boton.dataset.categoria === categoriaActiva) return;

  categoriaActiva = boton.dataset.categoria;
  contFiltros.querySelectorAll(".filtro").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === boton));
  });

  history.replaceState(null, "", "#" + encodeURIComponent(categoriaActiva));
  renderizarCatalogo();
});

inputBuscador.addEventListener("input", () => {
  textoBusqueda = inputBuscador.value.trim().toLowerCase();
  renderizarCatalogo();
});

selectOrden.addEventListener("change", () => {
  ordenActual = selectOrden.value;
  renderizarCatalogo();
});

checkDisponibles.addEventListener("change", () => {
  soloDisponibles = checkDisponibles.checked;
  renderizarCatalogo();
});

// --- 6. Modal de descripción detallada por producto -------------------------
function abrirDetalleProducto(producto) {
  const modalImg = document.querySelector("#modal-img");
  const modalEtiqueta = document.querySelector("#modal-etiqueta");

  modalImg.src = producto.imagen;
  modalImg.alt = producto.nombre;
  modalImg.onerror = () => {
    modalImg.onerror = null;
    modalImg.src = "img/sin-imagen.jpg";
  };

  document.querySelector("#modal-categoria").textContent = producto.categoria;
  document.querySelector("#modal-titulo").textContent = producto.nombre;
  document.querySelector("#modal-descripcion").textContent =
    producto.descripcion;
  document.querySelector("#modal-porciones").textContent =
    producto.porciones > 1 ? `${producto.porciones} porciones` : "1 unidad";
  document.querySelector("#modal-stock").textContent =
    producto.stock > 0
      ? `${producto.stock} unidades disponibles`
      : "Agotado por hoy";
  document.querySelector("#modal-precio").textContent = soles.format(
    producto.precio
  );

  modalEtiqueta.className = "etiqueta";
  if (producto.stock === 0) {
    modalEtiqueta.textContent = "Agotado";
    modalEtiqueta.classList.add("etiqueta--agotado");
    modalEtiqueta.hidden = false;
  } else if (producto.destacado) {
    modalEtiqueta.textContent = "Favorito";
    modalEtiqueta.hidden = false;
  } else {
    modalEtiqueta.hidden = true;
  }

  modal.showModal();
}

grilla.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-info");
  if (!boton) return;

  const idProducto = Number(boton.dataset.id);
  const producto = productos.find((p) => p.id === idProducto);
  if (producto) abrirDetalleProducto(producto);
});

btnCerrarModal.addEventListener("click", () => modal.close());

modal.addEventListener("click", (evento) => {
  if (evento.target === modal) modal.close();
});

// --- 7. Carrito de Pedidos --------------------------------------------------
let carritoMishky = JSON.parse(localStorage.getItem("mishky_carrito")) || [];

const cartOverlay = document.getElementById("mishky-cart-overlay");
const cartItemsContainer = document.getElementById("mishky-cart-items");
const cartCountBadge = document.getElementById("mishky-cart-count");
const cartTotalEl = document.getElementById("mishky-cart-total");

function guardarYRenderizarCarrito() {
  localStorage.setItem("mishky_carrito", JSON.stringify(carritoMishky));
  const totalUnidades = carritoMishky.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carritoMishky.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  if (cartCountBadge) cartCountBadge.textContent = totalUnidades;
  if (cartTotalEl) cartTotalEl.textContent = soles.format(totalPrecio);

  if (!cartItemsContainer) return;

  if (carritoMishky.length === 0) {
    cartItemsContainer.innerHTML =
      '<p style="text-align:center;color:#7a6f68;margin-top:30px;">Tu carrito está vacío.</p>';
    return;
  }

  cartItemsContainer.innerHTML = carritoMishky
    .map(
      (item, idx) => `
      <div class="mishky-cart-item">
        <div>
          <strong>${item.nombre}</strong>
          <div style="font-size:13px;color:#7a6f68;">${soles.format(item.precio)} c/u</div>
        </div>
        <div class="mishky-qty-controls">
          <button type="button" onclick="cambiarCantidadMishky(${idx}, -1)">-</button>
          <span style="margin:0 6px;">${item.cantidad}</span>
          <button type="button" onclick="cambiarCantidadMishky(${idx}, 1)">+</button>
        </div>
      </div>
    `
    )
    .join("");
}

window.cambiarCantidadMishky = (index, delta) => {
  carritoMishky[index].cantidad += delta;
  if (carritoMishky[index].cantidad <= 0) carritoMishky.splice(index, 1);
  guardarYRenderizarCarrito();
};

function agregarProductoMishky(nombre, precio) {
  const existente = carritoMishky.find((p) => p.nombre === nombre);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carritoMishky.push({ nombre, precio, cantidad: 1 });
  }
  guardarYRenderizarCarrito();
}

document.getElementById("mishky-cart-toggle")?.addEventListener("click", () => {
  cartOverlay?.classList.add("activo");
});

document.getElementById("mishky-cart-close")?.addEventListener("click", () => {
  cartOverlay?.classList.remove("activo");
});

cartOverlay?.addEventListener("click", (e) => {
  if (e.target === cartOverlay) cartOverlay.classList.remove("activo");
});

document.getElementById("mishky-cart-clear")?.addEventListener("click", () => {
  carritoMishky = [];
  guardarYRenderizarCarrito();
});

document.getElementById("mishky-cart-confirm")?.addEventListener("click", () => {
  if (carritoMishky.length === 0) {
    alert("Agrega al menos un producto antes de confirmar.");
    return;
  }
  alert("¡Gracias por tu pedido en Pastelería Mishky! Nos pondremos en contacto contigo.");
  carritoMishky = [];
  guardarYRenderizarCarrito();
  cartOverlay?.classList.remove("activo");
});

// --- 8. Modal de Contacto ---------------------------------------------------
(() => {
  const contactModal = document.getElementById("mishky-contact-modal");
  const contactForm = document.getElementById("mishky-contact-form");
  const contactFeedback = document.getElementById("mishky-contact-feedback");

  document.querySelectorAll('a[href="#contacto"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (contactFeedback) contactFeedback.textContent = "";
      contactModal?.classList.add("activo");
    });
  });

  document.getElementById("mishky-contact-close")?.addEventListener("click", () => {
    contactModal?.classList.remove("activo");
  });

  contactModal?.addEventListener("click", (e) => {
    if (e.target === contactModal) contactModal.classList.remove("activo");
  });

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("mishky-c-nombre").value.trim();
    const email = document.getElementById("mishky-c-email").value.trim();
    const mensaje = document.getElementById("mishky-c-mensaje").value.trim();

    if (!nombre || !email.includes("@") || !mensaje) {
      contactFeedback.style.color = "#b3261e";
      contactFeedback.textContent =
        "Por favor completa tu nombre, un correo válido y tu mensaje.";
      return;
    }

    contactFeedback.style.color = "#2e7d32";
    contactFeedback.textContent = `¡Gracias, ${nombre}! Recibimos tu solicitud y te responderemos pronto.`;
    contactForm.reset();
    setTimeout(() => contactModal?.classList.remove("activo"), 1800);
  });
})();

// --- 9. Inicio --------------------------------------------------------------
async function iniciar() {
  estado.textContent = "Cargando productos...";
  guardarYRenderizarCarrito();

  try {
    productos = await cargarProductos();
    const categorias = obtenerCategorias(productos);

    if (!categorias.includes(categoriaActiva)) {
      categoriaActiva = TODAS;
    }

    renderizarFiltros(categorias);
    renderizarCatalogo();
  } catch (error) {
    console.error(error);
    estado.textContent =
      "No se pudo cargar el catálogo. Verifique que abrió la página con Live Server.";
    estado.classList.add("estado--error");
  } finally {
    grilla.setAttribute("aria-busy", "false");
  }
}

iniciar();
