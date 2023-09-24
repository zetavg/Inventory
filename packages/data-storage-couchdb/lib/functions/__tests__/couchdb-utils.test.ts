import {
  flattenSelector,
  getDatumFromDoc,
  getDocFromDatum,
} from '../couchdb-utils';

describe('getDatumFromDoc & getDocFromDatum', () => {
  it('works', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    expect((doc as any).type).toBe('collection');
    expect((doc as any)._id).toBe('collection-mock-id');
    const datum = getDatumFromDoc('collection', doc);
    expect(datum?.__valid).toBe(true);
    expect(datum?.__type).toBe('collection');
    expect(datum?.__id).toBe('mock-id');
    expect(datum?.name).toBe('Collection');
    expect(datum?.collection_reference_number).toBe('1234');
    expect(datum?.config_uuid).toBe('mock-config-id');
    expect(datum?.__created_at).toBe(1);
    expect(datum?.__updated_at).toBe(2);
  });
});

describe('flattenSelector', () => {
  it('flattens a query selector', () => {
    expect(
      flattenSelector({
        metadata: {
          app_1: {
            data: 123,
          },
        },
      }),
    ).toEqual({ 'metadata.app_1.data': 123 });
  });

  it('leaves special query untouched', () => {
    expect(
      flattenSelector({
        metadata: {
          app_1: {
            data: { $exists: true },
          },
        },
      }),
    ).toEqual({ 'metadata.app_1.data': { $exists: true } });

    expect(
      flattenSelector({
        created_at: { $exists: true },
      }),
    ).toEqual({ created_at: { $exists: true } });
  });
});
