import capitalizeAcronyms from '../capitalizeAcronyms';

it('leaves normal words untouched', () => {
  expect(capitalizeAcronyms('foo bar')).toBe('foo bar');
  expect(
    capitalizeAcronyms('The quick brown fox jumps over the lazy dog.'),
  ).toBe('The quick brown fox jumps over the lazy dog.');
});

it('capitalizes acronyms', () => {
  expect(capitalizeAcronyms('This gpu is larger than this cpu.')).toBe(
    'This GPU is larger than this CPU.',
  );
  expect(capitalizeAcronyms('Db Username')).toBe('DB Username');
  expect(capitalizeAcronyms('Rfid Tag')).toBe('RFID Tag');
});

it('capitalizes acronyms in dash words', () => {
  expect(capitalizeAcronyms('rfid-powered')).toBe('RFID-powered');
});
