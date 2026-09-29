# Casa Pinto Restaurant

Sitio estático listo para GitHub y Vercel. El catálogo se obtiene del CSV publicado en Google Sheets (`src/catalog.js`). El archivo `catalogo-respaldo.csv` permite mostrar la carta cuando la conexión con Google falla; en ese caso la página indica que está mostrando una copia y permite reintentar. El pedido se envía a +56 9 2985 9920.

## Desarrollo y publicación

```bash
npm run build
npm test
npm run preview
```

Abre `http://localhost:4173`. Sube esta carpeta a un repositorio de GitHub e impórtalo en Vercel. `vercel.json` configura `npm run build` y la carpeta `dist` como salida. No requiere paquetes de npm ni variables de entorno.

## Actualizar la carta

Edita la hoja publicada con las columnas `id`, `categoría`, `nombre`, `descripción`, `opciones/tamaños`, `precio`, `stock`, `foto` y `observaciones`. Al abrir la web se lee la hoja; se vuelve a consultar cada cinco minutos y mediante el botón «Actualizar carta». `stock=sí` habilita la compra; cualquier otro valor la bloquea. Una URL pública en `foto` muestra el marco y la imagen en esa tarjeta; si falla, desaparece el marco.

Para precios distintos según tamaño, deja una fila por variante como las papas fritas. El campo de opciones separadas por `|` presenta un selector antes de añadir al carrito. Las indicaciones se agregan al pedido de WhatsApp.

## Material gráfico

Las cuatro fotos y el logo fueron entregados por el usuario. Están copiados en `assets/` y no dependen de servicios internos. Las fotos de la portada y secciones representan la experiencia del local; ninguna se asignó a un producto concreto sin foto propia.
