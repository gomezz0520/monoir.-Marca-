// ─────────────────────────────────────────────────────────────
// Ajustes generales de la tienda. Los marcados PENDIENTE hay que
// confirmarlos con el fundador antes del lanzamiento.
// ─────────────────────────────────────────────────────────────
export const tienda = {
  nombre: 'MONOIR',
  // PENDIENTE: número real de WhatsApp (formato 57 + celular, sin espacios ni +).
  whatsapp: '573000000000',
  // PENDIENTE: usuarios reales de redes.
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/',
  // Envío gratis desde este valor (recomendado en el brief).
  envioGratisDesde: 180000,
  // PENDIENTE: valor del envío en Medellín y el Valle de Aburrá.
  envioMedellin: 10000,
  // Hora límite (24 h) para entrega el mismo día.
  horaCorte: 14,
  // PENDIENTE: fecha y hora real del primer drop (hora de Colombia).
  drop: {
    nombre: 'Drop 01 — Ojos en la oscuridad',
    fecha: '2026-12-12T20:00:00-05:00',
    unidades: 50,
  },
};

export const formatoCOP = (n: number) =>
  '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

export const linkWhatsApp = (mensaje: string) =>
  `https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`;
