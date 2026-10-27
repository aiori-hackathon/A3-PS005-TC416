/**
 * Formats a count with appropriate singular/plural word forms.
 * Example: formatCount(1, "observation") -> "1 observation"
 * Example: formatCount(3, "observation") -> "3 observations"
 */
export function formatCount(
  count: number,
  singular: string,
  plural = `${singular}s`
): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}
