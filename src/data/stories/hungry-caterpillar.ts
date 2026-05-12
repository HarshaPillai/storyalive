export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface FoodItem {
  name: string;
  emoji: string;
  count: number;
}

export interface StoryPage {
  /** Unique stable key used for animation keying and Pretext.js scene IDs */
  id: string;
  /** Day this page belongs to, null for non-day narrative pages */
  day: DayOfWeek | null;
  /** Verbatim story text for this page */
  text: string;
  /** Food eaten on this page — empty for non-eating pages */
  foodItems: FoodItem[];
  /** Scene descriptor used to drive background artwork / SVG selection */
  background: string;
}

export const hungryCaterpillarStory: StoryPage[] = [
  // ─── Opening ──────────────────────────────────────────────────────────────
  {
    id: "egg-on-leaf",
    day: null,
    text: "In the light of the moon a little egg lay on a leaf.",
    foodItems: [],
    background: "night-leaf",
  },

  // ─── Sunday: hatching ─────────────────────────────────────────────────────
  {
    id: "sunday-hatch",
    day: "sunday",
    text: "One Sunday morning the warm sun came up and — pop! — out of the egg came a tiny and very hungry caterpillar.",
    foodItems: [],
    background: "morning-sun",
  },
  {
    id: "sunday-hungry",
    day: "sunday",
    text: "He started to look for some food.",
    foodItems: [],
    background: "morning-leaf",
  },

  // ─── Monday ───────────────────────────────────────────────────────────────
  {
    id: "monday-apple",
    day: "monday",
    text: "On Monday he ate through one apple. But he was still hungry.",
    foodItems: [{ name: "apple", emoji: "🍎", count: 1 }],
    background: "monday-apple",
  },

  // ─── Tuesday ──────────────────────────────────────────────────────────────
  {
    id: "tuesday-pears",
    day: "tuesday",
    text: "On Tuesday he ate through two pears, but he was still hungry.",
    foodItems: [{ name: "pear", emoji: "🍐", count: 2 }],
    background: "tuesday-pears",
  },

  // ─── Wednesday ────────────────────────────────────────────────────────────
  {
    id: "wednesday-plums",
    day: "wednesday",
    text: "On Wednesday he ate through three plums, but he was still hungry.",
    foodItems: [{ name: "plum", emoji: "🟣", count: 3 }],
    background: "wednesday-plums",
  },

  // ─── Thursday ─────────────────────────────────────────────────────────────
  {
    id: "thursday-strawberries",
    day: "thursday",
    text: "On Thursday he ate through four strawberries, but he was still hungry.",
    foodItems: [{ name: "strawberry", emoji: "🍓", count: 4 }],
    background: "thursday-strawberries",
  },

  // ─── Friday ───────────────────────────────────────────────────────────────
  {
    id: "friday-oranges",
    day: "friday",
    text: "On Friday he ate through five oranges, but he was still hungry.",
    foodItems: [{ name: "orange", emoji: "🍊", count: 5 }],
    background: "friday-oranges",
  },

  // ─── Saturday: the feast ──────────────────────────────────────────────────
  {
    id: "saturday-feast",
    day: "saturday",
    text: "On Saturday he ate through one piece of chocolate cake, one ice-cream cone, one pickle, one slice of Swiss cheese, one slice of salami, one lollipop, one piece of cherry pie, one sausage, one cupcake, and one slice of watermelon.",
    foodItems: [
      { name: "chocolate cake",  emoji: "🎂", count: 1 },
      { name: "ice-cream cone",  emoji: "🍦", count: 1 },
      { name: "pickle",          emoji: "🥒", count: 1 },
      { name: "Swiss cheese",    emoji: "🧀", count: 1 },
      { name: "salami",          emoji: "🍖", count: 1 },
      { name: "lollipop",        emoji: "🍭", count: 1 },
      { name: "cherry pie",      emoji: "🥧", count: 1 },
      { name: "sausage",         emoji: "🌭", count: 1 },
      { name: "cupcake",         emoji: "🧁", count: 1 },
      { name: "watermelon",      emoji: "🍉", count: 1 },
    ],
    background: "saturday-feast",
  },
  {
    id: "saturday-stomachache",
    day: "saturday",
    text: "That night he had a stomachache!",
    foodItems: [],
    background: "night-stomachache",
  },

  // ─── Sunday: recovery ─────────────────────────────────────────────────────
  {
    id: "sunday-leaf",
    day: "sunday",
    text: "The next day was Sunday again. The caterpillar ate through one nice green leaf, and after that he felt much better.",
    foodItems: [{ name: "green leaf", emoji: "🍃", count: 1 }],
    background: "sunday-leaf",
  },

  // ─── Growth ───────────────────────────────────────────────────────────────
  {
    id: "big-caterpillar",
    day: null,
    text: "Now he wasn't hungry any more — and he wasn't a little caterpillar any more. He was a big, fat caterpillar.",
    foodItems: [],
    background: "green-meadow",
  },

  // ─── Cocoon ───────────────────────────────────────────────────────────────
  {
    id: "cocoon-build",
    day: null,
    text: "He built a small house, called a cocoon, around himself.",
    foodItems: [],
    background: "cocoon-branch",
  },
  {
    id: "cocoon-wait",
    day: null,
    text: "He stayed inside for more than two weeks.",
    foodItems: [],
    background: "cocoon-branch-time",
  },

  // ─── Butterfly ────────────────────────────────────────────────────────────
  {
    id: "butterfly-emerge",
    day: null,
    text: "Then he nibbled a hole in the cocoon, pushed his way out and…",
    foodItems: [],
    background: "cocoon-hole",
  },
  {
    id: "butterfly-final",
    day: null,
    text: "he was a beautiful butterfly!",
    foodItems: [],
    background: "butterfly-sky",
  },
];

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** All weekday pages in order, useful for building the eating-week UI */
export const weekPages = hungryCaterpillarStory.filter(
  (p): p is StoryPage & { day: DayOfWeek } => p.day !== null
);

/** Total food items eaten across the whole story */
export const totalFoodEaten = hungryCaterpillarStory.flatMap((p) => p.foodItems);

/** Look up a page by its id */
export function getPageById(id: string): StoryPage | undefined {
  return hungryCaterpillarStory.find((p) => p.id === id);
}

/** All pages for a given day */
export function getPagesByDay(day: DayOfWeek): StoryPage[] {
  return hungryCaterpillarStory.filter((p) => p.day === day);
}