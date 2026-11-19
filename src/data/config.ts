// ─────────────────────────────────────────────────────────────
// Ajustes generales de la tienda. Los marcados PENDIENTE hay que
// confirmarlos con el fundador antes del lanzamiento.
// ─────────────────────────────────────────────────────────────
export const tienda = {
  nombre: 'MONOIR',
  // WhatsApp de la tienda (57 + celular, sin espacios ni +).
  whatsapp: '573218294282',
  // Redes de la marca.
  instagram: 'https://www.instagram.com/monoir.mde/',
  tiktok: 'https://www.tiktok.com/@monoir.mde',
  // Envío gratis desde este valor (recomendado en el brief).
  envioGratisDesde: 180000,
  // Valor del envío en Medellín y el Valle de Aburrá.
  envioMedellin: 10000,
  // Hora límite (24 h) para entrega el mismo día.
  horaCorte: 14,
  // PENDIENTE: fecha y hora del primer drop (hora de Colombia), ej. '2026-12-12T20:00:00-05:00'.
  // Mientras esté vacía, la página muestra "Fecha muy pronto" en vez de la cuenta regresiva.
  drop: {
    nombre: 'Drop 01 — Ojos en la oscuridad',
    fecha: '',
    unidades: 50,
  },
};

export const formatoCOP = (n: number) =>
  '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

export const linkWhatsApp = (mensaje: string) =>
  `https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`;
