import { Platform } from 'react-native';

import {
  LINE_SPLITTING_PUNCTUATION_REGEX,
  PUNCTUATION_REGEX,
  T_PUNCTUATION_REGEX,
} from '@app/consts/chars';

import LinguisticTaggerModuleIOS from '@app/modules/LinguisticTaggerModuleIOS';

export function breakWords(words: string) {
  if (Platform.OS === 'ios') {
    return LinguisticTaggerModuleIOS.cut(words);
  } else {
    return words.split(PUNCTUATION_REGEX).filter(s => !!s);
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
      (code >= 0x3000 && code <= 0x303f) || // CJK Symbols and Punctuation
      (code >= 0xff01 && code <= 0xff60) || // Halfwidth and Fullwidth Forms (only Fullwidth, part 1)
      (code >= 0xffe0 && code <= 0xffe6) || // Halfwidth and Fullwidth Forms (only Fullwidth, part 2)
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

function* generateSubstrings(str: string, splitRegex?: RegExp) {
  const words = splitRegex ? str.split(splitRegex) : breakWords(str);
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

export function splitToTwoLines(
  str: string,
  line1MaxWidth: number,
): [string, string] {
  const strContainsPunctuation = LINE_SPLITTING_PUNCTUATION_REGEX.test(str);

  let line1 = '';
  for (const substring of generateSubstrings(
    str,
    strContainsPunctuation ? LINE_SPLITTING_PUNCTUATION_REGEX : undefined,
  )) {
    if (countChars(substring) > line1MaxWidth) break;

    line1 = substring;
  }

  const line2 = str.slice(line1.length);
  return [line1, line2].map(s => trimStringByRegex(s, T_PUNCTUATION_REGEX)) as [
    string,
    string,
  ];
}

function trimStringByRegex(str: string, regex: RegExp) {
  // Create a regex pattern that matches the characters at the start and end of the string
  let combinedRegex = new RegExp(
    '^' + regex.source + '+|' + regex.source + '+$',
    'g',
  );

  // Replace the matched characters with an empty string
  return str.replace(combinedRegex, '');
}

export const utils = {
  breakWords,
  countChars,
  generateSubstrings,
  getNextLine,
  splitToTwoLines,
};

export default utils;
