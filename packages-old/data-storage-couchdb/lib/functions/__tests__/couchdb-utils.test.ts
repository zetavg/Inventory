import {
  flattenSelector,
  getCouchDbId,
  getDataIdFromCouchDbId,
  getDatumFromDoc,
  getDocFromDatum,
  getTypeIdStartAndEndKey,
  sortObjectKeys,
} from '../couchdb-utils';

describe('getCouchDbId & getDataIdFromCouchDbId & getTypeIdStartAndEndKey', () => {
  it('works', () => {
    const couchdbId = getCouchDbId('item', 'test-id');
    expect(couchdbId).toBe('item-test-id');

    const { type, id } = getDataIdFromCouchDbId(couchdbId);
    expect(type).toBe('item');
    expect(id).toBe('test-id');

    expect(getTypeIdStartAndEndKey('item')).toStrictEqual([
      'item-',
      'item-\uffff',
    ]);
  });

  it('handles data type prefixes', () => {
    const couchdbImageId = getCouchDbId('image', 'test-id');
    expect(couchdbImageId).toBe('zz20-image-test-id');

    const { type, id } = getDataIdFromCouchDbId(couchdbImageId);
    expect(type).toBe('image');
    expect(id).toBe('test-id');

    expect(getTypeIdStartAndEndKey('image')).toStrictEqual([
      'zz20-image-',
      'zz20-image-\uffff',
    ]);
  });
});

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

  it('preserves additional properties', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      additional_property: 'hello',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    expect((doc as any).data?.additional_property).toBe('hello');
    const datum = getDatumFromDoc('collection', doc);
    expect(datum?.additional_property).toBe('hello');
    if (!datum?.__valid) throw new Error('datum is null');
    const doc2 = getDocFromDatum(datum);
    expect((doc2 as any).data?.additional_property).toBe('hello');
  });
});

describe('getDatumFromDoc', () => {
  it('returns a datum with correct __type and __id', () => {
    const invalidDatum = getDatumFromDoc(
      'collection',
      {
        _id: 'collection-1234',
        type: 'collection',
      },
      { logger: null },
    );

    expect(invalidDatum.__valid).toBe(false);
    expect(invalidDatum.__type).toBe('collection');
    expect(invalidDatum.__id).toBe('1234');

    const validDatum = getDatumFromDoc('collection', {
      _id: 'collection-1234',
      type: 'collection',
      data: {
        name: 'Test Collection',
        collection_reference_number: '1234',
        icon_name: '',
        icon_color: '',
        config_uuid: 'mock-config-id',
      },
    });

    expect(validDatum.__valid).toBe(true);
    expect(validDatum.__type).toBe('collection');
    expect(validDatum.__id).toBe('1234');
  });

  it('returns a datum which __id is assignable', () => {
    const datum = getDatumFromDoc('collection', {
      type: 'collection',
      data: {
        name: 'Test Collection',
        collection_reference_number: '1234',
        icon_name: '',
        icon_color: '',
        config_uuid: 'mock-config-id',
      },
    });

    expect(datum.__id).toBe(undefined);
    datum.__id = '1234';
    expect(datum.__id).toBe('1234');
    expect(getDocFromDatum(datum as any)._id).toBe('collection-1234');
  });

  it('validates the data', () => {
    const validCollection = getDatumFromDoc(
      'collection',
      {
        data: {
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '0001',
          config_uuid: 'xxxx',
        },
      },
      { logger: null },
    );

    expect(validCollection.__valid).toBe(true);

    const collectionWithInvalidName = getDatumFromDoc(
      'collection',
      {
        data: {
          name: 123,
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '0001',
          config_uuid: 'xxxx',
        },
      },
      { logger: null },
    );

    expect(collectionWithInvalidName.__valid).toBe(false);
    expect(collectionWithInvalidName.__issues).toMatchSnapshot(
      'collectionWithInvalidName_issues',
    );

    const collectionWithoutName = getDatumFromDoc(
      'collection',
      {
        data: {
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '0001',
          config_uuid: 'xxxx',
        },
      },
      { logger: null },
    );

    expect(collectionWithoutName.__valid).toBe(false);
    expect(collectionWithoutName.__issues).toMatchSnapshot(
      'collectionWithoutName_issues',
    );

    const collectionWithBlankName = getDatumFromDoc(
      'collection',
      {
        data: {
          name: '',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '0001',
          config_uuid: 'xxxx',
        },
      },
      { logger: null },
    );

    expect(collectionWithBlankName.__valid).toBe(false);
    expect(collectionWithBlankName.__issues).toMatchSnapshot(
      'collectionWithBlankName_issues',
    );
  });

  it('preserve meta properties with object spread', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      __rev: 'test-rev',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    const datum = getDatumFromDoc('collection', doc);
    const sDatum = {
      ...datum,
    };
    expect((sDatum as any).__id).toBe('mock-id');
    expect((sDatum as any).__rev).toBe('test-rev');
  });

  it('preserve meta properties with Object.assign', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      __rev: 'test-rev',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    const datum = getDatumFromDoc('collection', doc);
    const aDatum = Object.assign({}, datum);
    expect((aDatum as any).__id).toBe('mock-id');
    expect((aDatum as any).__rev).toBe('test-rev');
  });

  it('preserves additional properties with object spread', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      additional_property: 'hello',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    const datum = getDatumFromDoc('collection', doc);
    const sDatum = {
      ...datum,
    };
    expect((sDatum as any).additional_property).toBe('hello');
  });

  it('preserves additional properties with Object.assign', () => {
    const doc = getDocFromDatum({
      __type: 'collection',
      __id: 'mock-id',
      name: 'Collection',
      collection_reference_number: '1234',
      icon_name: '',
      icon_color: '',
      config_uuid: 'mock-config-id',
      additional_property: 'hello',
      __created_at: 1,
      __updated_at: 2,
      __valid: true,
    });
    const datum = getDatumFromDoc('collection', doc);
    const aDatum = Object.assign({}, datum);
    expect((aDatum as any).additional_property).toBe('hello');
  });
});

describe('getDocFromDatum', () => {
  it('preserves additional properties', () => {
    const doc = getDocFromDatum({
      __type: 'item',
      __rev: 'sample-rev',
      icon_color: 'blue',
      __id: 'sample-item-id',
      __updated_at: 0,
      icon_name: 'cube-outline',
      config_uuid: 'sample-config-uuid',
      __created_at: 0,
      collection_id: 'sample-collection-id',
      _additional_property: 'hello',
      name: 'Sample Item',
    });
    expect((doc.data as any)._additional_property).toBe('hello');
  });

  it('sorts data keys', () => {
    const doc = getDocFromDatum({
      __type: 'item',
      __rev: 'sample-rev',
      icon_color: 'blue',
      __id: 'sample-item-id',
      __updated_at: 0,
      icon_name: 'cube-outline',
      config_uuid: 'sample-config-uuid',
      __created_at: 0,
      collection_id: 'sample-collection-id',
      name: 'Sample Item',
    });
    expect(Object.keys(doc)).toStrictEqual([
      '_id',
      '_rev',
      'type',
      'data',
      'created_at',
      'updated_at',
    ]);
    expect(Object.keys((doc as any)?.data)).toStrictEqual([
      'name',
      'icon_name',
      'icon_color',
      'collection_id',
      'config_uuid',
    ]);
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

describe('sortObjectKeys', () => {
  it('sorts the keys in an object', () => {
    const object = {
      c: 1,
      a: 2,
      b: 3,
    };
    expect(Object.keys(object)).toStrictEqual(['c', 'a', 'b']);
    const sortedObject = sortObjectKeys(object, ['a', 'b', 'c']);
    expect(Object.keys(sortedObject)).toStrictEqual(['a', 'b', 'c']);
  });

  it('places unspecified keys at the end', () => {
    const object = {
      c: 1,
      d: 2,
      a: 3,
      e: 4,
      b: 5,
    };
    const sortedObject = sortObjectKeys(object, ['a', 'b', 'c']);
    expect(Object.keys(sortedObject)).toStrictEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('ignores keys that are not in the object', () => {
    const object = {
      c: 1,
      a: 3,
      b: 5,
    };
    const sortedObject = sortObjectKeys(object, ['a', 's', 'd', 'f', 'b', 'c']);
    expect(Object.keys(sortedObject)).toStrictEqual(['a', 'b', 'c']);
  });
});
