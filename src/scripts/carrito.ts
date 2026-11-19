// Carrito guardado en el navegador del cliente (sin cuentas, sin servidor).
export interface Item {
  slug: string; nombre: string; talla: string; precio: number; cantidad: number;
}
const CLAVE = 'monoir-carrito';

export function leer(): Item[] {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; }
}
function guardar(items: Item[]) {
  try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* modo privado */ }
  window.dispatchEvent(new CustomEvent('carrito:cambio', { detail: items }));
}
export function agregar(item: Omit<Item, 'cantidad'>, cantidad = 1) {
  const items = leer();
  const existente = items.find((i) => i.slug === item.slug && i.talla === item.talla);
  if (existente) existente.cantidad += cantidad; else items.push({ ...item, cantidad });
  guardar(items);
}
export function cambiarCantidad(slug: string, talla: string, cantidad: number) {
  let items = leer();
  const it = items.find((i) => i.slug === slug && i.talla === talla);
  if (!it) return;
  it.cantidad = cantidad;
  if (cantidad <= 0) items = items.filter((i) => i !== it);
  guardar(items);
}
export function vaciar() { guardar([]); }
export const contar = (items = leer()) => items.reduce((n, i) => n + i.cantidad, 0);
export const subtotal = (items = leer()) => items.reduce((n, i) => n + i.precio * i.cantidad, 0);
export const cop = (n: number) => '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
