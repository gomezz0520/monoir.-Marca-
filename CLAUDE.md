# CLAUDE.md — MONOIR

Tienda web de **MONOIR**, marca de streetwear de Medellín. El brief completo está en **[BRIEF.md](BRIEF.md)**: léelo antes de diseñar o escribir textos.

## Cómo trabajar con el fundador
- Habla siempre en **español sencillo**. El fundador no tiene experiencia en diseño ni en programación.
- Cuando algo sea técnico, explícalo con ejemplos y **da una recomendación concreta**.
- Antes de decisiones grandes (diseño, estructura, funciones nuevas), muestra opciones y espera su aprobación.
- **Estado actual:** el fundador eligió la **dirección A — "NOCHE"**. La versión 1 está construida con **Astro** (sitio estático). Las prendas se muestran con ilustraciones SVG (`src/components/Prenda.astro`) hasta que haya fotos reales; al agregar `fotos` en un producto, estas reemplazan la ilustración.
- Datos editables: `src/data/productos.ts` (catálogo) y `src/data/config.ts` (WhatsApp, redes, envío, drop). Los valores marcados `PENDIENTE` son de ejemplo.
- Paleta NOCHE: negro `#0b0b0c`, hueso `#f2efe9`, blanco `#fafaf7`, humo `#8a8a8e`, ámbar `#e8a23a` (sobre fondo claro, para texto usar `#8f5a0c`). Letras: Bodoni Moda (marca), Anton (títulos), Inter (texto).

## Reglas de marca (no negociables)
- **Nunca mostrar productos ni logos de marcas de terceros** (Nike, Boss, CK, Rolex, etc.). La tienda vende **MONOIR marca blanca** y, más adelante, **MONOIR ORIGINAL** (básicos y drops propios).
- Personalidad: **rebelde, exclusiva y divertida**. Nunca infantil, corporativa ni copia de otra marca.
- Colores base **negro y blanco**, con **un solo acento** (según la dirección elegida) usado muy poco.
- La página **arranca oscura** (inicio) y **se vuelve clara** en el catálogo.
- Tipografía: **nombre en serif elegante** y **títulos y botones en letra condensada gruesa**.
- Logo: felino abstracto de **una sola línea**; versión especial con **las dos O de MONOIR como ojos**.

## Tono de los textos
- **Voseo paisa** ("Encontrá tu talla", "¿Sabés tu talla?").
- Humor de parche, tipo Mattelsa. Español con palabras streetwear en inglés (drop, sold out, new in).
- Muletilla: **"mi niño" / "mi niña"**, solo cuando el texto va dirigido a alguien. En botones y textos generales, frases sin género.

## Producto y web
- **Versión 1:** inicio, catálogo con filtros, producto con vista de frente y espalda, guía de tallas por producto, carrito, botón flotante de WhatsApp, historia "El Mono", "Próximo drop" con cuenta regresiva y registro, franja "Monoir en la calle" con fotos curadas.
- **Versión 2:** perchero interactivo y cuentas de cliente / fidelización. **Versión 3:** probador con cámara.
- Compra **sin cuenta**.
- **Pagos:** WhatsApp y contraentrega/Nequi desde el lanzamiento; pasarela Wompi o Bold cuando la aprueben (dejar el espacio listo).
- **Entrega el mismo día** en Medellín y el Valle de Aburrá para pedidos **antes de las 2 p. m.** Envío gratis desde un monto por definir (recomendado: $180.000).
- **Cambios:** retracto legal de 5 días hábiles. Cambio de talla o color gratis por 15 días. Boxers y medias sin cambio.
- Precios en **COP** con formato `$79.000`.

## Requisitos técnicos
- Página **a medida** en este repositorio, sin plataforma con mensualidad. Hosting en **Vercel** (dominio de Vercel por ahora).
- **Velocidad ante todo** (es lo que más le preocupa al fundador):
  - Pensada primero para celular.
  - Imágenes optimizadas (AVIF/WebP, tamaños responsivos, carga diferida).
  - JavaScript mínimo y pocas fuentes.
- **Compra corta:** el menor número de pasos y campos posible.
- Los productos se guardan en una lista de datos sencilla y fácil de editar, separada del diseño.
- Avisos legales: política de datos personales (Habeas Data, Ley 1581) para el registro de drops y los pedidos; política de cambios.

## Recordatorios pendientes para el fundador
Recuérdale estos puntos cuando sea oportuno:
- Comprar el **dominio** y crear el **correo** de la marca.
- Inscribirse en **Wompi o Bold**.
- Definir los **precios** finales (el envío ya está: $10.000, gratis desde $180.000).
- Planear la **versión 2: cuentas de cliente y fidelización**.
- Fijar la **fecha de lanzamiento**.
