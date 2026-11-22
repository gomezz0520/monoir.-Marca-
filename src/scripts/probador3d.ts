// ─────────────────────────────────────────────────────────────
// Probador 3D de MONOIR.
// Arma un maniquí con las medidas de la persona y le pone la prenda
// en la talla escogida, con medidas reales de la guía de tallas.
// Todo se genera con código (no hay modelos descargados): pesa poco.
// Cuando existan modelos 3D reales (CLO3D / Marvelous Designer en .glb),
// se pueden cargar en lugar de la prenda generada.
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { caidaPretina, caidaVertical, contornoEn, COLOR_NIVEL, type Cuerpo, type Prenda, type Zona } from './cuerpo';

const PI = Math.PI;
const cm = (v: number) => v / 100;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const suave = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Semiejes de una elipse con contorno C y proporción r = fondo/ancho. */
function ejes(C: number, r: number) {
  const a = C / (PI * (3 * (1 + r) - Math.sqrt((3 + r) * (1 + 3 * r))));
  return { a, b: a * r };
}
/** Perímetro de una elipse (Ramanujan). */
const perimetro = (a: number, b: number) => PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
/** Distancia del centro a la elipse en el ángulo θ (x = a·sen θ, z = b·cos θ). */
const radioElipse = (a: number, b: number, t: number) => Math.hypot(a * Math.sin(t), b * Math.cos(t));

/** Interpolación cúbica monótona (no se pasa de largo entre puntos). */
function pchip(xs: number[], ys: number[]) {
  const n = xs.length;
  const h: number[] = [], d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// ── Escala de colores del mapa de ajuste (holgura en cm) ──
const ESCALA: [number, THREE.Color][] = [
  [0.1, new THREE.Color(COLOR_NIVEL.aprieta)],
  [0.8, new THREE.Color(COLOR_NIVEL.justa)],
  [1.8, new THREE.Color(COLOR_NIVEL.comoda)],
  [4.5, new THREE.Color(COLOR_NIVEL.holgada)],
  [8, new THREE.Color(COLOR_NIVEL['muy-holgada'])],
];
/** Holgura ideal según el corte (contorno, cm). El mapa pinta verde cuando la prenda queda como se diseñó. */
const IDEAL: Record<string, number> = { oversize: 23, boxy: 17, regular: 13, recto: 8, baggy: 11, jogger: 9 };
function colorHolgura(gapCm: number, out: THREE.Color) {
  if (gapCm <= ESCALA[0][0]) return out.copy(ESCALA[0][1]);
  for (let i = 1; i < ESCALA.length; i++) {
    if (gapCm <= ESCALA[i][0]) return out.copy(ESCALA[i - 1][1]).lerp(ESCALA[i][1], (gapCm - ESCALA[i - 1][0]) / (ESCALA[i][0] - ESCALA[i - 1][0]));
  }
  return out.copy(ESCALA[ESCALA.length - 1][1]);
}

// ── Geometrías ──
interface Anillo { y: number; a: number; b: number; cz: number; cx?: number }
type Holgura = (y: number, t: number) => number; // cm, para colorear
type Deformar = (y: number, t: number) => number; // m, hacia afuera

const SEG = 56;

/** Superficie que une anillos elípticos (torso, prendas). `ys` va de arriba hacia abajo. */
function loft(control: Anillo[], filas: number, opciones: { holgura?: Holgura; deformar?: Deformar; seg?: number; arco?: [number, number] } = {}) {
  const seg = opciones.seg ?? SEG;
  const orden = [...control].sort((p, q) => p.y - q.y);
  const ys = orden.map((r) => r.y);
  const fa = pchip(ys, orden.map((r) => r.a));
  const fb = pchip(ys, orden.map((r) => r.b));
  const fz = pchip(ys, orden.map((r) => r.cz));
  const fx = pchip(ys, orden.map((r) => r.cx ?? 0));
  const y0 = ys[ys.length - 1], y1 = ys[0];
  const [t0, t1] = opciones.arco ?? [PI, 3 * PI]; // la costura queda atrás
  const cerrado = !opciones.arco;
  const pos = new Float32Array(filas * (seg + 1) * 3);
  const uv = new Float32Array(filas * (seg + 1) * 2);
  const gap = new Float32Array(filas * (seg + 1));
  let k = 0;
  for (let i = 0; i < filas; i++) {
    const y = lerp(y0, y1, i / (filas - 1));
    const a = fa(y), b = fb(y), z0 = fz(y), x0 = fx(y);
    for (let j = 0; j <= seg; j++) {
      const t = lerp(t0, t1, j / seg);
      const s = Math.sin(t), c = Math.cos(t);
      // normal de la elipse (para empujar pliegues hacia afuera)
      const nx = s / a, nz = c / b, nl = Math.hypot(nx, nz) || 1;
      const d = opciones.deformar ? opciones.deformar(y, t) : 0;
      pos[k * 3] = x0 + a * s + (nx / nl) * d;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = z0 + b * c + (nz / nl) * d;
      uv[k * 2] = j / seg; uv[k * 2 + 1] = i / (filas - 1);
      gap[k] = opciones.holgura ? opciones.holgura(y, t) : 0;
      k++;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < filas - 1; i++) for (let j = 0; j < seg; j++) {
    const p = i * (seg + 1) + j, q = p + seg + 1;
    idx.push(p, p + 1, q, p + 1, q + 1, q);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (cerrado) coserNormales(g, filas, seg);
  g.userData.gap = gap;
  return g;
}

/** Une las normales de la costura (primer y último vértice de cada anillo) para que no se vea la línea. */
function coserNormales(g: THREE.BufferGeometry, filas: number, seg: number) {
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < filas; i++) {
    const p = i * (seg + 1), q = p + seg;
    const x = n.getX(p) + n.getX(q), y = n.getY(p) + n.getY(q), z = n.getZ(p) + n.getZ(q);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(p, x / l, y / l, z / l); n.setXYZ(q, x / l, y / l, z / l);
  }
}

/** Tubo a lo largo de un camino (brazos, piernas, mangas, botas del pantalón). */
function tubo(curva: THREE.Curve<THREE.Vector3>, radio: (u: number) => number, filas: number, opciones: { holgura?: (u: number) => number; seg?: number; desde?: number; hasta?: number; ondas?: (u: number, t: number) => number } = {}) {
  const seg = opciones.seg ?? 28;
  const u0 = opciones.desde ?? 0, u1 = opciones.hasta ?? 1;
  const pos = new Float32Array(filas * (seg + 1) * 3);
  const gap = new Float32Array(filas * (seg + 1));
  const ref = new THREE.Vector3(0, 0, 1);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i < filas; i++) {
    const u = lerp(u0, u1, i / (filas - 1));
    curva.getPointAt(clamp(u, 0, 1), P);
    curva.getTangentAt(clamp(u, 0, 1), T);
    if (u > 1) P.addScaledVector(T, (u - 1) * curva.getLength());
    if (u < 0) P.addScaledVector(T, u * curva.getLength());
    B.crossVectors(T, ref).normalize();
    N.crossVectors(B, T).normalize();
    const r = radio(u);
    for (let j = 0; j <= seg; j++) {
      const t = (j / seg) * 2 * PI + PI;
      const rr = r + (opciones.ondas ? opciones.ondas(u, t) : 0);
      const c = Math.cos(t), s = Math.sin(t);
      pos[k * 3] = P.x + rr * (c * N.x + s * B.x);
      pos[k * 3 + 1] = P.y + rr * (c * N.y + s * B.y);
      pos[k * 3 + 2] = P.z + rr * (c * N.z + s * B.z);
      gap[k] = opciones.holgura ? opciones.holgura(u) : 0;
      k++;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < filas - 1; i++) for (let j = 0; j < seg; j++) {
    const p = i * (seg + 1) + j, q = p + seg + 1;
    idx.push(p, p + 1, q, p + 1, q + 1, q);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  coserNormales(g, filas, seg);
  g.userData.gap = gap;
  return g;
}

const elipsoide = (rx: number, ry: number, rz: number) => new THREE.SphereGeometry(1, 40, 28).scale(rx, ry, rz);

// ── Modelo del cuerpo en metros ──
interface Modelo {
  H: number; s: number;
  torso: Anillo[];
  enTorso: (y: number) => { a: number; b: number; cz: number };
  brazo: { izq: THREE.CatmullRomCurve3; der: THREE.CatmullRomCurve3; largo: number; radio: (u: number) => number; hombroX: number };
  pierna: { izq: THREE.CatmullRomCurve3; der: THREE.CatmullRomCurve3; radio: (u: number) => number; arriba: number; abajo: number };
  c: Cuerpo;
}

function modeloCuerpo(c: Cuerpo): Modelo {
  const H = cm(c.altura), s = H / 1.75;
  const mujer = c.sexo === 'mujer';
  const y = (v: number) => cm(v);
  const anillo = (yy: number, C: number, r: number, cz = 0, a?: number, b?: number): Anillo => {
    const e = ejes(cm(C), r);
    return { y: yy, a: a ?? e.a, b: b ?? e.b, cz };
  };
  const cuelloR = cm(c.cuello) / (2 * PI);
  const hombroA = cm(c.hombros) / 2;
  const pechoE = ejes(cm(c.pecho), mujer ? 0.74 : 0.7);
  const torso: Anillo[] = [
    anillo(y(c.hEntrepierna) - 0.015, c.cadera * 0.78, 0.66, -0.004),
    anillo(y(c.hEntrepierna) + 0.045 * s, c.cadera * 0.97, 0.77, -0.01),
    anillo(y(c.hCadera), c.cadera, mujer ? 0.8 : 0.78, -0.014),
    anillo((y(c.hCadera) + y(c.hCintura)) / 2, contornoEn(c, (c.hCadera + c.hCintura) / 2), 0.76, -0.008),
    anillo(y(c.hCintura), c.cintura, mujer ? 0.72 : 0.74, 0),
    anillo(lerp(y(c.hCintura), y(c.hPecho), 0.5), mujer ? c.cintura + (c.pecho - c.cintura) * 0.4 : (c.cintura + c.pecho) / 2, 0.7, 0.004),
    anillo(y(c.hPecho), c.pecho, mujer ? 0.74 : 0.7, mujer ? 0.02 : 0.008),
    { y: y(c.hAxila), a: Math.max(pechoE.a, hombroA * 0.84), b: pechoE.b * 0.92, cz: 0.004 },
    { y: y(c.hHombro) - 0.035 * s, a: hombroA - 0.03 * s, b: 0.098 * s * Math.pow(c.peso / (mujer ? 60 : 74), 0.25), cz: -0.006 },
    { y: y(c.hHombro) + 0.004, a: hombroA * 0.7, b: 0.08 * s, cz: -0.012 },
    { y: y(c.hCuello), a: cuelloR * 1.3, b: cuelloR * 1.15, cz: -0.014 },
    { y: y(c.hCuello) + 0.025 * s, a: cuelloR, b: cuelloR, cz: -0.012 },
  ];
  const orden = [...torso].sort((p, q) => p.y - q.y);
  const fa = pchip(orden.map((r) => r.y), orden.map((r) => r.a));
  const fb = pchip(orden.map((r) => r.y), orden.map((r) => r.b));
  const fz = pchip(orden.map((r) => r.y), orden.map((r) => r.cz));
  const yMin = orden[0].y;
  const enTorso = (yy: number) => (yy >= yMin ? { a: fa(yy), b: fb(yy), cz: fz(yy) } : { a: orden[0].a * 0.96, b: orden[0].b, cz: orden[0].cz });

  // Brazos en pose "A" (un poco abiertos para que se vean las mangas)
  const brazoR = cm(c.brazo) / (2 * PI);
  const hombroX = hombroA - brazoR * 0.75;
  const largoBrazo = cm(c.largoBrazo);
  const curvaBrazo = (lado: number) => {
    const S = new THREE.Vector3(lado * hombroX, y(c.hHombro) - brazoR * 0.85, -0.008);
    const ang = THREE.MathUtils.degToRad(13);
    const d1 = new THREE.Vector3(lado * Math.sin(ang), -Math.cos(ang), 0.01).normalize();
    const E = S.clone().addScaledVector(d1, largoBrazo * 0.555);
    const d2 = new THREE.Vector3(lado * Math.sin(ang + 0.03), -Math.cos(ang + 0.03), 0.16).normalize();
    const W = E.clone().addScaledVector(d2, largoBrazo * 0.445);
    return new THREE.CatmullRomCurve3([S, S.clone().lerp(E, 0.5), E, E.clone().lerp(W, 0.5), W], false, 'centripetal');
  };
  const rb = pchip([0, 0.25, 0.53, 0.58, 0.75, 1], [brazoR * 1.02, brazoR * 0.95, brazoR * 0.74, brazoR * 0.74, brazoR * 0.78, brazoR * 0.52]);

  // Piernas
  const cadE = ejes(cm(c.cadera), 0.78);
  const caderaX = cadE.a * 0.48;
  const musloR = cm(c.muslo) / (2 * PI);
  const pantR = cm(c.pantorrilla) / (2 * PI);
  const arriba = y(c.hEntrepierna) + 0.07 * s;
  const abajo = y(c.hTobillo);
  const curvaPierna = (lado: number) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(lado * caderaX, arriba, -0.005),
    new THREE.Vector3(lado * (caderaX * 0.93), lerp(arriba, y(c.hRodilla), 0.5), 0.006),
    new THREE.Vector3(lado * (caderaX * 0.86 + 0.004), y(c.hRodilla), 0.012),
    new THREE.Vector3(lado * (caderaX * 0.84 + 0.008), lerp(y(c.hRodilla), abajo, 0.45), -0.006),
    new THREE.Vector3(lado * (caderaX * 0.82 + 0.012), abajo, -0.012),
  ], false, 'centripetal');
  const largoPierna = arriba - abajo;
  const rodillaU = (arriba - y(c.hRodilla)) / largoPierna;
  const rp = pchip(
    [0, 0.12, 0.45, rodillaU - 0.03, rodillaU + 0.02, rodillaU + 0.2, 0.92, 1],
    [musloR * 1.04, musloR, musloR * 0.8, musloR * 0.6, musloR * 0.6, pantR, pantR * 0.62, pantR * 0.55],
  );

  return {
    H, s, torso, enTorso, c,
    brazo: { izq: curvaBrazo(-1), der: curvaBrazo(1), largo: largoBrazo, radio: rb, hombroX },
    pierna: { izq: curvaPierna(-1), der: curvaPierna(1), radio: rp, arriba, abajo },
  };
}

function construirCuerpo(m: Modelo, piernasDesde = 0) {
  const c = m.c, s = m.s;
  const partes: Record<string, THREE.BufferGeometry> = {};
  partes.torso = loft(m.torso, 60);
  partes.brazoIzq = tubo(m.brazo.izq, m.brazo.radio, 40);
  partes.brazoDer = tubo(m.brazo.der, m.brazo.radio, 40);
  partes.piernaIzq = tubo(m.pierna.izq, m.pierna.radio, 48, { desde: piernasDesde });
  partes.piernaDer = tubo(m.pierna.der, m.pierna.radio, 48, { desde: piernasDesde });
  const cuelloR = cm(c.cuello) / (2 * PI);
  partes.cuello = tubo(new THREE.LineCurve3(new THREE.Vector3(0, cm(c.hCuello) - 0.02, -0.012), new THREE.Vector3(0, cm(c.hMenton) + 0.015, -0.004)), () => cuelloR * 0.98, 6);
  const cab = cm(c.hCabeza - c.hMenton);
  partes.cabeza = elipsoide(0.082 * s, cab * 0.56, 0.1 * s).translate(0, cm(c.hCabeza) - cab * 0.52, 0.008);
  for (const [lado, curva] of [['Izq', m.brazo.izq], ['Der', m.brazo.der]] as const) {
    const W = curva.getPointAt(1), T = curva.getTangentAt(1);
    const mano = elipsoide(0.026 * s, 0.07 * s, 0.042 * s);
    mano.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), T));
    mano.translate(W.x + T.x * 0.06 * s, W.y + T.y * 0.06 * s, W.z + T.z * 0.06 * s);
    partes['mano' + lado] = mano;
    const S = curva.getPointAt(0);
    partes['hombro' + lado] = elipsoide(m.brazo.radio(0) * 1.02, m.brazo.radio(0) * 1.0, m.brazo.radio(0) * 0.98).translate(S.x * 0.97, S.y + 0.002, S.z);
  }
  const zapatos: Record<string, THREE.BufferGeometry> = {};
  for (const [lado, curva] of [['Izq', m.pierna.izq], ['Der', m.pierna.der]] as const) {
    const A = curva.getPointAt(1);
    zapatos['zapato' + lado] = elipsoide(0.048 * s, 0.045 * s, 0.135 * s).translate(A.x, 0.042 * s, A.z + 0.045 * s);
    zapatos['suela' + lado] = elipsoide(0.052 * s, 0.014 * s, 0.14 * s).translate(A.x, 0.012 * s, A.z + 0.045 * s);
  }
  return { partes, zapatos };
}

// ── Prendas ──
interface PiezaPrenda { geo: THREE.BufferGeometry; tono?: number }
interface Ancla { id: string; pos: THREE.Vector3; normal: THREE.Vector3 }

function construirPrenda(m: Modelo, p: Prenda): { piezas: Record<string, PiezaPrenda>; anclas: Ancla[]; piernasDesde?: number; ideal: number } {
  return p.tipo === 'camiseta' || p.tipo === 'buzo' ? prendaTorso(m, p) : pantalon(m, p);
}

const holgadoAntes = (p: Prenda) => p.ajuste !== 'regular';

function prendaTorso(m: Modelo, p: Prenda) {
  const c = m.c, s = m.s, med = p.medidas;
  const piezas: Record<string, PiezaPrenda> = {};
  const largo = med.largo ?? 70, ancho = med.anchoPecho ?? 56;
  const gC = cm(2 * ancho);
  const gE = ejes(gC, 0.74);
  const factorHombro = p.ajuste === 'oversize' ? 0.98 : p.ajuste === 'boxy' ? 0.96 : 0.86;
  const gHombroPlano = Math.max(cm(c.hombros) / 2 + 0.01, cm(ancho) / 2 * factorHombro);
  const gHombro = Math.min(gHombroPlano, cm(c.hombros) / 2 + (holgadoAntes(p) ? 0.03 : 0.018));
  const yHombro = cm(c.hHombro), yCuello = cm(c.hCuello);
  const yRuedo = yCuello - cm(caidaVertical(c, largo, true));
  const conPuno = p.tipo === 'buzo';
  const holgado = p.ajuste !== 'regular';
  const minimo = 0.006;
  const cuelloR = cm(c.cuello) / (2 * PI);

  // ancho de la prenda a cierta altura (antes de compararlo con el cuerpo)
  const prendaEn = (y: number) => {
    let a = gE.a, b = gE.b;
    if (!holgado) { const t = suave(cm(c.hPecho), cm(c.hCintura), y); a *= 1 - 0.05 * t; b *= 1 - 0.05 * t; }
    if (conPuno && y < yRuedo + 0.065 * s) { const k = suave(yRuedo + 0.075 * s, yRuedo + 0.05 * s, y); a = lerp(a, a * 0.88, k); b = lerp(b, b * 0.9, k); }
    return { a, b };
  };
  const control: Anillo[] = [];
  const cuelloA = cuelloR * (p.tipo === 'buzo' ? 1.5 : 1.42), cuelloB = cuelloR * 1.32;
  control.push({ y: yCuello + 0.006, a: cuelloA, b: cuelloB, cz: -0.016 });
  const top = m.enTorso(yHombro + 0.004);
  control.push({ y: yHombro + 0.012, a: Math.max(top.a + 0.014, lerp(cuelloA, gHombro, 0.62)), b: top.b + 0.02, cz: top.cz });
  const hb = m.enTorso(yHombro - 0.035 * s);
  control.push({ y: yHombro - 0.028 * s, a: Math.max(gHombro, hb.a + 0.016), b: Math.max(hb.b + 0.018, gE.b * 0.9), cz: hb.cz });
  // del sobaco hacia abajo, cada 4 cm
  for (let y = cm(c.hAxila); y > yRuedo + 0.01; y -= 0.04) {
    const cu = m.enTorso(y), pr = prendaEn(y);
    control.push({ y, a: Math.max(pr.a, cu.a + minimo), b: Math.max(pr.b, cu.b + minimo), cz: cu.cz * 0.6 });
  }
  const cr = m.enTorso(yRuedo), pr = prendaEn(yRuedo);
  control.push({ y: yRuedo, a: Math.max(pr.a, cr.a + minimo), b: Math.max(pr.b, cr.b + minimo), cz: cr.cz * 0.6 });

  const fa = pchip([...control].sort((a, b) => a.y - b.y).map((r) => r.y), [...control].sort((a, b) => a.y - b.y).map((r) => r.a));
  const fb = pchip([...control].sort((a, b) => a.y - b.y).map((r) => r.y), [...control].sort((a, b) => a.y - b.y).map((r) => r.b));
  // holgura = (contorno de la prenda − contorno del cuerpo) / 2π, en cm. Los hombros y el cuello
  // siempre se apoyan en el cuerpo, así que ahí no se marca como "aprieta".
  const ideal = (IDEAL[p.ajuste] ?? 13) / (2 * PI);
  const holgura: Holgura = (y, t) => {
    const cu = m.enTorso(y);
    const g = (perimetro(fa(y), fb(y)) - perimetro(cu.a, cu.b)) / (2 * PI) * 100;
    const local = (radioElipse(fa(y), fb(y), t) - radioElipse(cu.a, cu.b, t)) * 100;
    const v = g * 0.75 + local * 0.25;
    if (y > cm(c.hAxila) - 0.07) return Math.max(v, lerp(v, ideal, suave(cm(c.hAxila) - 0.07, cm(c.hAxila), y)));
    if (conPuno && y < yRuedo + 0.1 * s) return Math.max(v, lerp(v, ideal, suave(yRuedo + 0.1 * s, yRuedo + 0.06 * s, y)));
    return v;
  };
  // pliegues verticales donde la prenda cuelga suelta
  const deformar: Deformar = (y, t) => {
    const cu = m.enTorso(y);
    const suelta = clamp((fa(y) - cu.a) / 0.05, 0, 1);
    const baja = suave(cm(c.hPecho), yRuedo, y);
    return suelta * baja * 0.006 * Math.sin(t * 9 + 0.7) * (conPuno && y < yRuedo + 0.06 * s ? 0.3 : 1);
  };
  piezas.cuerpo = { geo: loft(control, 64, { holgura, deformar }) };

  // Cuello (rib)
  const cuello = new THREE.TorusGeometry(1, p.tipo === 'buzo' ? 0.13 : 0.08, 10, 48);
  cuello.rotateX(PI / 2).scale(cuelloA, 0.08, cuelloB).translate(0, yCuello + 0.004, -0.016);
  piezas.cuelloRib = { geo: cuello, tono: 0.9 };

  // Mangas
  const caida = Math.max(0, gHombroPlano - cm(c.hombros) / 2);
  const largoManga = med.manga ? cm(med.manga) : p.ajuste === 'boxy' ? 0.15 * s : 0.21 * s;
  const L = m.brazo.largo;
  const finManga = caida + largoManga;
  const larga = !!med.manga;
  const sobra = Math.max(0, finManga - (L + 0.03));
  const hasta = Math.min(finManga, L + 0.03) / L;
  const rb = m.brazo.radio;
  const holguraManga = p.ajuste === 'regular' ? 0.022 : 0.034;
  const sisa = Math.max(rb(0) + holguraManga + 0.008, cm(c.hHombro - c.hAxila) * (holgado ? 0.56 : 0.48));
  const tope = rb(0) + 0.012;
  const pico = 0.075 * s; // donde la manga es más ancha
  const radioManga = (u: number) => {
    if (u < 0) return tope * 0.9;
    const d = u * L;
    let r = d < pico
      ? lerp(tope, sisa, suave(0, pico, d))
      : lerp(sisa, rb(u) + holguraManga, suave(pico, Math.max(pico + 0.05, caida + 0.1), d));
    if (larga) {
      // puño ajustado y la tela que sobra se arruga encima
      const puno = suave(hasta - 0.1, hasta - 0.02, u);
      r = lerp(r, rb(1) + 0.01, puno);
    }
    return Math.max(r, rb(u) + 0.004);
  };
  const ondas = (u: number, t: number) => {
    if (!larga || sobra <= 0) return 0;
    const z = suave(hasta - 0.32, hasta - 0.1, u) * (1 - suave(hasta - 0.08, hasta - 0.02, u));
    return z * Math.min(0.012, 0.004 + sobra * 0.05) * Math.sin(u * L * 90) * (0.7 + 0.3 * Math.sin(t * 2));
  };
  for (const [lado, curva] of [['Izq', m.brazo.izq], ['Der', m.brazo.der]] as const) {
    const holguraManga = (u: number) => {
      const v = (radioManga(Math.max(0, u)) - rb(Math.max(0, u))) * 100;
      return larga && u > hasta - 0.1 ? Math.max(v, (IDEAL[p.ajuste] ?? 13) / (2 * PI)) : v;
    };
    piezas['manga' + lado] = { geo: tubo(curva, radioManga, 36, { desde: -0.02, hasta, holgura: holguraManga, ondas, seg: 32 }) };
  }

  // Capota (caída sobre la espalda) y bolsillo canguro
  if (p.capota) {
    const espalda = m.enTorso(yHombro - 0.06 * s);
    const capota = new THREE.SphereGeometry(1, 40, 24, 0, PI * 2, 0, PI * 0.62);
    capota.scale(0.15 * s, 0.17 * s, 0.075 * s).rotateX(-1.35).translate(0, yHombro - 0.02 * s, espalda.cz - espalda.b - 0.035 * s);
    piezas.capota = { geo: capota, tono: 0.94 };
    const rollo = new THREE.TorusGeometry(1, 0.16, 12, 48);
    rollo.rotateX(PI / 2).scale(cuelloA * 1.12, 0.07, cuelloB * 1.2).translate(0, yCuello + 0.01, -0.03);
    piezas.rollo = { geo: rollo, tono: 0.92 };
    const yB0 = Math.max(yRuedo + 0.08 * s, cm(c.hCadera) - 0.01), yB1 = yB0 + 0.16 * s;
    const bolsillo: Anillo[] = [];
    for (let y = yB0; y <= yB1 + 1e-6; y += (yB1 - yB0) / 4) bolsillo.push({ y, a: fa(y) + 0.004, b: fb(y) + 0.004, cz: m.enTorso(y).cz * 0.6 });
    piezas.bolsillo = { geo: loft(bolsillo, 8, { arco: [-0.62, 0.62], seg: 20, deformar, holgura }), tono: 0.88 };
  }

  const anclas: Ancla[] = [];
  const yP = cm(c.hPecho);
  anclas.push({ id: 'pecho', pos: new THREE.Vector3(0, yP, m.enTorso(yP).cz * 0.6 + fb(yP) + 0.01), normal: new THREE.Vector3(0, 0, 1) });
  anclas.push({ id: 'largo', pos: new THREE.Vector3(fa(yRuedo) * 0.55, yRuedo + 0.01, fb(yRuedo) * 0.8), normal: new THREE.Vector3(0.4, 0, 1).normalize() });
  if (larga) {
    const fin = m.brazo.der.getPointAt(clamp(hasta, 0, 1));
    anclas.push({ id: 'manga', pos: fin.add(new THREE.Vector3(0.03, 0, 0.02)), normal: new THREE.Vector3(1, 0, 0.6).normalize() });
  }
  return { piezas, anclas, ideal: (IDEAL[p.ajuste] ?? 13) / (2 * PI) };
}

function pantalon(m: Modelo, p: Prenda) {
  const c = m.c, s = m.s, med = p.medidas;
  const piezas: Record<string, PiezaPrenda> = {};
  const elastico = p.ajuste === 'jogger';
  const yPretina = cm(c.hCintura - caidaPretina(p.ajuste, c));
  let yRuedo = yPretina - cm(caidaVertical(c, med.largo ?? 100, false));
  const sobraLargo = Math.max(0, 0.014 - yRuedo);
  yRuedo = Math.max(yRuedo, 0.014);
  const Cb = cm(contornoEn(c, yPretina * 100));
  const Cw = cm(med.cintura ?? 80);
  const Ch = cm(med.cadera ?? 100);
  const cintura = ejes(Math.max(Cw + (elastico ? 0 : 0.004), Cb + 0.006), 0.76);
  const cadCuerpo = ejes(cm(c.cadera), 0.78);
  const cad = ejes(Math.max(Ch, cm(c.cadera) + 0.008), 0.8);
  const yCadera = cm(c.hCadera), yEntre = cm(c.hEntrepierna);
  const control: Anillo[] = [
    { y: yPretina, a: cintura.a, b: cintura.b, cz: m.enTorso(yPretina).cz },
    { y: yPretina - 0.04 * s, a: lerp(cintura.a, cad.a, 0.25), b: lerp(cintura.b, cad.b, 0.25), cz: m.enTorso(yPretina - 0.04).cz },
  ];
  if (yCadera < yPretina - 0.06) control.push({ y: yCadera, a: cad.a, b: cad.b, cz: m.enTorso(yCadera).cz });
  const musloG0 = Math.max(m.pierna.radio(0) + 0.01, (Ch * (p.ajuste === 'baggy' ? 0.7 : 0.6)) / (2 * PI));
  const ancho = Math.max(Math.abs(m.pierna.izq.getPointAt(0).x), cad.a * 0.99 - musloG0) + musloG0;
  control.push({ y: yEntre + 0.03, a: Math.max(ancho + 0.002, cad.a * 0.985), b: lerp(cad.b, musloG0 * 1.06, 0.6), cz: -0.006 });
  control.push({ y: yEntre - 0.04, a: ancho + 0.001, b: musloG0 * 1.04, cz: -0.004 });
  const holguraCad = (Ch - cm(c.cadera)) * 100;
  const holguraCin = (Cw - Cb) * 100 + (elastico ? 12 : 0);
  const holgura: Holgura = (y) => (y > yPretina - 0.05 ? holguraCin : lerp(holguraCin, holguraCad, suave(yPretina - 0.05, yCadera, y))) / (2 * PI);
  piezas.cadera = { geo: loft(control, 28, { holgura }) };
  // pretina
  const banda: Anillo[] = [
    { y: yPretina + 0.002, a: cintura.a + 0.003, b: cintura.b + 0.003, cz: m.enTorso(yPretina).cz },
    { y: yPretina - (elastico ? 0.045 : 0.038) * s, a: lerp(cintura.a, cad.a, 0.2) + 0.003, b: lerp(cintura.b, cad.b, 0.2) + 0.003, cz: m.enTorso(yPretina - 0.04).cz },
  ];
  piezas.pretina = { geo: loft(banda, 6, { holgura: () => holguraCin / (2 * PI) }), tono: 0.86 };

  // botas
  const rp = m.pierna.radio;
  const largoPierna = m.pierna.arriba - m.pierna.abajo;
  const factorMuslo = p.ajuste === 'baggy' ? 0.7 : 0.6;
  const musloG = Math.max(rp(0) + 0.01, (Ch * factorMuslo) / (2 * PI));
  const uRodilla = (m.pierna.arriba - cm(c.hRodilla)) / largoPierna;
  const uFin = (m.pierna.arriba - yRuedo) / largoPierna;
  const rodilla = p.ajuste === 'baggy' ? musloG * 0.98 : p.ajuste === 'jogger' ? musloG * 0.8 : musloG * 0.8;
  const ruedoR = p.ajuste === 'baggy' ? musloG * 0.97 : p.ajuste === 'jogger' ? rp(1) + 0.012 : musloG * 0.72;
  const fr = pchip([0, uRodilla, Math.max(uRodilla + 0.05, uFin)], [musloG, rodilla, ruedoR]);
  const radioBota = (u: number) => {
    let r = fr(u);
    if (elastico) {
      // el puño aprieta en el tobillo y la tela se infla justo encima
      const puno = suave(uFin - 0.06, uFin - 0.02, u);
      const globo = suave(uFin - 0.25, uFin - 0.1, u) * (1 - puno);
      r = lerp(r, rp(u) + 0.012, puno) + globo * 0.012;
    }
    return Math.max(r, rp(u) + 0.006);
  };
  const ondas = (u: number, t: number) => {
    const z = suave(uFin - (elastico ? 0.2 : 0.14), uFin - 0.02, u);
    const amp = elastico ? 0.006 : Math.min(0.01, sobraLargo * 0.12 + (p.ajuste === 'baggy' ? 0.004 : 0.001));
    return z * amp * Math.sin(u * largoPierna * 70 + t);
  };
  // cada bota cuelga del borde de la cadera y baja hasta el tobillo (no se pega a la pierna)
  const x0 = Math.max(Math.abs(m.pierna.izq.getPointAt(0).x), cad.a * 0.99 - musloG);
  const curvaBota = (lado: number, pierna: THREE.CatmullRomCurve3) => {
    const tob = pierna.getPointAt(1), rod = pierna.getPointAt(uRodilla);
    const xr = lerp(lado * x0, rod.x, p.ajuste === 'baggy' ? 0.35 : 0.7);
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * x0, m.pierna.arriba, -0.004),
      new THREE.Vector3(lerp(lado * x0, xr, 0.5), lerp(m.pierna.arriba, rod.y, 0.5), 0.002),
      new THREE.Vector3(xr, rod.y, rod.z * 0.6),
      new THREE.Vector3(lerp(xr, tob.x, 0.6), lerp(rod.y, tob.y, 0.6), tob.z * 0.6),
      new THREE.Vector3(p.ajuste === 'baggy' ? lerp(xr, tob.x, 0.8) : tob.x, tob.y, tob.z * 0.5),
    ], false, 'centripetal');
  };
  const radioBotaTope = (u: number) => (u < 0 ? radioBota(0) * lerp(0.92, 1, suave(-0.04, 0, u)) : radioBota(u));
  for (const [lado, n, pierna] of [[-1, 'Izq', m.pierna.izq], [1, 'Der', m.pierna.der]] as const) {
    piezas['bota' + n] = { geo: tubo(curvaBota(lado, pierna), radioBotaTope, 52, { desde: -0.04, hasta: uFin, ondas, holgura: (u) => { const v = (radioBota(Math.max(0, u)) - rp(Math.max(0, u))) * 100; return elastico && u > uFin - 0.07 ? Math.max(v, (IDEAL.jogger) / (2 * PI)) : v; }, seg: 32 }) };
  }
  // detalles: cordón (jogger) o botón (jean)
  if (elastico) {
    for (const x of [-0.012, 0.012]) {
      const z = m.enTorso(yPretina).cz + cintura.b + 0.006;
      piezas['cordon' + x] = { geo: tubo(new THREE.CatmullRomCurve3([new THREE.Vector3(x, yPretina - 0.012, z), new THREE.Vector3(x * 1.6, yPretina - 0.07 * s, z + 0.004), new THREE.Vector3(x * 1.2, yPretina - 0.13 * s, z + 0.002)]), () => 0.0028, 8, { seg: 8 }), tono: -1 };
    }
  } else {
    const z = m.enTorso(yPretina).cz + cintura.b + 0.005;
    piezas.boton = { geo: new THREE.CylinderGeometry(0.008, 0.008, 0.004, 20).rotateX(PI / 2).translate(0, yPretina - 0.02 * s, z), tono: -2 };
  }
  const anclas: Ancla[] = [
    { id: 'cintura', pos: new THREE.Vector3(0, yPretina - 0.02, m.enTorso(yPretina).cz + cintura.b + 0.01), normal: new THREE.Vector3(0, 0, 1) },
    { id: 'cadera', pos: new THREE.Vector3(cad.a + 0.01, yCadera, 0), normal: new THREE.Vector3(1, 0, 0.3).normalize() },
    { id: 'largo', pos: m.pierna.der.getPointAt(clamp(uFin, 0, 1)).add(new THREE.Vector3(0.05, 0.02, 0.03)), normal: new THREE.Vector3(0.5, 0, 1).normalize() },
  ];
  void cadCuerpo;
  // las piernas del maniquí solo se dibujan donde no las tapa el pantalón (evita que se asomen)
  return { piezas, anclas, piernasDesde: clamp(uFin - 0.08, 0, 0.9), ideal: (IDEAL[p.ajuste] ?? 8) / (2 * PI) };
}

// ── Textura de tela (un grano sutil, generado en el navegador) ──
function texturaTela() {
  const n = 128, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = 128 + 20 * Math.sin((x + y * 0.5) * 1.3) + (Math.random() - 0.5) * 26;
    const i = (y * n + x) * 4;
    img.data[i] = 128 + (v - 128) * 0.6; img.data[i + 1] = 128 + (Math.random() - 0.5) * 18; img.data[i + 2] = 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  return t;
}

function sombraSuelo() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.32)'); g.addColorStop(0.45, 'rgba(0,0,0,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  plano.rotation.x = -PI / 2; plano.position.y = 0.001;
  return plano;
}

// ── El probador ──
export interface Probador {
  actualizar: (c: Cuerpo, p: Prenda, colorHex: string, zonas: Zona[]) => void;
  mapa: (encendido: boolean) => void;
  encuadre: (v: 'entero' | 'prenda') => void;
  destruir: () => void;
}

export function crearProbador(lienzo: HTMLElement, capaEtiquetas: HTMLElement): Probador {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  lienzo.prepend(renderer.domElement);

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.55;
  const luz = new THREE.DirectionalLight(0xffffff, 2.1);
  luz.position.set(-1.5, 3, 2.5);
  const contra = new THREE.DirectionalLight(0xffffff, 0.7);
  contra.position.set(2, 1.5, -2.5);
  escena.add(luz, contra, new THREE.HemisphereLight(0xffffff, 0xcfc8bc, 0.45));
  const sombra = sombraSuelo();
  escena.add(sombra);

  const camara = new THREE.PerspectiveCamera(28, 1, 0.05, 40);
  camara.position.set(0.9, 1.2, 4.2);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.enablePan = false;
  controles.minDistance = 0.9;
  controles.maxDistance = 6;
  controles.minPolarAngle = THREE.MathUtils.degToRad(55);
  controles.maxPolarAngle = THREE.MathUtils.degToRad(100);
  controles.rotateSpeed = 0.75;
  controles.autoRotate = !reducido;
  controles.autoRotateSpeed = 1.1;
  controles.addEventListener('start', () => { controles.autoRotate = false; });

  const grupoCuerpo = new THREE.Group(), grupoPrenda = new THREE.Group();
  escena.add(grupoCuerpo, grupoPrenda);
  const matManiqui = new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.55, metalness: 0 });
  const matZapato = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.6 });
  const matSuela = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.7 });
  const tela = texturaTela();
  const matTela = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.95, sheen: 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color(0x888888), side: THREE.DoubleSide, normalMap: tela, normalScale: new THREE.Vector2(0.16, 0.16) });
  const matMapa = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
  const matBoton = new THREE.MeshStandardMaterial({ color: 0xb9b2a4, metalness: 0.8, roughness: 0.3 });
  const materialesTono = new Map<number, THREE.MeshPhysicalMaterial>();
  let colorTela = new THREE.Color(0x333333);
  let verMapa = false;
  let anclas: Ancla[] = [];
  let modelo: Modelo | null = null;
  let tipoPrenda = '';
  let objetivo = new THREE.Vector3(0, 1, 0);
  let distanciaObjetivo = 4;
  let moviendoCamara = 0;

  function matTono(tono: number) {
    if (tono === -1) return matSuela;
    if (tono === -2) return matBoton;
    let m = materialesTono.get(tono);
    if (!m) { m = matTela.clone(); materialesTono.set(tono, m); }
    m.color.copy(colorTela).multiplyScalar(tono);
    m.sheenColor.copy(colorTela).lerp(new THREE.Color(0xffffff), 0.35).multiplyScalar(0.6);
    return m;
  }

  // Animación suave entre la geometría vieja y la nueva (al cambiar talla, altura o peso)
  const transiciones: { malla: THREE.Mesh; desde: Float32Array; hacia: Float32Array; t0: number }[] = [];
  function poner(grupo: THREE.Group, nombre: string, geo: THREE.BufferGeometry, mat: THREE.Material) {
    let malla = grupo.getObjectByName(nombre) as THREE.Mesh | undefined;
    if (malla && !reducido && (malla.geometry.getAttribute('position').count === geo.getAttribute('position').count)) {
      const desde = (malla.geometry.getAttribute('position').array as Float32Array).slice();
      const hacia = geo.getAttribute('position').array as Float32Array;
      malla.geometry.dispose();
      malla.geometry = geo;
      malla.material = mat;
      for (let i = transiciones.length - 1; i >= 0; i--) if (transiciones[i].malla === malla) transiciones.splice(i, 1);
      transiciones.push({ malla, desde, hacia: hacia.slice(), t0: performance.now() });
      (geo.getAttribute('position').array as Float32Array).set(desde);
      geo.getAttribute('position').needsUpdate = true;
    } else {
      if (malla) { malla.geometry.dispose(); grupo.remove(malla); }
      malla = new THREE.Mesh(geo, mat);
      malla.name = nombre;
      grupo.add(malla);
    }
    return malla;
  }
  function limpiar(grupo: THREE.Group, vivos: Set<string>) {
    for (const o of [...grupo.children]) if (!vivos.has(o.name)) { (o as THREE.Mesh).geometry.dispose(); grupo.remove(o); }
  }
  function pasoTransiciones(ahora: number) {
    for (let i = transiciones.length - 1; i >= 0; i--) {
      const tr = transiciones[i];
      const t = clamp((ahora - tr.t0) / 480, 0, 1), e = 1 - Math.pow(1 - t, 3);
      const attr = tr.malla.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let k = 0; k < arr.length; k++) arr[k] = tr.desde[k] + (tr.hacia[k] - tr.desde[k]) * e;
      attr.needsUpdate = true;
      if (t >= 1) { tr.malla.geometry.computeVertexNormals(); transiciones.splice(i, 1); }
      else if (Math.round(t * 10) % 3 === 0) tr.malla.geometry.computeVertexNormals();
    }
  }

  function colorearMapa(geo: THREE.BufferGeometry, ideal: number) {
    const gap = geo.userData.gap as Float32Array | undefined;
    if (!gap) return;
    const col = new Float32Array(gap.length * 3), c = new THREE.Color();
    for (let i = 0; i < gap.length; i++) { colorHolgura(gap[i] - ideal + 1.8, c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }

  function aplicarMateriales() {
    for (const o of grupoPrenda.children) {
      const m = o as THREE.Mesh;
      const tono = (m.userData.tono as number) ?? 1;
      m.material = verMapa && tono > 0 && m.geometry.getAttribute('color') ? matMapa : matTono(tono);
    }
  }

  // Etiquetas HTML sobre el 3D
  const etiquetas = new Map<string, HTMLElement>();
  function ponerEtiquetas(zonas: Zona[]) {
    capaEtiquetas.innerHTML = '';
    etiquetas.clear();
    for (const z of zonas) {
      const el = document.createElement('div');
      el.className = 'etiqueta-3d';
      el.innerHTML = '<i></i><b></b> <span></span>';
      (el.querySelector('i') as HTMLElement).style.background = COLOR_NIVEL[z.nivel];
      el.querySelector('b')!.textContent = z.nombre;
      el.querySelector('span')!.textContent = z.valor;
      capaEtiquetas.append(el);
      etiquetas.set(z.id, el);
    }
  }
  const v = new THREE.Vector3(), haciaCam = new THREE.Vector3();
  function moverEtiquetas() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    for (const a of anclas) {
      const el = etiquetas.get(a.id);
      if (!el) continue;
      haciaCam.copy(camara.position).sub(a.pos).normalize();
      const visible = haciaCam.dot(a.normal) > 0.2;
      v.copy(a.pos).project(camara);
      el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      el.style.opacity = visible ? '1' : '0';
    }
  }

  function encuadrar(vista: 'entero' | 'prenda') {
    if (!modelo) return;
    const H = modelo.H, c = modelo.c;
    if (vista === 'entero') { objetivo.set(0, H * 0.52, 0); distanciaObjetivo = H * 2.35; }
    else if (tipoPrenda === 'camiseta' || tipoPrenda === 'buzo') { objetivo.set(0, cm(c.hCintura) + 0.08, 0); distanciaObjetivo = H * 1.45; }
    else { objetivo.set(0, cm(c.hRodilla) + 0.18, 0); distanciaObjetivo = H * 1.6; }
    moviendoCamara = reducido ? 0 : 1;
    if (reducido) { controles.target.copy(objetivo); camara.position.copy(objetivo).add(new THREE.Vector3(0.35, 0.12, 1).normalize().multiplyScalar(distanciaObjetivo)); }
  }

  function actualizar(c: Cuerpo, p: Prenda, colorHex: string, zonas: Zona[]) {
    const primera = !modelo;
    const cambioTipo = tipoPrenda !== p.tipo;
    modelo = modeloCuerpo(c);
    tipoPrenda = p.tipo;
    colorTela = new THREE.Color(colorHex);
    materialesTono.forEach((m, tono) => { m.color.copy(colorTela).multiplyScalar(tono); m.sheenColor.copy(colorTela).lerp(new THREE.Color(0xffffff), 0.35).multiplyScalar(0.6); });
    const prenda = construirPrenda(modelo, p);
    const { partes, zapatos } = construirCuerpo(modelo, prenda.piernasDesde ?? 0);
    const vivosC = new Set<string>();
    for (const [n, g] of Object.entries(partes)) { poner(grupoCuerpo, n, g, matManiqui); vivosC.add(n); }
    for (const [n, g] of Object.entries(zapatos)) { poner(grupoCuerpo, n, g, n.startsWith('suela') ? matSuela : matZapato); vivosC.add(n); }
    limpiar(grupoCuerpo, vivosC);
    const vivosP = new Set<string>();
    for (const [n, pieza] of Object.entries(prenda.piezas)) {
      colorearMapa(pieza.geo, prenda.ideal);
      const malla = poner(grupoPrenda, n, pieza.geo, matTono(pieza.tono ?? 1));
      malla.userData.tono = pieza.tono ?? 1;
      vivosP.add(n);
    }
    limpiar(grupoPrenda, vivosP);
    aplicarMateriales();
    anclas = prenda.anclas;
    ponerEtiquetas(zonas);
    sombra.scale.setScalar(modelo.H * 0.42);
    if (primera || cambioTipo) {
      encuadrar('prenda');
      if (primera) { controles.target.copy(objetivo); camara.position.copy(objetivo).add(new THREE.Vector3(0.35, 0.12, 1).normalize().multiplyScalar(distanciaObjetivo)); moviendoCamara = 0; }
    }
  }

  function tamano() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / Math.max(1, h);
    camara.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(tamano);
  ro.observe(lienzo);
  tamano();

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(lienzo);
  renderer.setAnimationLoop((ahora) => {
    if (!visible || document.hidden) return;
    if (moviendoCamara > 0) {
      controles.target.lerp(objetivo, 0.08);
      const dir = camara.position.clone().sub(controles.target);
      const d = lerp(dir.length(), distanciaObjetivo, 0.08);
      camara.position.copy(controles.target).add(dir.setLength(d));
      if (controles.target.distanceTo(objetivo) < 0.002 && Math.abs(d - distanciaObjetivo) < 0.002) moviendoCamara = 0;
    }
    pasoTransiciones(ahora);
    controles.update();
    renderer.render(escena, camara);
    moverEtiquetas();
  });

  return {
    actualizar,
    mapa(encendido) { verMapa = encendido; aplicarMateriales(); },
    encuadre: encuadrar,
    destruir() {
      renderer.setAnimationLoop(null);
      ro.disconnect(); io.disconnect();
      controles.dispose();
      renderer.dispose();
    },
  };
}
