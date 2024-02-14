export const LEFT_PARENTHESES = ['(', '（'];

export const RIGHT_PARENTHESES = [')', '）'];

export const PUNCTUATIONS = [
  ' ',
  ',',
  '/',
  '　',
  '，',
  '。',
  '／',
  '、',
  ' - ',
  ...LEFT_PARENTHESES,
  ...RIGHT_PARENTHESES,
];

export const PUNCTUATION_REGEX = new RegExp(
  `${PUNCTUATIONS.map(p =>
    p.replace('/', '\\/').replace('(', '\\(').replace(')', '\\)'),
  ).join('|')}`,
);

export const LINE_SPLITTING_PUNCTUATION_REGEX = /[,()，。／、（）]| - | \/ /;
export const LINE_SPLITTING_PUNCTUATION_REGEX_2 = new RegExp(
  `${LINE_SPLITTING_PUNCTUATION_REGEX.source}| (?=\\d)`,
);
export const T_PUNCTUATION_REGEX = /[ ,-/　，。／]/;

export const UNITS = [
  'm',
  'cm',
  'mm',
  'inch',
  'ft',
  'yd',
  'g',
  'kg',
  'ml',
  'l',
  'pcs',
  'pc',
  '公尺',
  '公分',
  '公厘',
  '英吋',
  '英呎',
  '碼',
  '克',
  '公克',
  '公斤',
  '毫升',
  '公升',
];

export const NUMBER_WITH_OPTIONAL_UNIT_REGEX = new RegExp(
  `^([0-9,.]+) ?(${UNITS.join('|')})?$`,
);

export const OPERATION_SYMBOLS = ['×', 'x'];
