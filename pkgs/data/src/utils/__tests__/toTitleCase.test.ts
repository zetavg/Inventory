import toTitleCase from '../toTitleCase';

it('titleize sentence', () => {
  expect(toTitleCase('foo bar')).toBe('Foo Bar');
  expect(toTitleCase('The quick brown fox jumps over the lazy dog')).toBe(
    'The Quick Brown Fox Jumps over the Lazy Dog',
  );
  expect(toTitleCase('fish and chips')).toBe('Fish and Chips');
  expect(toTitleCase('coffee or tea')).toBe('Coffee or Tea');
});
