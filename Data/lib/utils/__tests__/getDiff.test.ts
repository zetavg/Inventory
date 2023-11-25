import getDiff from '../getDiff';

it('works', () => {
  expect(getDiff({}, {})).toMatchObject({
    original: {},
    new: {},
  });
  expect(getDiff({ a: 'foo' }, {})).toMatchObject({
    original: { a: 'foo' },
    new: { a: undefined },
  });
  expect(getDiff({}, { a: 'foo' })).toMatchObject({
    original: { a: undefined },
    new: { a: 'foo' },
  });

  expect(getDiff({ a: 'foo' }, { a: 'bar' })).toMatchObject({
    original: {
      a: 'foo',
    },
    new: {
      a: 'bar',
    },
  });

  expect(getDiff({ a: 'foo' }, { a: 'foo' })).toMatchObject({
    original: {},
    new: {},
  });
  expect(getDiff({ a: 'foo', b: 'bar' }, { a: 'foo' })).toMatchObject({
    original: { b: 'bar' },
    new: { b: undefined },
  });
  expect(getDiff({ a: 'foo' }, { a: 'foo', b: 'bar' })).toMatchObject({
    original: { b: undefined },
    new: { b: 'bar' },
  });
});
