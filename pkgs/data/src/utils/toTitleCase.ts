const WORDS_NO_CAP_SET = new Set([
  'a',
  'the',
  'and',
  'or',
  'to',
  'over',
  'but',
]);

export default function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (word: string) {
    if (WORDS_NO_CAP_SET.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
  });
}
