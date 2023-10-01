import getHumanName from '../getHumanName';

it('works', () => {
  expect(getHumanName('model_name')).toBe('model name');
  expect(getHumanName('model_name', { titleCase: true })).toBe('Model Name');
  expect(getHumanName('model_name', { plural: true })).toBe('model names');

  expect(getHumanName('db_sharing')).toBe('DB sharing');
  expect(getHumanName('db_sharing', { titleCase: true })).toBe('DB Sharing');
  expect(getHumanName('db_sharing', { titleCase: true, plural: true })).toBe(
    'DB Sharing',
  );
});
