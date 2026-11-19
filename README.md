# MONOIR

Tienda web de MONOIR, marca de streetwear de Medellín. Dirección visual: **"NOCHE"**.

- Brief creativo: [BRIEF.md](BRIEF.md)
- Reglas del proyecto: [CLAUDE.md](CLAUDE.md)

## Dónde se cambia cada cosa
| Qué | Archivo |
|---|---|
| Productos, precios, tallas, medidas | `src/data/productos.ts` |
| WhatsApp, redes, envío gratis, fecha del drop | `src/data/config.ts` |
| Colores y letras | `src/styles/global.css` |
| Logo del felino | `src/components/Felino.astro` |

## Comandos
```bash
npm install
```
```bash
npm run dev
```
```bash
npm run build
```

## Publicar en Vercel
Importá el repositorio en vercel.com. Vercel detecta Astro solo, no hay que configurar nada.
