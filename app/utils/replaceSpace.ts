/**
 * Replace `\u0020` (Space) with `\u0040` (Non-breaking space, `&nbsp;`) to solve some display issues.
 *
 * See: https://stackoverflow.com/questions/19569688/right-aligned-uitextfield-spacebar-does-not-advance-cursor-in-ios-7
 */
export default function replaceSpace(str: string | undefined) {
  if (typeof str !== 'string') return undefined;

  return str.replace(/\u0020/, '\u00a0');
}
