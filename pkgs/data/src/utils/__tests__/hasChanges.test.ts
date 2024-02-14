import hasChanges from '../hasChanges';

it('works', () => {
  expect(hasChanges({}, {})).toBeFalsy();

  expect(hasChanges({ a: 1 }, { b: 2 })).toBeTruthy();
  expect(hasChanges({ a: 1 }, { a: 2 })).toBeTruthy();
  expect(hasChanges({ a: 1 }, { a: '1' })).toBeTruthy();
  expect(hasChanges({ a: 1 }, { a: undefined })).toBeTruthy();
  expect(hasChanges({ a: 1 }, { a: 1, b: 2 })).toBeTruthy();
  expect(hasChanges({ a: 1, b: 2 }, { a: 1 })).toBeTruthy();

  expect(hasChanges({ a: 'hi' }, { a: 'hi' })).toBeFalsy();
  expect(hasChanges({ a: 'hi' }, { a: 'hello' })).toBeTruthy();

  expect(hasChanges({ a: [] }, { a: [] })).toBeFalsy();
  expect(hasChanges({ a: [] }, { a: [1] })).toBeTruthy();
  expect(hasChanges({ a: [1] }, { a: [] })).toBeTruthy();

  expect(hasChanges({ a: {} }, { a: {} })).toBeFalsy();
  expect(hasChanges({ a: { a: {} } }, { a: { a: {} } })).toBeFalsy();
  expect(hasChanges({ a: { a: {} } }, { a: { a: [] } })).toBeTruthy();
  expect(hasChanges({ a: { a: {} } }, { a: { a: { a: null } } })).toBeTruthy();
});

it('returns change level', () => {
  expect(hasChanges({ a: 1 }, { b: 2 })).toBeGreaterThan(10);
  expect(hasChanges({ integrations: 1 }, { integrations: 2 })).toBeTruthy();
  expect(hasChanges({ integrations: 1 }, { integrations: 2 })).toBeLessThan(10);
});
