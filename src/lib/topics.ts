/** One topic title per non-empty line. */
export function parseTitleLines(text: string): string[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}
