export interface Coordinate {
  x: number;
  y: number;
}

export function parseCoordinate(input: string): Coordinate | null {
  const trimmed = input.trim();
  // Accept: "1200,500" or "-300 800" or "0,0"
  const match = trimmed.match(/^(-?\d+)[,\s]+(-?\d+)$/);
  if (!match) return null;
  const x = parseInt(match[1], 10);
  const y = parseInt(match[2], 10);
  if (isNaN(x) || isNaN(y)) return null;
  return { x, y };
}
