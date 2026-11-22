// ─────────────────────────────────────────────────────────────
// Perchero interactivo de MONOIR.
// Computador: al pasar el mouse la prenda voltea de frente y las vecinas
// se corren y se mecen. Celular: el perchero se desliza y la del centro
// mira de frente. Clic o toque: vista de cerca con etiquetas de color,
// frente/espalda y tallas.
// ─────────────────────────────────────────────────────────────
import { agregar, cop } from './carrito';

interface Datos {
  slug: string; nombre: string; precio: number; color: { nombre: string; hex: string };
  tallas: string[]; modelo: string; proximamente: boolean; ajuste: string | null;
  linea: string; edicion: number | null; interior: boolean;
}

const datos: Record<string, Datos> = JSON.parse(document.getElementById('datos-perchero')!.textContent || '{}');
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const conMouse = matchMedia('(hover: hover) and (pointer: fine)');
const GIRO_LADO = 76; // grados: la prenda colgada de lado

// ── Balanceo (física de resorte, solo corre mientras algo se mueve) ──
const pendulos = new Map<HTMLElement, { a: number; v: number; f: number }>();
let animando = false;
let ultimo = 0;
function empujar(el: HTMLElement | undefined, impulso: number) {
  if (!el || reducido) return;
  const p = pendulos.get(el) ?? { a: 0, v: 0, f: 0 };
  p.v += impulso;
  pendulos.set(el, p);
  arrancar();
}
function fuerza(el: HTMLElement, f: number) {
  if (reducido) return;
  const p = pendulos.get(el) ?? { a: 0, v: 0, f: 0 };
  p.f = f;
  pendulos.set(el, p);
  arrancar();
}
function arrancar() {
  if (animando) return;
  animando = true;
  ultimo = performance.now();
  requestAnimationFrame(paso);
}
function paso(t: number) {
  const dt = Math.min(0.033, (t - ultimo) / 1000);
  ultimo = t;
  let quietos = true;
  for (const [el, p] of pendulos) {
    const acc = -46 * (p.a - p.f) - 3.2 * p.v;
    p.v += acc * dt;
    p.a += p.v * dt;
    p.f *= 0.9;
    if (Math.abs(p.a) > 0.02 || Math.abs(p.v) > 0.02 || Math.abs(p.f) > 0.02) quietos = false;
    else { p.a = 0; p.v = 0; p.f = 0; }
    el.style.transform = p.a ? `rotate(${p.a.toFixed(3)}deg)` : '';
  }
  if (quietos) { animando = false; return; }
  requestAnimationFrame(paso);
}

// ── Cada perchero ──
type Perchero = { raiz: HTMLElement; items: HTMLButtonElement[]; activo: number; activar: (i: number) => void };
const todos: Perchero[] = [];

document.querySelectorAll<HTMLElement>('[data-perchero]').forEach((raiz) => {
  const fila = raiz.querySelector<HTMLElement>('[data-fila]')!;
  const items = [...raiz.querySelectorAll<HTMLButtonElement>('.colgada')];
  const nombre = raiz.querySelector<HTMLElement>('[data-nombre-activo]')!;
  const ver = raiz.querySelector<HTMLButtonElement>('[data-ver-activo]')!;
  const balanceo = (it: HTMLElement) => it.querySelector<HTMLElement>('.balanceo')!;
  const giro = (it: HTMLElement) => it.querySelector<HTMLElement>('.giro')!;
  const r: Perchero = { raiz, items, activo: -1, activar };
  todos.push(r);

  function pintarNombre(i: number) {
    if (i < 0) {
      nombre.innerHTML = conMouse.matches ? 'Pasá el mouse por el perchero' : 'Deslizá el perchero';
      ver.disabled = true;
      return;
    }
    const d = datos[items[i].dataset.slug!];
    // si el nombre ya dice el color (ej. "Jogger Cargo Oliva"), no lo repetimos
    const colorEnNombre = d.nombre.toLowerCase().includes(d.color.nombre.split(' ').pop()!.toLowerCase());
    nombre.innerHTML = `<strong></strong>${colorEnNombre ? '' : ` — ${d.color.nombre}`} · ${cop(d.precio)}`;
    nombre.querySelector('strong')!.textContent = d.nombre;
    ver.disabled = false;
  }

  // Computador: la activa voltea, las vecinas se corren y se mecen.
  function activar(i: number) {
    if (i === r.activo) return;
    const antes = r.activo;
    r.activo = i;
    const ancho = balanceo(items[0]).offsetWidth || 200; // ancho de la prenda de frente
    const slot = items[0].offsetWidth || 80; // espacio de cada gancho
    const corrida = i < 0 ? 0 : Math.max(0, (ancho * 1.05 - slot) / 2);
    items.forEach((it, j) => {
      it.classList.toggle('activa', j === i);
      const x = i < 0 || j === i ? 0 : j < i ? -corrida : corrida;
      it.style.setProperty('--empuje', `${x}px`);
      // las que se mueven reciben un empujón (las más cercanas, más fuerte)
      if (i >= 0 && j !== i) {
        const dist = Math.abs(j - i);
        empujar(balanceo(it), (j < i ? -1 : 1) * (dist === 1 ? 70 : 34) * (antes < 0 ? 1 : 0.6));
      }
    });
    if (i >= 0) empujar(balanceo(items[i]), antes < i ? 40 : -40);
    pintarNombre(i);
  }

  // Celular: la del centro mira de frente según el scroll.
  let ultimoScroll = fila.scrollLeft;
  let ultimoT = performance.now();
  let pendiente = false;
  function carrusel() {
    pendiente = false;
    const centro = fila.scrollLeft + fila.clientWidth / 2;
    const slot = items[0].offsetWidth || 1;
    let mejor = 0, mejorD = Infinity;
    items.forEach((it, j) => {
      const c = it.offsetLeft + it.offsetWidth / 2;
      const d = (c - centro) / slot;
      const a = Math.min(Math.abs(d), 1);
      giro(it).style.transform = `perspective(1100px) rotateY(${(GIRO_LADO * a).toFixed(2)}deg) scale(${(1.05 - 0.08 * a).toFixed(3)})`;
      giro(it).style.filter = `brightness(${(1 - 0.1 * a).toFixed(3)})`;
      it.style.zIndex = String(50 - Math.round(Math.abs(d) * 10));
      if (Math.abs(d) < mejorD) { mejorD = Math.abs(d); mejor = j; }
    });
    // la ropa se mece según la velocidad del deslizamiento
    const ahora = performance.now();
    const vel = (fila.scrollLeft - ultimoScroll) / Math.max(16, ahora - ultimoT);
    ultimoScroll = fila.scrollLeft; ultimoT = ahora;
    if (Math.abs(vel) > 0.05) items.forEach((it) => fuerza(balanceo(it), Math.max(-7, Math.min(7, -vel * 5))));
    if (mejor !== r.activo) {
      r.activo = mejor;
      items.forEach((it, j) => it.classList.toggle('activa', j === mejor));
      pintarNombre(mejor);
    }
  }
  const alScroll = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(carrusel); } };

  function modo() {
    const tactil = !conMouse.matches;
    raiz.classList.toggle('modo-carrusel', tactil);
    items.forEach((it) => {
      giro(it).style.transform = '';
      giro(it).style.filter = '';
      it.style.zIndex = '';
      it.style.setProperty('--empuje', '0px');
      it.classList.remove('activa');
    });
    r.activo = -1;
    if (tactil) {
      fila.addEventListener('scroll', alScroll, { passive: true });
      // arranca con la segunda prenda en el centro (se ve que hay más a los lados)
      const inicio = items[Math.min(1, items.length - 1)];
      fila.scrollLeft = inicio.offsetLeft + inicio.offsetWidth / 2 - fila.clientWidth / 2;
      carrusel();
    } else {
      fila.removeEventListener('scroll', alScroll);
      pintarNombre(-1);
    }
  }

  items.forEach((it, i) => {
    it.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && conMouse.matches) activar(i); });
    it.addEventListener('focus', () => {
      if (conMouse.matches) activar(i);
      else fila.scrollTo({ left: it.offsetLeft + it.offsetWidth / 2 - fila.clientWidth / 2, behavior: reducido ? 'auto' : 'smooth' });
    });
    it.addEventListener('click', () => {
      if (!conMouse.matches && r.activo !== i) {
        fila.scrollTo({ left: it.offsetLeft + it.offsetWidth / 2 - fila.clientWidth / 2, behavior: reducido ? 'auto' : 'smooth' });
        return;
      }
      abrir(it.dataset.slug!, it);
    });
  });
  fila.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && conMouse.matches && !document.activeElement?.closest('.colgada')) activar(-1);
  });
  ver.addEventListener('click', () => { if (r.activo >= 0) abrir(items[r.activo].dataset.slug!, items[r.activo]); });

  modo();
  conMouse.addEventListener('change', modo);
});

// ── Vista de cerca ──
const vista = document.querySelector<HTMLElement>('[data-vista]')!;
const escena = document.querySelector<HTMLElement>('[data-escena]')!;
const caja = vista.querySelector<HTMLElement>('[data-vista-prenda]')!;
const etiquetas = vista.querySelector<HTMLElement>('[data-etiquetas]')!;
const form = vista.querySelector<HTMLFormElement>('[data-vista-compra]')!;
const fsTallas = vista.querySelector<HTMLFieldSetElement>('[data-vista-tallas]')!;
const avisoTalla = vista.querySelector<HTMLElement>('[data-aviso-talla]')!;
const btnAgregar = vista.querySelector<HTMLButtonElement>('[data-vista-agregar]')!;
const btnDrop = vista.querySelector<HTMLAnchorElement>('[data-vista-drop]')!;
const lnkDetalle = vista.querySelector<HTMLAnchorElement>('[data-vista-detalle]')!;
const lnkProbador = vista.querySelector<HTMLAnchorElement>('[data-vista-probador]')!;
const botonesLado = [...vista.querySelectorAll<HTMLButtonElement>('[data-lado]')];
let actual: Datos | null = null;
let deDonde: HTMLElement | null = null;
let atras = false;
let ocupado = false;

function crearPrenda(slug: string) {
  const plantilla = document.querySelector<HTMLTemplateElement>(`template[data-plantilla="${slug}"]`)!;
  const flip = document.createElement('div');
  flip.className = 'flip' + (atras ? ' atras' : '');
  flip.append(plantilla.content.cloneNode(true));
  return flip;
}

function contraste(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.5 ? '#f2efe9' : '#0b0b0c';
}

function pintarInfo(d: Datos) {
  vista.querySelector('[data-vista-linea]')!.textContent = `${d.linea}${d.edicion ? ` · Edición de ${d.edicion}` : ''}`;
  vista.querySelector('[data-vista-nombre]')!.textContent = d.nombre;
  vista.querySelector('[data-vista-precio]')!.textContent = `${cop(d.precio)} · ${d.color.nombre}`;
  lnkDetalle.href = `/producto/${d.slug}`;
  lnkProbador.hidden = !d.ajuste;
  lnkProbador.href = `/probador?prenda=${d.slug}`;
  // tallas
  const elegida = (new FormData(form).get('talla') as string | null) ?? '';
  fsTallas.innerHTML = '<legend class="sr-only">Talla</legend>';
  for (const t of d.tallas) {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="talla" /><span></span>`;
    const inp = l.querySelector('input')!;
    inp.value = t;
    inp.checked = t === elegida || d.tallas.length === 1;
    inp.disabled = d.proximamente;
    l.querySelector('span')!.textContent = t;
    fsTallas.append(l);
  }
  avisoTalla.hidden = true;
  btnAgregar.hidden = d.proximamente;
  btnDrop.hidden = !d.proximamente;
  // etiquetas de color (otros colores de la misma prenda)
  const colores = Object.values(datos).filter((x) => x.modelo === d.modelo);
  etiquetas.innerHTML = '';
  etiquetas.hidden = colores.length < 2;
  for (const c of colores) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(c.slug === d.slug));
    b.setAttribute('aria-label', `Color ${c.color.nombre}`);
    b.innerHTML = '<span class="tag-cuerpo"></span>';
    const cuerpo = b.querySelector<HTMLElement>('.tag-cuerpo')!;
    cuerpo.textContent = c.color.nombre;
    cuerpo.style.setProperty('--c', c.color.hex);
    cuerpo.style.setProperty('--t', contraste(c.color.hex));
    b.addEventListener('click', () => cambiarColor(c.slug));
    etiquetas.append(b);
  }
}

function rectDe(el: HTMLElement) { return el.getBoundingClientRect(); }
function itemDe(slug: string) { return document.querySelector<HTMLElement>(`.colgada[data-slug="${slug}"]`); }

function abrir(slug: string, desde: HTMLElement) {
  if (ocupado) return;
  const d = datos[slug];
  if (!d) return;
  actual = d;
  deDonde = desde;
  atras = false;
  botonesLado.forEach((b) => { const on = b.dataset.lado === 'frente'; b.classList.toggle('activo', on); b.setAttribute('aria-pressed', String(on)); });
  form.reset();
  caja.innerHTML = '';
  caja.append(crearPrenda(slug));
  pintarInfo(d);
  vista.hidden = false;
  escena.classList.add('desenfocada');
  document.documentElement.style.overflow = 'hidden';
  history.replaceState(null, '', `#${slug}`);
  vista.querySelector<HTMLButtonElement>('[data-cerrar]')!.focus({ preventScroll: true });

  // La prenda sale del perchero y llega al centro (FLIP)
  const origen = desde.querySelector<HTMLElement>('.giro');
  if (origen && !reducido) {
    const a = rectDe(origen), b = rectDe(caja);
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const s = a.height / b.height;
    ocupado = true;
    caja.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }],
      { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' },
    ).finished.finally(() => { ocupado = false; });
    vista.animate([{ backgroundColor: 'rgba(250,250,247,0)' }, {}], { duration: 500, easing: 'ease-out' });
    vista.querySelector('.vista-info')!.animate(
      [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
      { duration: 500, delay: 180, easing: 'ease-out', fill: 'backwards' },
    );
    etiquetas.animate([{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 350, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
  }
}

async function cerrar() {
  if (vista.hidden || ocupado) return;
  const destino = (actual && itemDe(actual.slug)) || deDonde;
  const giro = destino?.querySelector<HTMLElement>('.giro');
  if (giro && !reducido) {
    ocupado = true;
    const a = rectDe(giro), b = rectDe(caja);
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const s = a.height / b.height;
    vista.querySelector('.vista-info')!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    etiquetas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    escena.classList.remove('desenfocada');
    await caja.animate(
      [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
      { duration: 520, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' },
    ).finished.catch(() => {});
    ocupado = false;
  }
  vista.hidden = true;
  escena.classList.remove('desenfocada');
  document.documentElement.style.overflow = '';
  vista.querySelectorAll('.vista-info, [data-etiquetas], [data-vista-prenda]').forEach((el) => el.getAnimations().forEach((an) => an.cancel()));
  history.replaceState(null, '', location.pathname + location.search);
  (destino as HTMLElement | null)?.focus({ preventScroll: true });
  if (destino) empujar(destino.querySelector<HTMLElement>('.balanceo') ?? undefined, 60);
}

function cambiarColor(slug: string) {
  if (!actual || slug === actual.slug) return;
  const d = datos[slug];
  actual = d;
  const nuevo = crearPrenda(slug);
  if (!reducido) nuevo.classList.add('goteo');
  caja.append(nuevo);
  const viejos = [...caja.children].filter((c) => c !== nuevo);
  const terminar = () => { viejos.forEach((v) => v.remove()); nuevo.classList.remove('goteo'); };
  if (reducido) terminar(); else nuevo.addEventListener('animationend', terminar, { once: true });
  pintarInfo(d);
  history.replaceState(null, '', `#${slug}`);
  etiquetas.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
}

botonesLado.forEach((b) => b.addEventListener('click', () => {
  atras = b.dataset.lado === 'espalda';
  botonesLado.forEach((x) => { const on = x === b; x.classList.toggle('activo', on); x.setAttribute('aria-pressed', String(on)); });
  caja.querySelectorAll('.flip').forEach((f) => f.classList.toggle('atras', atras));
}));

// Deslizar la prenda grande con el dedo también la voltea
let x0: number | null = null;
caja.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
caja.addEventListener('touchend', (e) => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0; x0 = null;
  if (Math.abs(dx) > 40) botonesLado[atras ? 0 : 1].click();
});

form.addEventListener('change', () => (avisoTalla.hidden = true));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!actual || actual.proximamente) return;
  const talla = new FormData(form).get('talla') as string | null;
  if (!talla) { avisoTalla.hidden = false; return; }
  agregar({ slug: actual.slug, nombre: `${actual.nombre} · ${actual.color.nombre}`, talla, precio: actual.precio });
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  if (toast) {
    toast.innerHTML = 'Listo, quedó en tu carrito. <a href="/carrito">Ver carrito</a>';
    toast.classList.add('visible');
    clearTimeout((window as any).__toast);
    (window as any).__toast = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
});

vista.querySelector('[data-cerrar]')!.addEventListener('click', cerrar);
vista.addEventListener('click', (e) => { if (e.target === vista || (e.target as HTMLElement).classList.contains('vista-cuerpo')) cerrar(); });
document.addEventListener('keydown', (e) => {
  if (vista.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
  if (e.key === 'Tab') {
    // el foco no se escapa de la vista de cerca
    const f = [...vista.querySelectorAll<HTMLElement>('button:not([disabled]):not([hidden]), a[href]:not([hidden]), input:not([disabled])')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});

// Enlace directo: /perchero#slug abre esa prenda
const inicial = decodeURIComponent(location.hash.slice(1));
if (datos[inicial]) {
  const it = itemDe(inicial);
  if (it) requestAnimationFrame(() => { it.scrollIntoView({ block: 'center' }); abrir(inicial, it); });
}
