export const layout = [
  // row 0
  ["C","A","T","","","", "D","O","G",""],
  // row 1
  ["","", "A","","","", "O","","O",""],
  // row 2
  ["","", "R","","","", "L","","G",""],
  // row 3
  ["", "", "", "", "", "", "", "", "", ""],
  // row 4
  ["", "B","A","T","","", "B","E","E",""],
  // row 5
  ["", "", "", "", "", "", "", "", "", ""],
  // row 6
  ["S","U","N","","","", "M","O","O","N"],
  // row 7
  ["", "", "", "", "", "", "", "", "", ""],
  // row 8
  ["", "F","I","S","H","","", "", "", ""],
  // row 9
  ["", "", "", "", "", "", "", "", "", ""],
];

export const clues = [
  { id: "A1", dir: "across", row: 0, col: 0, length: 3, clue: "A common small pet (3)" },
  { id: "A2", dir: "across", row: 0, col: 6, length: 3, clue: "Man's best friend (3)" },
  { id: "A3", dir: "across", row: 4, col: 1, length: 3, clue: "Used to hit a ball (3)" },
  { id: "A4", dir: "across", row: 4, col: 6, length: 3, clue: "Produces honey (3)" },
  { id: "A5", dir: "across", row: 6, col: 0, length: 3, clue: "Star at center of solar system (3)" },
  { id: "A6", dir: "across", row: 6, col: 6, length: 4, clue: "Earth's satellite (4)" },
  { id: "A7", dir: "across", row: 8, col: 1, length: 4, clue: "Lives underwater (4)" },
];

export const solution = layout.map(row => row.map(cell => (cell === "" ? "" : (cell || null))));
