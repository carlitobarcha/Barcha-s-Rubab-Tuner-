/**
 * Raag data. Each raag is a list of semitones above Sa:
 * 0 = Sa, 1 = re (komal), 2 = Re, 3 = ga (komal), 4 = Ga, 5 = Ma,
 * 6 = MA (tivra), 7 = Pa, 8 = dha (komal), 9 = Dha, 10 = ni (komal), 11 = Ni.
 *
 * To add or correct a raag, edit RAAGS below.
 */
export interface Raag {
  id: string;
  name: string;
  semitones: number[];
  /** Short introduction shown when the raag is selected */
  description: string;
}

/** Lowercase = komal (flat), MA = tivra (sharp Ma). */
export const SWARA_LABELS = [
  'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'MA', 'Pa', 'dha', 'Dha', 'ni', 'Ni',
] as const;

export const RAAGS: Raag[] = [
  {
    id: 'yaman',
    name: 'Yaman',
    semitones: [0, 2, 4, 6, 7, 9, 11],
    description:
      'An early-evening raag with a calm, devotional mood. It uses tivra Ma and natural versions of all other notes.',
  },
  {
    id: 'bilawal',
    name: 'Bilawal',
    semitones: [0, 2, 4, 5, 7, 9, 11],
    description:
      'A bright, peaceful morning raag. Its notes match the Western major scale.',
  },
  {
    id: 'khamaj',
    name: 'Khamaj',
    semitones: [0, 2, 4, 5, 7, 9, 10, 11],
    description:
      'A light, romantic late-evening raag, often heard in semi-classical music. It uses natural Ni going up and komal ni coming down.',
  },
  {
    id: 'kafi',
    name: 'Kafi',
    semitones: [0, 2, 3, 5, 7, 9, 10],
    description:
      'A gentle, tender raag with komal Ga and komal Ni. Popular in light classical and folk-inspired music, including spring songs.',
  },
  {
    id: 'bhairav',
    name: 'Bhairav',
    semitones: [0, 1, 4, 5, 7, 8, 11],
    description:
      'A serious, devotional dawn raag. Komal Re and komal Dha give it a deep, solemn colour.',
  },
  {
    id: 'bhairavi',
    name: 'Bhairavi',
    semitones: [0, 1, 3, 5, 7, 8, 10],
    description:
      'A tender, expressive raag with four komal notes. Traditionally a morning raag, it is often played to close a concert.',
  },
  {
    id: 'todi',
    name: 'Todi',
    semitones: [0, 1, 3, 6, 7, 8, 11],
    description:
      'A serious, introspective late-morning raag. It combines komal Re, Ga and Dha with tivra Ma.',
  },
  {
    id: 'marwa',
    name: 'Marwa',
    semitones: [0, 1, 4, 6, 9, 11],
    description:
      'A restless, yearning sunset raag. Pa is left out, which gives it an unsettled, searching feeling.',
  },
  {
    id: 'kirwani',
    name: 'Kirwani',
    semitones: [0, 2, 3, 5, 7, 8, 11],
    description:
      'A rich, emotional raag whose notes match the Western harmonic minor scale. Widely loved in classical, light and film music.',
  },
  {
    id: 'bhoopali',
    name: 'Bhoopali',
    semitones: [0, 2, 4, 7, 9],
    description:
      'A five-note evening raag (Sa Re Ga Pa Dha) with a joyful, peaceful mood. A common first raag for students.',
  },
  {
    id: 'malkauns',
    name: 'Malkauns',
    semitones: [0, 3, 5, 8, 10],
    description:
      'A deep, meditative five-note raag for the late night (Sa ga Ma dha ni). It has no Re and no Pa.',
  },
  {
    id: 'bageshri',
    name: 'Bageshri',
    semitones: [0, 2, 3, 5, 9, 10],
    description:
      'A tender, romantic late-night raag. It centres on Ma and Sa, and Pa is used very little.',
  },
  {
    id: 'darbari',
    name: 'Darbari',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    description:
      'A grave, majestic late-night raag. Its slow, deep oscillation on komal Ga is its signature.',
  },
  {
    id: 'desh',
    name: 'Desh',
    semitones: [0, 2, 4, 5, 7, 9, 10, 11],
    description:
      'A light, romantic raag linked to the rainy season. It uses natural Ni going up and komal ni coming down.',
  },
  {
    id: 'purvi',
    name: 'Purvi',
    semitones: [0, 1, 4, 6, 7, 8, 11],
    description:
      'A serious twilight raag. Komal Re and Dha with tivra Ma give it a heavy, reflective mood.',
  },
];

/** How one of the 12 note lanes should look. Indexed by note (0 = C ... 11 = B). */
export interface LaneInfo {
  /** Swara name to show next to the note, or null */
  swara: string | null;
  /** True if the lane is not part of the selected raag */
  dimmed: boolean;
  /** True if this lane is Sa */
  isSa: boolean;
}

export function getLaneInfo(raag: Raag | null, saNote: number): LaneInfo[] {
  return Array.from({ length: 12 }, (_, noteIndex) => {
    if (!raag) return { swara: null, dimmed: false, isSa: false };
    const semitone = (noteIndex - saNote + 12) % 12;
    const inRaag = raag.semitones.includes(semitone);
    return {
      swara: inRaag ? SWARA_LABELS[semitone] : null,
      dimmed: !inRaag,
      isSa: semitone === 0,
    };
  });
}