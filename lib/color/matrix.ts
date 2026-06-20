import { contrast, grade, type Grade } from "./contrast";

export interface MatrixColor {
  name: string;
  hex: string;
}

export interface MatrixCell {
  fg: MatrixColor;
  bg: MatrixColor;
  ratio: number;
  grade: Grade;
  aa: boolean;
  aaa: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** N×N contrast matrix: rows are foregrounds, columns backgrounds. */
export function contrastMatrix(colors: MatrixColor[]): MatrixCell[][] {
  return colors.map((fg) =>
    colors.map((bg) => {
      const ratio = round2(contrast(fg.hex, bg.hex));
      return { fg, bg, ratio, grade: grade(ratio), aa: ratio >= 4.5, aaa: ratio >= 7 };
    }),
  );
}

/** Flatten to unique unordered pairs (i<j), for sorting best/worst combinations. */
export function matrixPairs(colors: MatrixColor[]): MatrixCell[] {
  const cells: MatrixCell[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = round2(contrast(colors[i].hex, colors[j].hex));
      cells.push({
        fg: colors[i],
        bg: colors[j],
        ratio,
        grade: grade(ratio),
        aa: ratio >= 4.5,
        aaa: ratio >= 7,
      });
    }
  }
  return cells;
}
