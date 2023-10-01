import hasChanges from '../hasChanges';

it('works', () => {
  expect(hasChanges({}, {})).toBe(false);

  expect(hasChanges({ a: 1 }, { b: 2 })).toBe(true);
  expect(hasChanges({ a: 1 }, { a: 2 })).toBe(true);
  expect(hasChanges({ a: 1 }, { a: '1' })).toBe(true);
  expect(hasChanges({ a: 1 }, { a: undefined })).toBe(true);
  expect(hasChanges({ a: 1 }, { a: 1, b: 2 })).toBe(true);
  expect(hasChanges({ a: 1, b: 2 }, { a: 1 })).toBe(true);

  expect(hasChanges({ a: 'hi' }, { a: 'hi' })).toBe(false);
  expect(hasChanges({ a: 'hi' }, { a: 'hello' })).toBe(true);

  expect(hasChanges({ a: [] }, { a: [] })).toBe(false);
  expect(hasChanges({ a: [] }, { a: [1] })).toBe(true);
  expect(hasChanges({ a: [1] }, { a: [] })).toBe(true);

  expect(hasChanges({ a: {} }, { a: {} })).toBe(false);
  expect(hasChanges({ a: { a: {} } }, { a: { a: {} } })).toBe(false);
  expect(hasChanges({ a: { a: {} } }, { a: { a: [] } })).toBe(true);
  expect(hasChanges({ a: { a: {} } }, { a: { a: { a: null } } })).toBe(true);
});
