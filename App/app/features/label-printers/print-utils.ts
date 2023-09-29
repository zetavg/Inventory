import { Platform } from 'react-native';

import LinguisticTaggerModuleIOS from '@app/modules/LinguisticTaggerModuleIOS';

export function breakWords(words: string) {
  if (Platform.OS === 'ios') {
    return LinguisticTaggerModuleIOS.cut(words);
  } else {
    return words.split(' ');
  }
}

export function countChars(str: string) {
  return [...str].reduce((count, char) => {
    const code = char.charCodeAt(0);
    // Covering major CJK ranges and full-width characters
    return (
      count +
      // https://github.com/vinta/pangu.js/blob/7cd72c9/src/shared/core.js#L3-L12
      ((code >= 0x2e80 && code <= 0x2eff) || // CJK Radicals Supplement
      (code >= 0x2f00 && code <= 0x2fdf) || // Kangxi Radicals
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff) || // Katakana
      (code >= 0x3100 && code <= 0x312f) || // Bopomofo
      (code >= 0x3200 && code <= 0x32ff) || // Enclosed CJK Letters and Months
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
      (code >= 0xf900 && code <= 0xfaff) // CJK Compatibility Ideographs
        ? 2
        : 1)
    );
  }, 0);
}

function* generateSubstrings(str: string) {
  const words = breakWords(str);
  let wordsPtr = 0;
  let subStr = '';
  let lastYieldLength = 0;
  for (let i = 0; i < str.length; i++) {
    subStr += str[i];
    if (subStr.endsWith(words[wordsPtr])) {
      yield subStr;
      lastYieldLength = subStr.length;
      wordsPtr += 1;
    }
  }

  if (lastYieldLength < str.length) yield str;
}

export function getNextLine(
  str: string,
  maxWidth: number,
): { nextLine: string; remaining: string } {
  let nextLine = '';
  for (const substring of generateSubstrings(str)) {
    if (countChars(substring) > maxWidth) break;

    nextLine = substring;
  }

  return {
    nextLine,
    remaining: str.slice(nextLine.length),
  };
}

export const utils = {
  breakWords,
  countChars,
  generateSubstrings,
  getNextLine,
};

export default utils;
