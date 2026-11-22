# Investigación: perchero interactivo y prendas en 3D

> Noviembre de 2026. Se basa en los dos videos que mandó el fundador.
> Los prototipos están en la rama `claude/lucid-cray-hw3e2f`. La versión 1 quedó guardada en la rama `respaldo-v1`.

---

## 1. Video 1: la ropa en 3D (cuenta wilhelm.grehl, "Process of a 3D hoodie and sweatpants")

### Qué es lo que se ve
Es **diseño de moda en 3D**, hecho con programas como **CLO3D** o **Marvelous Designer** (los dos son de la misma empresa). El proceso que muestra el video es este:
1. Se dibujan los **moldes** (las piezas planas de tela), igual que en un taller de confección.
2. El programa **cose** las piezas alrededor de un **avatar**. Las líneas de colores del video son las costuras virtuales y los "abanicos" de colores son la tela uniéndose.
3. La tela se **simula** como tela real, con peso, caída y arrugas.
4. Se le pone color y textura, y se **renderiza** (como una foto).

### ¿Sirve para que la gente se mida la prenda?
**Sí, es justo para eso.** CLO3D:
- Tiene **mapas de ajuste** (*fit map*, *strain map*) que pintan dónde aprieta la prenda y dónde le sobra.
- Maneja **tallas** (*grading*): el mismo molde en S, M, L, etc.
- Ajusta el **avatar** a las medidas que uno le dé.
- **Exporta a la web** en formato **GLB** (glTF), que se puede mostrar en la página.
- Tiene **CLO-SET**, que permite incrustar un visor 3D en una página con un código (iframe). Es un plan de pago.

### Costos (noviembre de 2026)
| Opción | Precio aproximado | Para qué sirve |
|---|---|---|
| CLO3D licencia individual | USD 50/mes o USD 450/año | Diseñar los moldes y simular. Prueba gratis de 14 días. Para estudiantes: USD 25/mes |
| Marvelous Designer personal | USD 39/mes o USD 280/año | Más enfocado en animación y renders, menos en producción |
| Freelancer en Fiverr (CLO3D) | USD 50 a 200 por prenda | Te hace el 3D de cada prenda si le das los moldes o fotos y medidas |
| IA "foto a 3D" (Meshy, Tripo, Hunyuan3D) | Alrededor de USD 0,30 por modelo | Rápido y barato, pero **las medidas no son exactas** (inventa lo que no se ve en la foto). Sirve para ver la prenda girando, no para medirla |
| Escanear con el celular (Polycam, KIRI Engine) | Gratis o una suscripción | La prenda en un maniquí, fotografiada desde todos los lados. Se ve real, pero no saca cada talla |

### Lo que construimos (prototipo, `/probador`)
Un **probador 3D** que ya funciona:
- La persona escoge **hombre o mujer**, mueve la **altura** y el **peso** y, si quiere, pone sus medidas exactas.
- Se arma un **maniquí con esas medidas** y se le pone la prenda en la **talla escogida**, usando las **medidas reales de la guía de tallas**.
- **Recomienda la talla** y explica cada zona: "Pecho +21 cm: ancha, como se diseñó", "Largo: te llega a la cadera".
- Tiene **mapa de ajuste por colores** (rojo aprieta, verde cómoda, azul holgada), igual a los de CLO3D.
- Se gira con el dedo o con el mouse y tiene vista de "la prenda" o del "cuerpo entero".
- **Cuesta $0**: no usa servicios de pago. El 3D se carga aparte (unos 150 KB) para que la página abra rápido.

**Su límite:** la forma de la prenda es **genérica** (la arma el código), no es el molde exacto de cada prenda. Las medidas sí son las reales de la guía.

**El siguiente paso para que quede idéntico al video:** cuando una prenda tenga su modelo en CLO3D, se exporta en GLB y se carga en el probador en lugar de la forma genérica. El mapa de ajuste y las medidas siguen funcionando igual.

---

## 2. Video 2: el perchero (cuenta w.wearebrand, "Websites in 2026", tienda de demostración "SNUG")

### Qué es lo que se ve
1. Un **riel** con prendas **colgadas de lado**, como en una tienda física.
2. Al pasar el mouse, la prenda **gira y queda de frente**, y las vecinas **se corren y se mecen**.
3. Al hacer clic, la prenda **sale al centro**, el fondo se **desenfoca** y aparecen el **nombre**, un botón **FRONT/BACK** y **etiquetas de color colgando** (BLACK, SAND).
4. Al tocar otra etiqueta, la prenda **cambia de color con un efecto de pintura que gotea**.
5. FRONT/BACK **voltea la prenda** para ver la espalda.
6. Abajo hay una **cinta verde que corre** con mensajes de la marca.

**Cómo está hecho:** son **fotos reales de cada prenda colgada en su gancho**, con el fondo quitado, más animaciones en la página. No es 3D de verdad. No pudimos abrir la página original desde aquí: la dirección no cargaba.

### Lo que construimos (prototipo, `/perchero`)
Todo lo del video, adaptado al estilo MONOIR:
- **Un perchero por categoría**: buzos, camisetas, pantalones e interior.
- **Computador:** al pasar el mouse, la prenda gira de frente y las vecinas se corren y se mecen como ropa de verdad.
- **Celular:** el perchero **se desliza con el dedo**, la prenda del centro queda de frente y la ropa se mece según la velocidad.
- **Vista de cerca** con fondo desenfocado, **etiquetas de color colgando** (se mecen al pasar el mouse), **cambio de color con efecto de goteo**, **frente/espalda** con giro, **tallas** y **agregar al carrito**.
- Enlaces a "Ver detalles" y a "Medítela en 3D".
- Funciona con el teclado y respeta a quien desactiva las animaciones en su celular.

**Ahora usa los dibujos de las prendas.** Cuando haya fotos, la foto reemplaza el dibujo sin cambiar nada más.

### Cómo tomar las fotos para que quede igual al video
Para cada prenda y cada color:
1. **Gancho:** de madera para camisetas y buzos, de pinzas para pantalones. Siempre el mismo.
2. **Fondo:** una pared blanca o lisa. Después se quita el fondo (con Canva, remove.bg o lo hacemos nosotros).
3. **Luz:** luz de día cerca de una ventana, sin sol directo, o dos lámparas LED a los lados. Siempre la misma.
4. **Celular:** en un trípode, a la altura del pecho de la prenda y a 1,5 m. **No mover el trípode** entre fotos.
5. **Tres fotos por prenda:** **frente**, **espalda** y **de lado** (girada 90°).
6. **Formato:** foto vertical. El gancho debe tocar el borde de arriba y la prenda debe quedar centrada.

---

## 3. Alternativas más baratas para "medirse la prenda"
- **Comparar con una prenda que ya tenés** (como hace Virtusize): la persona mide una camiseta suya y la página le muestra la diferencia con la talla que quiere. Es barato y muy exacto. Se puede agregar al probador.
- **Apps de recomendación de talla para Shopify** (USD 3 a 300 al mes): no aplican, porque MONOIR no está en Shopify.
- **Probador con IA sobre la foto de la persona** (FASHN, unos USD 0,075 por imagen): se ve llamativo, pero no mide. Puede servir más adelante para campañas.

---

## Fuentes
- CLO3D, planes: https://clo3d.com/en/plans/individual
- CLO3D, exportar glTF/GLB: https://support.clo3d.com/hc/en-us/articles/360051525034-glTF-2-0-GLTF-GLB-File
- CLO3D, mapas de ajuste: https://support.clo3d.com/hc/en-us/articles/360000436368-Garment-Fit-Maps
- CLO3D, tallas (grading): https://support.clo3d.com/hc/en-us/articles/360000742668-Grading
- CLO-SET, incrustar el visor: https://support.clo-set.com/hc/en-us/articles/45303129473305-Embed-on-Website
- Marvelous Designer, licencias: https://support.marvelousdesigner.com/hc/en-us/articles/47358269350041
- Freelancers CLO3D en Fiverr (ejemplo): https://fiverr.com/apparel_design/develop-digital-garments-in-clo3d-and-marvelous-designer
- Comparación de IA foto a 3D: https://medium.com/ideas-with-wings/best-ai-3d-model-generators-in-2026-tripo-ai-vs-meshy-rodin-kaedim-and-more-7eea7b05eb11
- Escaneo de ropa con celular (Polycam): https://medium.com/queenly-engineering/high-resolution-3d-models-of-formal-dresses-using-lidar-and-photogrammetry-efe559041041
- Virtusize, comparar con tu prenda: https://www.zalora.com.ph/virtusize
- Apps de probador virtual en Shopify: https://apps.shopify.com/sizebay-fit-finder
- FASHN, precio por imagen: https://help.fashn.ai/plans-and-pricing/api-pricing
- Fotografía de producto en 360°: https://en.wikipedia.org/wiki/360_product_photography
