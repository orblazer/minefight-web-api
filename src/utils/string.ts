export function escapeSpecialChars(string: string): string {
  // eslint-disable-next-line no-useless-escape
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}
