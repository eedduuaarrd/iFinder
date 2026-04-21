import type { Lang } from "./translations";

export interface HuntItemI18n {
  name: string;
  description: string;
  hint?: string;
}

export interface HuntItemMeta {
  emoji: string;
  emojiByColor?: Record<string, string>;
  translations: Record<Lang, HuntItemI18n>;
}

const COLOR_EMOJI: Record<string, string> = {
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
  black: "⚫",
  white: "⚪",
  orange: "🟠",
  purple: "🟣",
  pink: "🌸",
};

export const COLOR_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  red:    { ca: "vermell",    es: "rojo",     en: "red" },
  blue:   { ca: "blau",       es: "azul",     en: "blue" },
  green:  { ca: "verd",       es: "verde",    en: "green" },
  yellow: { ca: "groc",       es: "amarillo", en: "yellow" },
  black:  { ca: "negre",      es: "negro",    en: "black" },
  white:  { ca: "blanc",      es: "blanco",   en: "white" },
  orange: { ca: "taronja",    es: "naranja",  en: "orange" },
  purple: { ca: "lila",       es: "morado",   en: "purple" },
  pink:   { ca: "rosa",       es: "rosa",     en: "pink" },
};

export const DIFFICULTY_TRANSLATIONS: Record<string, Record<Lang, string>> = {
  easy:   { ca: "Fàcil",   es: "Fácil",   en: "Easy" },
  medium: { ca: "Mitjà",   es: "Medio",   en: "Medium" },
  hard:   { ca: "Difícil", es: "Difícil", en: "Hard" },
  insane: { ca: "Brutal",  es: "Brutal",  en: "Insane" },
};

export const HUNT_ITEMS_META: Record<string, HuntItemMeta> = {
  chair: {
    emoji: "🪑",
    translations: {
      ca: { name: "Cadira",   description: "Troba una cadira a qualsevol lloc", hint: "Mira a terrasses, parcs o l'interior de bars." },
      es: { name: "Silla",    description: "Encuentra una silla en cualquier lugar", hint: "Busca en terrazas, parques o el interior de bares." },
      en: { name: "Chair",    description: "Find a chair anywhere", hint: "Check terraces, parks, or inside cafes." },
    },
  },
  bicycle: {
    emoji: "🚲",
    translations: {
      ca: { name: "Bicicleta",   description: "Localitza una bicicleta lligada o aparcada", hint: "Mira prop de botigues o portals d'edifici." },
      es: { name: "Bicicleta",   description: "Localiza una bicicleta atada o aparcada",   hint: "Mira cerca de tiendas o portales de edificios." },
      en: { name: "Bicycle",     description: "Spot a bicycle locked or parked",            hint: "Look near shops or building entrances." },
    },
  },
  dog: {
    emoji: "🐕",
    translations: {
      ca: { name: "Gos",   description: "Troba un gos passejant pel carrer", hint: "Parcs i hores de passeig (matí/nit)." },
      es: { name: "Perro", description: "Encuentra un perro paseando por la calle", hint: "Parques y horas de paseo (mañana/noche)." },
      en: { name: "Dog",   description: "Find a dog out for a walk",                hint: "Parks and walk hours (morning/evening)." },
    },
  },
  "traffic light": {
    emoji: "🚦",
    translations: {
      ca: { name: "Semàfor",  description: "Fotografia un semàfor", hint: "Encreuaments principals." },
      es: { name: "Semáforo", description: "Fotografía un semáforo", hint: "Cruces principales." },
      en: { name: "Traffic Light", description: "Photograph a traffic light", hint: "Main intersections." },
    },
  },
  bus: {
    emoji: "🚌",
    translations: {
      ca: { name: "Autobús",  description: "Captura un autobús en moviment o parat", hint: "Parades de bus i avingudes." },
      es: { name: "Autobús",  description: "Captura un autobús en movimiento o parado", hint: "Paradas de bus y avenidas." },
      en: { name: "Bus",      description: "Capture a bus in motion or stopped",        hint: "Bus stops and main avenues." },
    },
  },
  laptop: {
    emoji: "💻",
    translations: {
      ca: { name: "Portàtil", description: "Troba algú utilitzant un portàtil", hint: "Cafeteries i biblioteques són un bon lloc." },
      es: { name: "Portátil", description: "Encuentra a alguien usando un portátil", hint: "Cafeterías y bibliotecas son buenos sitios." },
      en: { name: "Laptop",   description: "Find someone using a laptop",            hint: "Cafes and libraries are good spots." },
    },
  },
  "potted plant": {
    emoji: "🪴",
    translations: {
      ca: { name: "Planta en test", description: "Troba una planta en una test o cossiol", hint: "Balcons, terrasses, finestres." },
      es: { name: "Planta en maceta", description: "Encuentra una planta en una maceta",     hint: "Balcones, terrazas, ventanas." },
      en: { name: "Potted Plant",     description: "Find a plant in a pot",                  hint: "Balconies, terraces, windows." },
    },
  },
  backpack: {
    emoji: "🎒",
    translations: {
      ca: { name: "Motxilla", description: "Localitza una motxilla portada per algú", hint: "Estudiants i excursionistes en són plens." },
      es: { name: "Mochila",  description: "Localiza una mochila llevada por alguien", hint: "Estudiantes y excursionistas las llevan." },
      en: { name: "Backpack", description: "Spot a backpack being worn",               hint: "Students and hikers carry them." },
    },
  },
  motorcycle: {
    emoji: "🏍️",
    translations: {
      ca: { name: "Moto",       description: "Troba una moto aparcada o en moviment", hint: "Aparcaments de moto o vies ràpides." },
      es: { name: "Moto",       description: "Encuentra una moto aparcada o en movimiento", hint: "Zonas de moto o vías rápidas." },
      en: { name: "Motorcycle", description: "Find a parked or moving motorcycle",          hint: "Motorbike parking or fast roads." },
    },
  },
  bench: {
    emoji: "🪑",
    translations: {
      ca: { name: "Banc",  description: "Troba un banc en un espai públic", hint: "Parcs, places i passejos marítims." },
      es: { name: "Banco", description: "Encuentra un banco en un espacio público", hint: "Parques, plazas y paseos marítimos." },
      en: { name: "Bench", description: "Find a bench in a public space",           hint: "Parks, squares and promenades." },
    },
  },
  car: {
    emoji: "🚗",
    translations: {
      ca: { name: "Cotxe", description: "Captura un cotxe", hint: "Per tot arreu." },
      es: { name: "Coche", description: "Captura un coche", hint: "Por todas partes." },
      en: { name: "Car",   description: "Capture a car",     hint: "Everywhere." },
    },
  },
  "fire hydrant": {
    emoji: "🧯",
    translations: {
      ca: { name: "Boca d'incendis", description: "Troba una boca d'incendis al carrer", hint: "Voreres prop d'edificis." },
      es: { name: "Hidrante",        description: "Encuentra un hidrante en la calle",     hint: "Aceras junto a edificios." },
      en: { name: "Fire Hydrant",    description: "Find a fire hydrant on the street",     hint: "Sidewalks near buildings." },
    },
  },
  "stop sign": {
    emoji: "🛑",
    translations: {
      ca: { name: "Senyal STOP", description: "Fotografia un senyal d'STOP", hint: "Encreuaments secundaris." },
      es: { name: "Señal STOP",  description: "Fotografía una señal de STOP",  hint: "Cruces secundarios." },
      en: { name: "Stop Sign",   description: "Photograph a STOP sign",        hint: "Smaller intersections." },
    },
  },
  bird: {
    emoji: "🐦",
    translations: {
      ca: { name: "Ocell",  description: "Captura un ocell salvatge", hint: "Coloms, gavines, pardals..." },
      es: { name: "Pájaro", description: "Captura un pájaro salvaje", hint: "Palomas, gaviotas, gorriones..." },
      en: { name: "Bird",   description: "Capture a wild bird",        hint: "Pigeons, gulls, sparrows..." },
    },
  },
  cat: {
    emoji: "🐈",
    translations: {
      ca: { name: "Gat",   description: "Troba un gat al carrer o terrat", hint: "Cantonades i espais tranquils." },
      es: { name: "Gato",  description: "Encuentra un gato en la calle o azotea", hint: "Esquinas y rincones tranquilos." },
      en: { name: "Cat",   description: "Find a cat in the street or rooftop",     hint: "Corners and quiet spots." },
    },
  },
  umbrella: {
    emoji: "☂️",
    translations: {
      ca: { name: "Paraigua", description: "Troba un paraigua obert", hint: "Esperem que plogui!" },
      es: { name: "Paraguas", description: "Encuentra un paraguas abierto", hint: "Esperemos que llueva!" },
      en: { name: "Umbrella", description: "Find an open umbrella",          hint: "Hope it rains!" },
    },
  },
};

const FALLBACK_EMOJI = "🎯";

export function getItemMeta(cocoLabel: string): HuntItemMeta | null {
  return HUNT_ITEMS_META[cocoLabel.toLowerCase()] ?? null;
}

export function getItemEmoji(cocoLabel: string, requiredColor?: string | null): string {
  if (requiredColor && COLOR_EMOJI[requiredColor.toLowerCase()]) {
    const meta = getItemMeta(cocoLabel);
    return `${COLOR_EMOJI[requiredColor.toLowerCase()]}${meta?.emoji ?? FALLBACK_EMOJI}`;
  }
  return getItemMeta(cocoLabel)?.emoji ?? FALLBACK_EMOJI;
}

export function translateColor(color: string | null | undefined, lang: Lang): string {
  if (!color) return "";
  return COLOR_TRANSLATIONS[color.toLowerCase()]?.[lang] ?? color;
}

export function translateDifficulty(difficulty: string, lang: Lang): string {
  return DIFFICULTY_TRANSLATIONS[difficulty.toLowerCase()]?.[lang] ?? difficulty;
}

export function translateHuntItem(
  item: { name: string; description: string; hint?: string | null; cocoLabel: string; requiredColor?: string | null },
  lang: Lang,
): { name: string; description: string; hint: string | null } {
  const meta = getItemMeta(item.cocoLabel);
  if (!meta) {
    return { name: item.name, description: item.description, hint: item.hint ?? null };
  }
  const tr = meta.translations[lang] ?? meta.translations.en;
  const colorWord = item.requiredColor ? translateColor(item.requiredColor, lang) : "";
  const fullName = colorWord ? `${tr.name} ${colorWord}` : tr.name;
  return {
    name: fullName,
    description: tr.description,
    hint: tr.hint ?? item.hint ?? null,
  };
}
