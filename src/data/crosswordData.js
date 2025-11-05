// crossword100x50.js
// Generates a 100×50 crossword structure and exports layout, clues, solution

const ROWS = 40;
const COLS = 40;

// simple helper
const createGrid = (rows, cols, fill = "") =>
  Array.from({ length: rows }, () => Array(cols).fill(fill));

// some example words; extend freely
const WORDS = [
  "SUN", "MOON", "EARTH", "MARS", "VENUS", "JUPITER",
  "SATURN", "URANUS", "NEPTUNE", "PLUTO",
  "STAR", "GALAXY", "COMET", "ASTEROID", "ORBIT",
  "OCEAN", "FOREST", "RIVER", "MOUNTAIN", "CLOUD",
  "RAIN", "STORM", "SPACE", "PLANET", "LIGHT", "ENERGY"
];

// initialise arrays
const layout = createGrid(ROWS, COLS);
const solution = createGrid(ROWS, COLS);
const clues = [];

// simple placement: lay words horizontally with gaps
WORDS.forEach((word, i) => {
  const row = (i * 2) % ROWS;                // spread vertically
  const col = (i * 5) % (COLS - word.length); // spread horizontally
  for (let j = 0; j < word.length; j++) {
    layout[row][col + j] = word[j];
    solution[row][col + j] = word[j];
  }
  clues.push({
    id: `A${i + 1}`,
    dir: "across",
    row,
    col,
    length: word.length,
    clue: `Word related to space/nature (${i + 1})`
  });
});

// simple downward words for variety
WORDS.slice(0, 10).forEach((word, i) => {
  const row = (i * 3) % (ROWS - word.length);
  const col = (i * 9) % COLS;
  for (let j = 0; j < word.length; j++) {
    layout[row + j][col] = word[j];
    solution[row + j][col] = word[j];
  }
  clues.push({
    id: `D${i + 1}`,
    dir: "down",
    row,
    col,
    length: word.length,
    clue: `Vertical word (${i + 1})`
  });
});

// export same as your format
export { layout, clues, solution };

