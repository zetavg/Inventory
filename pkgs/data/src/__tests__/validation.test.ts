import { CONFIG, getConfig } from '../mock-data/mock-config';
import { DataTypeWithID } from '../types';
import getValidation, { ValidationError } from '../validation';

describe('ValidationError', () => {
  it('instances should also be instanceof Error', () => {
    const err = new ValidationError([]);
    expect(err instanceof Error).toBe(true);
  });
});

describe('validate', () => {
  describe('for item', () => {
    it('validates if collection_id is an ID of a existing collection', async () => {
      const { validate: validate } = getValidation({
        getConfig,
        getDatum: async (type, id) => {
          if (type === 'collection' && id === 'valid_collection_id') {
            const collection: DataTypeWithID<'collection'> = {
              __type: 'collection',
              __id: 'valid_collection_id',
              icon_name: '',
              icon_color: '',
              name: '',
              collection_reference_number: '1234',
              config_uuid: CONFIG.uuid,
              __valid: true,
            };
            return collection as any;
          }
          return null;
        },
        getData: async () => [],
        getRelated: async () => null,
      });

      const issues = await validate({
        __type: 'item',
        collection_id: 'no_such_collection',
        config_uuid: CONFIG.uuid,
      });

      expect(issues).toMatchSnapshot();

      const noIssues = await validate({
        __type: 'item',
        collection_id: 'valid_collection_id',
        config_uuid: CONFIG.uuid,
      });

      expect(noIssues).toStrictEqual([]);
    });
  });
});
