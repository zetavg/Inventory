import { breakWords, countChars, splitToTwoLines } from './print-utils';

describe('countChars', () => {
  it('will return correct char size for CJK characters', async () => {
    expect(countChars('你好')).toBe(4);
    expect(countChars('你好，world')).toBe(11);
    expect(countChars('你好，世界')).toBe(10);
    expect(countChars('你好，世界！')).toBe(12);
    expect(countChars('你好，世界。')).toBe(12);
  });
});

describe('breakWords', () => {
  it('will break words', async () => {
    expect(breakWords('hello world')).toStrictEqual(['hello', 'world']);
  });
});

describe('splitToTwoLines', () => {
  it('splits a string into two lines', async () => {
    expect(splitToTwoLines('Hello World', 12)).toStrictEqual([
      'Hello World',
      '',
    ]);
    expect(splitToTwoLines('Hello World', 8)).toStrictEqual(['Hello', 'World']);
  });

  it('splits a string with punctuation into two lines', async () => {
    expect(
      splitToTwoLines('SKÅDIS Pegboard, white, 56x56 cm', 15),
    ).toStrictEqual(['SKÅDIS Pegboard', 'white, 56x56 cm']);

    expect(
      splitToTwoLines('SKÅDIS Pegboard, white, 56x56 cm', 16),
    ).toStrictEqual(['SKÅDIS Pegboard', 'white, 56x56 cm']);

    expect(splitToTwoLines('SKÅDIS Pegboard, 56x56 cm', 24)).toStrictEqual([
      'SKÅDIS Pegboard',
      '56x56 cm',
    ]);

    expect(
      splitToTwoLines('SKÅDIS Pegboard, 56x56 cm, white', 24),
    ).toStrictEqual(['SKÅDIS Pegboard', '56x56 cm, white']);

    expect(
      splitToTwoLines('SKÅDIS Pegboard (56x56 cm, white)', 24),
    ).toStrictEqual(['SKÅDIS Pegboard', '(56x56 cm, white)']);

    // Not supported yet
    // expect(
    //   splitToTwoLines('SKÅDIS Pegboard (56x56 cm, white)', 30),
    // ).toStrictEqual(['SKÅDIS Pegboard', '(56x56 cm, white)']);

    expect(
      splitToTwoLines('SKÅDIS Pegboard - 56x56 cm - white', 24),
    ).toStrictEqual(['SKÅDIS Pegboard', '56x56 cm - white']);

    expect(
      splitToTwoLines('Storage Bag for ABC-123 and DEF-456', 20),
    ).toStrictEqual(['Storage Bag for', 'ABC-123 and DEF-456']);
  });

  it('keeps number with unit in a whole', async () => {
    expect(splitToTwoLines('Rope 10 m', 8)).toStrictEqual(['Rope', '10 m']);

    expect(splitToTwoLines('Paper 10 mm × 20 cm', 12)).toStrictEqual([
      'Paper',
      '10 mm × 20 cm',
    ]);

    expect(splitToTwoLines('Paper 10 mm x 20 cm', 12)).toStrictEqual([
      'Paper',
      '10 mm x 20 cm',
    ]);

    expect(splitToTwoLines('Paper 10 × 20 cm', 12)).toStrictEqual([
      'Paper',
      '10 × 20 cm',
    ]);

    expect(splitToTwoLines('Paper 10 ×', 12)).toStrictEqual(['Paper 10 ×', '']);

    expect(splitToTwoLines('Paper × 3', 5)).toStrictEqual(['Paper', '× 3']);
  });
});
