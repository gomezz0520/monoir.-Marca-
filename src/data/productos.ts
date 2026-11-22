// ─────────────────────────────────────────────────────────────
// Catálogo de MONOIR. Para agregar o cambiar un producto, se edita
// esta lista. Solo productos MONOIR: nunca marcas de terceros.
//
// PENDIENTE: precios finales, medidas reales y fotos. Mientras no
// haya fotos se usan ilustraciones (campo `tipo` + `color`).
// ─────────────────────────────────────────────────────────────

export type Tipo = 'camiseta' | 'buzo' | 'jogger' | 'jean' | 'boxer' | 'medias';
export type Genero = 'hombre' | 'mujer' | 'unisex';
/** Corte de la prenda. Lo usa el probador 3D para saber qué holgura es la "ideal". */
export type Ajuste = 'oversize' | 'boxy' | 'regular' | 'recto' | 'baggy' | 'jogger';

export interface Producto {
  slug: string;
  nombre: string;
  tipo: Tipo;
  categoria: 'Camisetas' | 'Buzos' | 'Joggers' | 'Jeans' | 'Interior';
  genero: Genero;
  linea: 'Básicos' | 'Colección';
  precio: number;
  color: { nombre: string; hex: string };
  tallas: string[];
  /** Medidas en cm por talla. Columnas según `columnasMedidas`. */
  columnasMedidas: string[];
  medidas: Record<string, number[]>;
  descripcion: string;
  detalles: string[];
  nuevo?: boolean;
  /** Si es edición limitada, cuántas unidades hay. */
  edicion?: number;
  /** Producto del próximo drop: se muestra pero aún no se vende. */
  proximamente?: boolean;
  /** Estampado de espalda (solo colección). */
  estampadoEspalda?: boolean;
  /** Fotos reales (frente, espalda). Cuando existan, reemplazan la ilustración. */
  fotos?: { frente: string; espalda: string };
  /**
   * Los productos con el mismo `modelo` son la misma prenda en otro color.
   * En el perchero aparecen como etiquetas de color colgando.
   */
  modelo?: string;
  /** Corte de la prenda (para el probador 3D). Sin `ajuste`, no sale en el probador. */
  ajuste?: Ajuste;
}

const medidasCamiseta = {
  columnasMedidas: ['Ancho de pecho', 'Largo'],
  medidas: { S: [56, 70], M: [59, 72], L: [62, 74], XL: [65, 76], XXL: [68, 78] },
};
const medidasBuzo = {
  columnasMedidas: ['Ancho de pecho', 'Largo', 'Manga'],
  medidas: { S: [58, 68, 60], M: [61, 70, 61], L: [64, 72, 62], XL: [67, 74, 63], XXL: [70, 76, 64] },
};
const medidasPantalon = {
  columnasMedidas: ['Cintura', 'Cadera', 'Largo'],
  medidas: { '28': [72, 96, 100], '30': [77, 101, 101], '32': [82, 106, 102], '34': [87, 111, 103], '36': [92, 116, 104] },
};
const medidasJogger = {
  columnasMedidas: ['Cintura (relajada)', 'Cadera', 'Largo'],
  medidas: { S: [70, 100, 98], M: [75, 105, 100], L: [80, 110, 102], XL: [85, 115, 104] },
};

export const productos: Producto[] = [
  {
    slug: 'camiseta-oversize-noir',
    nombre: 'Camiseta Oversize Noir',
    tipo: 'camiseta', categoria: 'Camisetas', genero: 'unisex', linea: 'Básicos',
    precio: 89000,
    color: { nombre: 'Negro', hex: '#131314' },
    tallas: ['S', 'M', 'L', 'XL', 'XXL'], ...medidasCamiseta,
    descripcion: 'La negra que combina con todo, hasta con tus malas decisiones. Corte ancho, hombro caído y algodón pesado que no se vuelve trapo a la tercera lavada.',
    detalles: ['Algodón 100% peinado, 220 g', 'Corte oversize, hombro caído', 'Felino bordado en el pecho', 'Etiqueta MONOIR en el cuello'],
    nuevo: true,
    modelo: 'camiseta-oversize', ajuste: 'oversize',
  },
  {
    slug: 'camiseta-oversize-mono',
    nombre: 'Camiseta Oversize Mono',
    tipo: 'camiseta', categoria: 'Camisetas', genero: 'unisex', linea: 'Básicos',
    precio: 89000,
    color: { nombre: 'Blanco hueso', hex: '#EEEAE2' },
    tallas: ['S', 'M', 'L', 'XL', 'XXL'], ...medidasCamiseta,
    descripcion: 'El lado "mono" de la marca. Blanco hueso, no blanco hospital. Pesada, ancha y lista para el parche.',
    detalles: ['Algodón 100% peinado, 220 g', 'Corte oversize, hombro caído', 'Felino bordado en el pecho', 'Etiqueta MONOIR en el cuello'],
    nuevo: true,
    modelo: 'camiseta-oversize', ajuste: 'oversize',
  },
  {
    slug: 'camiseta-boxy-humo',
    nombre: 'Camiseta Boxy Humo',
    tipo: 'camiseta', categoria: 'Camisetas', genero: 'mujer', linea: 'Básicos',
    precio: 85000,
    color: { nombre: 'Gris humo', hex: '#6E6E72' },
    tallas: ['XS', 'S', 'M', 'L'],
    columnasMedidas: ['Ancho de pecho', 'Largo'],
    medidas: { XS: [48, 50], S: [51, 52], M: [54, 54], L: [57, 56] },
    descripcion: 'Corta, cuadrada y con actitud. Pa\' que la cintura del jean alto se vea, mi niña.',
    detalles: ['Algodón 100%, 200 g', 'Corte boxy, largo a la cintura', 'Felino bordado tono sobre tono'],
    nuevo: true,
    ajuste: 'boxy',
  },
  {
    slug: 'buzo-capota-madrugada',
    nombre: 'Buzo Capota Madrugada',
    tipo: 'buzo', categoria: 'Buzos', genero: 'unisex', linea: 'Básicos',
    precio: 139000,
    color: { nombre: 'Negro', hex: '#151517' },
    tallas: ['S', 'M', 'L', 'XL', 'XXL'], ...medidasBuzo,
    descripcion: 'Pa\' cuando el parche se alarga y en Las Palmas hace frío. Felpa por dentro, capota doble y bolsillo canguro.',
    detalles: ['Algodón perchado 340 g', 'Capota doble sin cordón', 'Bolsillo canguro', 'Felino bordado en la espalda alta'],
    nuevo: true,
    modelo: 'buzo-capota', ajuste: 'oversize',
  },
  {
    slug: 'buzo-capota-alba',
    nombre: 'Buzo Capota Alba',
    tipo: 'buzo', categoria: 'Buzos', genero: 'unisex', linea: 'Básicos',
    precio: 139000,
    color: { nombre: 'Hueso', hex: '#E7E2D8' },
    tallas: ['S', 'M', 'L', 'XL', 'XXL'], ...medidasBuzo,
    descripcion: 'El mismo buzo de la madrugada, pero pa\' cuando sale el sol y seguís en la calle. Claro, pesado y sin miedo a la mancha.',
    detalles: ['Algodón perchado 340 g', 'Capota doble sin cordón', 'Bolsillo canguro', 'Felino bordado en la espalda alta'],
    modelo: 'buzo-capota', ajuste: 'oversize',
  },
  {
    slug: 'buzo-cuello-redondo-niebla',
    nombre: 'Buzo Cuello Redondo Niebla',
    tipo: 'buzo', categoria: 'Buzos', genero: 'unisex', linea: 'Básicos',
    precio: 129000,
    color: { nombre: 'Gris jaspe', hex: '#9A9A9C' },
    tallas: ['S', 'M', 'L', 'XL'], ...medidasBuzo,
    descripcion: 'Gris como Medellín a las 6 a. m. Va con todo y no le pide permiso a nadie.',
    detalles: ['Algodón perchado 320 g', 'Puños y pretina en rib', 'Felino bordado en el pecho'],
    ajuste: 'regular',
  },
  {
    slug: 'jogger-cargo-asfalto',
    nombre: 'Jogger Cargo Asfalto',
    tipo: 'jogger', categoria: 'Joggers', genero: 'hombre', linea: 'Básicos',
    precio: 119000,
    color: { nombre: 'Negro asfalto', hex: '#1C1C1E' },
    tallas: ['S', 'M', 'L', 'XL'], ...medidasJogger,
    descripcion: 'Bolsillos pa\' el celular, las llaves y el chicle. Resorte en la cintura y en el tobillo, cero drama.',
    detalles: ['Dril de algodón con elastano', 'Bolsillos cargo con tapa', 'Cintura elástica con cordón', 'Puño elástico en el tobillo'],
    modelo: 'jogger-cargo', ajuste: 'jogger',
  },
  {
    slug: 'jogger-cargo-arena',
    nombre: 'Jogger Cargo Arena',
    tipo: 'jogger', categoria: 'Joggers', genero: 'hombre', linea: 'Básicos',
    precio: 119000,
    color: { nombre: 'Arena', hex: '#B49A6C' },
    tallas: ['S', 'M', 'L', 'XL'], ...medidasJogger,
    descripcion: 'El cargo de siempre en el color que todo el mundo te va a preguntar dónde compraste.',
    detalles: ['Dril de algodón con elastano', 'Bolsillos cargo con tapa', 'Cintura elástica con cordón', 'Puño elástico en el tobillo'],
    modelo: 'jogger-cargo', ajuste: 'jogger',
  },
  {
    slug: 'jogger-cargo-oliva',
    nombre: 'Jogger Cargo Oliva',
    tipo: 'jogger', categoria: 'Joggers', genero: 'hombre', linea: 'Básicos',
    precio: 119000,
    color: { nombre: 'Oliva', hex: '#4F5336' },
    tallas: ['S', 'M', 'L', 'XL'], ...medidasJogger,
    descripcion: 'Verde monte, pa\' los que se pierden en el parque Arví y vuelven con estilo.',
    detalles: ['Dril de algodón con elastano', 'Bolsillos cargo con tapa', 'Cintura elástica con cordón', 'Puño elástico en el tobillo'],
    modelo: 'jogger-cargo', ajuste: 'jogger',
  },
  {
    slug: 'jean-recto-medianoche',
    nombre: 'Jean Recto Medianoche',
    tipo: 'jean', categoria: 'Jeans', genero: 'hombre', linea: 'Básicos',
    precio: 139000,
    color: { nombre: 'Azul oscuro', hex: '#1F2A44' },
    tallas: ['28', '30', '32', '34', '36'], ...medidasPantalon,
    descripcion: 'Azul tan oscuro que de noche parece negro. Recto, ni pegado ni de payaso.',
    detalles: ['Denim 12 oz con leve elasticidad', 'Corte recto, tiro medio', 'Botón metálico MONOIR', 'Parche de cuero en la pretina'],
    ajuste: 'recto',
  },
  {
    slug: 'jean-baggy-ceniza',
    nombre: 'Jean Baggy Ceniza',
    tipo: 'jean', categoria: 'Jeans', genero: 'mujer', linea: 'Básicos',
    precio: 149000,
    color: { nombre: 'Negro deslavado', hex: '#3A3A3D' },
    tallas: ['26', '28', '30', '32'],
    columnasMedidas: ['Cintura', 'Cadera', 'Largo'],
    medidas: { '26': [66, 96, 102], '28': [71, 101, 103], '30': [76, 106, 104], '32': [81, 111, 105] },
    descripcion: 'Ancho, tiro alto y negro lavado. Con tenis o con botas, siempre se ve como que sabés lo que hacés.',
    detalles: ['Denim 100% algodón, 13 oz', 'Corte baggy, tiro alto', 'Lavado negro ceniza'],
    nuevo: true,
    ajuste: 'baggy',
  },
  {
    slug: 'boxer-pack-x3',
    nombre: 'Boxer MONOIR · Pack x3',
    tipo: 'boxer', categoria: 'Interior', genero: 'hombre', linea: 'Básicos',
    precio: 69000,
    color: { nombre: 'Negro, gris y blanco', hex: '#2A2A2C' },
    tallas: ['S', 'M', 'L', 'XL'],
    columnasMedidas: ['Cintura (estirada)'],
    medidas: { S: [76], M: [82], L: [88], XL: [94] },
    descripcion: 'Tres boxers, cero excusas. Pretina con MONOIR tejido, que es lo único que debería verse cuando te agachás.',
    detalles: ['Algodón con elastano', 'Pretina tejida MONOIR', 'Pack de 3 colores', 'Sin cambio por higiene'],
  },
  {
    slug: 'medias-pack-x3',
    nombre: 'Medias MONOIR · Pack x3',
    tipo: 'medias', categoria: 'Interior', genero: 'unisex', linea: 'Básicos',
    precio: 39000,
    color: { nombre: 'Blanco y negro', hex: '#EDEDED' },
    tallas: ['Única (36–43)'],
    columnasMedidas: ['Talla de zapato'],
    medidas: { 'Única (36–43)': [36] },
    descripcion: 'Media larga, felino tejido. Pa\' subirlas con orgullo o bajarlas con flow.',
    detalles: ['Algodón peinado con acolchado', 'Caña alta', 'Felino tejido', 'Sin cambio por higiene'],
  },
  {
    slug: 'camiseta-ojos-en-la-oscuridad',
    nombre: 'Camiseta Ojos en la Oscuridad',
    tipo: 'camiseta', categoria: 'Camisetas', genero: 'unisex', linea: 'Colección',
    precio: 139000,
    color: { nombre: 'Negro', hex: '#0F0F10' },
    tallas: ['S', 'M', 'L', 'XL'], ...medidasCamiseta,
    descripcion: 'La primera pieza de colección. Adelante, nada. Atrás, los ojos. Solo 50, numeradas, y cuando se acaben no vuelven.',
    detalles: ['Algodón 100% peinado, 240 g', 'Estampado de espalda en tinta ámbar', 'Edición numerada de 50 unidades'],
    edicion: 50,
    proximamente: true,
    estampadoEspalda: true,
    ajuste: 'oversize',
  },
];

export const categorias = ['Camisetas', 'Buzos', 'Joggers', 'Jeans', 'Interior'] as const;

export const buscar = (slug: string) => productos.find((p) => p.slug === slug);

/** Otros colores de la misma prenda (incluye el producto mismo). */
export const coloresDe = (p: Producto) =>
  p.modelo ? productos.filter((x) => x.modelo === p.modelo) : [p];

/** Medidas de una talla con nombres claros, en cm. */
export function medidasTalla(p: Producto, talla: string) {
  const fila = p.medidas[talla];
  const m: { anchoPecho?: number; largo?: number; manga?: number; cintura?: number; cadera?: number } = {};
  if (!fila) return m;
  p.columnasMedidas.forEach((col, i) => {
    const c = col.toLowerCase();
    if (c.includes('pecho')) m.anchoPecho = fila[i];
    else if (c.includes('manga')) m.manga = fila[i];
    else if (c.includes('cintura')) m.cintura = fila[i];
    else if (c.includes('cadera')) m.cadera = fila[i];
    else if (c.includes('largo')) m.largo = fila[i];
  });
  return m;
}
