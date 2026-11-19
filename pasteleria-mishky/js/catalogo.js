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
// Reto 3 · Recordar la categoría en la URL (ej. catalogo.html#Tortas)
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
  // Set elimina repetidos y conserva el orden de aparición
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
  const img = nodo.querySelector("img");
  const etiqueta = nodo.querySelector(".etiqueta");

  img.src = p.imagen;
  img.alt = p.nombre;
  img.onerror = () => {
    img.onerror = null; // evita un bucle si también falta la imagen de respaldo
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

  return nodo;
}

// --- 4. Renderizar la lista filtrada y ordenada -----------------------------
function renderizarCatalogo() {
  // Filtro base por categoría
  let filtrados =
    categoriaActiva === TODAS
      ? productos
      : productos.filter((p) => p.categoria === categoriaActiva);

  // Reto 2 · Buscador por nombre combinado con la categoría activa
  if (textoBusqueda !== "") {
    filtrados = filtrados.filter((p) =>
      p.nombre.toLowerCase().includes(textoBusqueda)
    );
  }

  // Reto 4 · Solo disponibles (oculta productos con stock 0)
  if (soloDisponibles) {
    filtrados = filtrados.filter((p) => p.stock > 0);
  }

  // Reto 1 · Ordenar por precio con sort() antes de renderizar
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

  // Reto 3 · Actualizar la URL sin recargar la página
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

// --- 7. Inicio --------------------------------------------------------------
async function iniciar() {
  estado.textContent = "Cargando productos...";
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

// === LÓGICA DEL MODAL DE CONTACTO ===
(() => {
  const modal = document.getElementById('mishky-contact-modal');
  const form = document.getElementById('mishky-contact-form');
  const feedback = document.getElementById('mishky-contact-feedback');

  document.querySelectorAll('a').forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'contacto' || link.getAttribute('href')?.includes('contacto')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        feedback.textContent = '';
        modal.classList.add('activo');
      });
    }
  });

  document.getElementById('mishky-contact-close')?.addEventListener('click', () => modal.classList.remove('activo'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('activo'); });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('mishky-c-nombre').value.trim();
    const email = document.getElementById('mishky-c-email').value.trim();
    const mensaje = document.getElementById('mishky-c-mensaje').value.trim();

    if (!nombre || !email.includes('@') || !mensaje) {
      feedback.style.color = '#b3261e';
      feedback.textContent = 'Por favor completa tu nombre, un correo válido y tu mensaje.';
      return;
    }

    feedback.style.color = '#2e7d32';
    feedback.textContent = `¡Gracias, ${nombre}! Recibimos tu solicitud y te responderemos pronto.`;
    form.reset();
    setTimeout(() => modal.classList.remove('activo'), 1800);
  });
})();
