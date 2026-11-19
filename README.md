# 🍰 Pastelería Mishky — Catálogo Dinámico

Aplicación web desarrollada para el laboratorio de la **Semana 11** del curso **Desarrollo de Aplicaciones Web I** (Ciclo IV). Consiste en un catálogo interactivo para la pastelería artesanal **Mishky** (Cusco), diseñado para explorar, buscar y filtrar productos de forma dinámica en el navegador.

🔗 **Demo en vivo:** [Abrir catálogo en GitHub Pages](https://piero-n22.github.io/Semana11Web/pasteleria-mishky/catalogo.html)

---

## ✨ Características principales

* **Catálogo dinámico (16 productos):** Carga automática de información e imágenes desde una fuente de datos en formato JSON.
* **Filtros por categoría:** Navegación rápida entre *Todas*, *Tortas*, *Postres peruanos*, *Panes y bollería* y *Galletas y bocaditos*.
* **Buscador en tiempo real:** Búsqueda instantánea por nombre del producto.
* **Ordenamiento y disponibilidad:** Selector de orden y filtro de verificación (*Solo disponibles*).
* **Etiquetas de estado:** Identificación visual de productos destacados (*Favorito*) y sin stock (*Agotado*).

---

## 🛠️ Tecnologías utilizadas

* **HTML5:** Estructura semántica del catálogo.
* **CSS3:** Diseño responsivo, estilos de tarjetas y etiquetas de estado.
* **JavaScript:** Lógica de renderizado dinámico, búsqueda, filtrado y ordenamiento.
* **JSON:** Almacenamiento estructurado de los productos.

---

## 📁 Estructura del proyecto

```text
Semana11Web/
└── pasteleria-mishky/
    ├── catalogo.html
    ├── LEEME.txt
    ├── css/
    ├── data/
    │   └── productos.json
    ├── img/
    │   └── productos/
    └── js/
        └── catalogo.js
