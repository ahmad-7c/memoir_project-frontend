const VALUES: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Chapter numerals are set in brass Roman numerals, lowercase (i, ii, iii...). */
export function toRoman(num: number): string {
  if (!Number.isFinite(num) || num < 1) return "";
  let n = Math.floor(num);
  let result = "";
  for (const [value, symbol] of VALUES) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result.toLowerCase();
}
