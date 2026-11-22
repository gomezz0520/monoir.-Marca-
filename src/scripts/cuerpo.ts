// ─────────────────────────────────────────────────────────────
// Medidas del cuerpo y cómo le queda cada talla.
// Todo en centímetros. Son estimaciones con medidas promedio:
// con altura y peso calculamos pecho, cintura y cadera aproximados.
// Si la persona sabe sus medidas exactas, se usan esas.
// ─────────────────────────────────────────────────────────────

export type Sexo = 'hombre' | 'mujer';
export type Ajuste = 'oversize' | 'boxy' | 'regular' | 'recto' | 'baggy' | 'jogger';
export type TipoProbador = 'camiseta' | 'buzo' | 'jogger' | 'jean';

export interface Entrada {
  sexo: Sexo; altura: number; peso: number;
  pecho?: number; cintura?: number; cadera?: number;
}

export interface Cuerpo {
  sexo: Sexo; altura: number; peso: number;
  pecho: number; cintura: number; cadera: number;
  hombros: number; cuello: number; brazo: number; muslo: number; pantorrilla: number;
  // alturas desde el piso
  hCabeza: number; hMenton: number; hCuello: number; hHombro: number; hAxila: number; hPecho: number;
  hCintura: number; hCadera: number; hEntrepierna: number; hRodilla: number; hTobillo: number;
  largoBrazo: number; // del hombro a la muñeca
}

const REF = {
  hombre: { altura: 175, peso: 74, pecho: 98, cintura: 84, cadera: 98, hombros: 45, cuello: 38, brazo: 31, muslo: 56, pantorrilla: 37 },
  mujer: { altura: 162, peso: 60, pecho: 90, cintura: 72, cadera: 98, hombros: 39.5, cuello: 33, brazo: 28, muslo: 56, pantorrilla: 35 },
};

export function estimarCuerpo(e: Entrada): Cuerpo {
  const r = REF[e.sexo];
  const H = e.altura;
  // A igual altura, el grosor crece con la raíz del peso (el área de la sección crece con el peso).
  const k = Math.sqrt((e.peso / H) / (r.peso / r.altura));
  const pecho = e.pecho ?? r.pecho * Math.pow(k, 0.95) * Math.pow(H / r.altura, 0.15);
  const cintura = e.cintura ?? r.cintura * Math.pow(k, 1.45) * Math.pow(H / r.altura, 0.15);
  const cadera = e.cadera ?? r.cadera * Math.pow(k, 1.05) * Math.pow(H / r.altura, 0.15);
  const f = (a: number) => a * H;
  const mujer = e.sexo === 'mujer';
  return {
    sexo: e.sexo, altura: H, peso: e.peso,
    pecho, cintura, cadera,
    hombros: r.hombros * (H / r.altura) * Math.pow(k, 0.35),
    cuello: r.cuello * Math.pow(k, 0.8),
    brazo: r.brazo * Math.pow(k, 1.15),
    muslo: r.muslo * Math.pow(k, 1.1) * Math.pow(H / r.altura, 0.2),
    pantorrilla: r.pantorrilla * Math.pow(k, 0.9),
    hCabeza: H,
    hMenton: f(0.865),
    hCuello: f(0.845),
    hHombro: f(0.818),
    hAxila: f(0.755),
    hPecho: f(mujer ? 0.716 : 0.722),
    hCintura: f(mujer ? 0.61 : 0.605),
    hCadera: f(0.522),
    hEntrepierna: f(mujer ? 0.466 : 0.474),
    hRodilla: f(0.285),
    hTobillo: f(0.039),
    largoBrazo: f(0.335),
  };
}

// ── Medidas de la prenda (cm) ──
export interface MedidasPrenda { anchoPecho?: number; largo?: number; manga?: number; cintura?: number; cadera?: number }

export interface Prenda {
  tipo: TipoProbador; ajuste: Ajuste; capota: boolean; medidas: MedidasPrenda;
}

export type Nivel = 'aprieta' | 'justa' | 'comoda' | 'holgada' | 'muy-holgada';
export interface Zona { id: string; nombre: string; valor: string; texto: string; nivel: Nivel }
export interface Analisis { zonas: Zona[]; puntaje: number; resumen: string }

// Holgura ideal en el pecho (contorno de la prenda menos contorno del cuerpo), por corte.
const HOLGURA_PECHO: Record<string, [number, number]> = { oversize: [16, 30], boxy: [10, 24], regular: [8, 18] };
const HOLGURA_CADERA: Record<string, [number, number]> = { recto: [4, 12], baggy: [2, 20], jogger: [4, 14] };

/** Cuánto baja la pretina del pantalón respecto a la cintura natural (cm). */
export function caidaPretina(ajuste: Ajuste, c: Cuerpo) {
  const e = c.altura / 175;
  return ajuste === 'baggy' ? 0 : ajuste === 'jogger' ? 3 * e : 5 * e;
}

/** Contorno del cuerpo a cierta altura entre cintura y cadera (interpolado). */
export function contornoEn(c: Cuerpo, h: number) {
  if (h >= c.hCintura) {
    const t = Math.min(1, (h - c.hCintura) / (c.hPecho - c.hCintura));
    return c.cintura + (c.pecho - c.cintura) * t;
  }
  const t = Math.min(1, (c.hCintura - h) / (c.hCintura - c.hCadera));
  if (c.sexo === 'hombre') return c.cintura * (1 - 0.03 * Math.min(1, t * 3)) + (c.cadera - c.cintura) * t * t;
  return c.cintura + (c.cadera - c.cintura) * Math.sin((t * Math.PI) / 2);
}

/** Cuánto baja de verdad la prenda: la tela pasa por encima de hombros y pecho. */
export const caidaVertical = (c: Cuerpo, largo: number, torso: boolean) =>
  largo * (torso ? (c.sexo === 'mujer' ? 0.88 : 0.94) : 0.98);

function nivelPorRango(v: number, [min, max]: [number, number]): Nivel {
  if (v < 0) return 'aprieta';
  if (v < min * 0.5) return 'justa';
  if (v < min) return 'justa';
  if (v <= max) return 'comoda';
  if (v <= max + 12) return 'holgada';
  return 'muy-holgada';
}
const fuera = (v: number, [min, max]: [number, number]) => (v < min ? min - v : v > max ? v - max : 0);
const signo = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))} cm`;

export function analizar(p: Prenda, c: Cuerpo): Analisis {
  const m = p.medidas;
  const zonas: Zona[] = [];
  let puntaje = 0;

  if (p.tipo === 'camiseta' || p.tipo === 'buzo') {
    const rango = HOLGURA_PECHO[p.ajuste] ?? HOLGURA_PECHO.regular;
    const holgura = 2 * (m.anchoPecho ?? 0) - c.pecho;
    const nivel = nivelPorRango(holgura, rango);
    const textoPecho = {
      aprieta: 'Te aprieta: pedí una talla más.',
      justa: p.ajuste === 'regular' ? 'Ajustada al cuerpo.' : 'Más ajustada de lo que se diseñó.',
      comoda: p.ajuste === 'oversize' ? 'Ancha, como se diseñó (oversize).' : p.ajuste === 'boxy' ? 'Cuadrada, como se diseñó.' : 'Cómoda, ni pegada ni suelta.',
      holgada: 'Te queda bastante ancha.',
      'muy-holgada': 'Te queda muy grande de pecho.',
    }[nivel];
    zonas.push({ id: 'pecho', nombre: 'Pecho', valor: signo(holgura), texto: textoPecho, nivel });
    puntaje += fuera(holgura, rango) * 1.4 + Math.abs(holgura - (rango[0] + rango[1]) / 2) * 0.08;

    // Largo: dónde termina el ruedo.
    const ruedo = c.hCuello - caidaVertical(c, m.largo ?? 70, true);
    let textoLargo: string; let nivelLargo: Nivel;
    if (p.ajuste === 'boxy') {
      const d = ruedo - c.hCintura;
      if (d > 6) { textoLargo = 'Corta: te deja ver el ombligo (crop).'; nivelLargo = 'justa'; puntaje += (d - 6) * 0.8; }
      else if (d > -6) { textoLargo = 'Te llega a la cintura, como se diseñó.'; nivelLargo = 'comoda'; }
      else { textoLargo = 'Te queda larga para ser boxy.'; nivelLargo = 'holgada'; puntaje += (-6 - d) * 0.8; }
    } else {
      const arriba = c.hCadera + 4, abajo = c.hEntrepierna - 6;
      if (ruedo > c.hCintura - 2) { textoLargo = 'Corta: se te ve la pretina del pantalón.'; nivelLargo = 'aprieta'; puntaje += (ruedo - arriba) * 1.2; }
      else if (ruedo > arriba) { textoLargo = 'Te llega arriba de la cadera, un poco corta.'; nivelLargo = 'justa'; puntaje += (ruedo - arriba) * 0.8; }
      else if (ruedo >= abajo) { textoLargo = 'Te llega a la cadera: largo ideal.'; nivelLargo = 'comoda'; }
      else if (ruedo >= abajo - 8) { textoLargo = 'Larga, te tapa la cola. Así se usa en streetwear.'; nivelLargo = 'holgada'; puntaje += (abajo - ruedo) * 0.35; }
      else { textoLargo = 'Muy larga para tu altura.'; nivelLargo = 'muy-holgada'; puntaje += (abajo - ruedo) * 0.8; }
    }
    zonas.push({ id: 'largo', nombre: 'Largo', valor: `${Math.round(m.largo ?? 0)} cm`, texto: textoLargo, nivel: nivelLargo });

    if (m.manga) {
      const caida = Math.max(0, (m.anchoPecho ?? 0) * 0.98 / 2 - c.hombros / 2);
      const sobra = caida + m.manga - c.largoBrazo;
      let t: string; let n: Nivel;
      if (sobra < -3) { t = 'Mangas cortas: no te llegan a la muñeca.'; n = 'aprieta'; puntaje += (-3 - sobra) * 0.9; }
      else if (sobra <= 6) { t = 'Mangas hasta la muñeca.'; n = 'comoda'; }
      else if (sobra <= 14) { t = 'Mangas largas, se arrugan en la muñeca (así se usa).'; n = 'holgada'; puntaje += (sobra - 6) * 0.15; }
      else { t = 'Mangas muy largas para tus brazos.'; n = 'muy-holgada'; puntaje += 1.2 + (sobra - 14) * 0.6; }
      zonas.push({ id: 'manga', nombre: 'Mangas', valor: signo(sobra), texto: t, nivel: n });
    }
  } else {
    // Pantalones
    const caida = caidaPretina(p.ajuste, c);
    const hPretina = c.hCintura - caida;
    const cuerpoPretina = contornoEn(c, hPretina);
    const elastico = p.ajuste === 'jogger';
    const holgura = (m.cintura ?? 0) - cuerpoPretina;
    let nc: Nivel; let tc: string;
    if (elastico) {
      // el resorte (medido relajado) estira hasta ~18 cm
      const estira = -holgura;
      if (estira > 18) { nc = 'aprieta'; tc = 'El resorte te queda muy apretado.'; puntaje += (estira - 18) * 2.2; }
      else if (estira > 12) { nc = 'justa'; tc = 'El resorte te ajusta firme.'; }
      else if (estira > -4) { nc = 'comoda'; tc = 'Resorte cómodo, ajustás con el cordón.'; }
      else { nc = 'holgada'; tc = 'Te queda suelta: apretá el cordón.'; puntaje += (-4 - estira) * 1.2; }
    } else {
      if (holgura < -1.5) { nc = 'aprieta'; tc = 'No te cierra o te aprieta mucho.'; puntaje += (-1.5 - holgura) * 2.2; }
      else if (holgura < 1.5) { nc = 'justa'; tc = 'Justo en la cintura (tiene un poco de elasticidad).'; }
      else if (holgura <= 6) { nc = 'comoda'; tc = 'Cintura cómoda.'; }
      else { nc = 'holgada'; tc = 'Grande de cintura: vas a necesitar correa.'; puntaje += (holgura - 6) * 1.2; }
    }
    zonas.push({ id: 'cintura', nombre: 'Cintura', valor: elastico ? 'Resorte' : signo(holgura), texto: tc, nivel: nc });

    const rango = HOLGURA_CADERA[p.ajuste] ?? HOLGURA_CADERA.recto;
    const holguraCadera = (m.cadera ?? 0) - c.cadera;
    const nh = nivelPorRango(holguraCadera, rango);
    const th = {
      aprieta: 'Te aprieta en la cadera.',
      justa: 'Ajustado en cadera y cola.',
      comoda: p.ajuste === 'baggy' ? 'Ancho, como se diseñó (baggy).' : 'Cómodo en cadera y muslo.',
      holgada: 'Te queda ancho de cadera.',
      'muy-holgada': 'Muy grande de cadera.',
    }[nh];
    zonas.push({ id: 'cadera', nombre: 'Cadera', valor: signo(holguraCadera), texto: th, nivel: nh });
    puntaje += fuera(holguraCadera, rango) * 1.1 + Math.abs(holguraCadera - (rango[0] + rango[1]) / 2) * 0.03;

    const ruedo = hPretina - caidaVertical(c, m.largo ?? 100, false);
    let tl: string; let nl: Nivel;
    if (ruedo > c.hTobillo + 4) { tl = 'Te queda corto: tobillero.'; nl = 'aprieta'; puntaje += (ruedo - c.hTobillo - 4) * 1.2; }
    else if (ruedo > -1) { tl = elastico ? 'El puño te queda en el tobillo: ideal.' : 'Te llega al zapato: largo ideal.'; nl = 'comoda'; }
    else if (ruedo > -7) { tl = elastico ? 'Se arruga un poco sobre el puño (así se usa).' : 'Se arruga sobre el tenis (stacked).'; nl = 'holgada'; puntaje += (-1 - ruedo) * 0.2; }
    else { tl = 'Te queda muy largo: hay que meterle ruedo.'; nl = 'muy-holgada'; puntaje += 1.2 + (-7 - ruedo) * 0.8; }
    zonas.push({ id: 'largo', nombre: 'Largo', valor: `${Math.round(m.largo ?? 0)} cm`, texto: tl, nivel: nl });
  }

  const malas = zonas.filter((z) => z.nivel === 'aprieta' || z.nivel === 'muy-holgada');
  const resumen = malas.length === 0 ? 'Te queda bien.' : malas.some((z) => z.nivel === 'aprieta') ? 'Te puede quedar pequeña.' : 'Te puede quedar grande.';
  return { zonas, puntaje, resumen };
}

/** Prueba todas las tallas y devuelve la que mejor queda (menor puntaje). */
export function recomendar(tallas: { talla: string; prenda: Prenda }[], c: Cuerpo) {
  let mejor = tallas[0]?.talla ?? '';
  let min = Infinity;
  const puntajes: Record<string, number> = {};
  for (const t of tallas) {
    const a = analizar(t.prenda, c);
    puntajes[t.talla] = a.puntaje;
    if (a.puntaje < min - 0.01) { min = a.puntaje; mejor = t.talla; }
  }
  return { mejor, puntajes };
}

export const COLOR_NIVEL: Record<Nivel, string> = {
  aprieta: '#e5484d', justa: '#f2a93b', comoda: '#3fa45b', holgada: '#2f8fd1', 'muy-holgada': '#6b5bd6',
};
export const NOMBRE_NIVEL: Record<Nivel, string> = {
  aprieta: 'Aprieta', justa: 'Justa', comoda: 'Cómoda', holgada: 'Holgada', 'muy-holgada': 'Muy holgada',
};
