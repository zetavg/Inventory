import setMockData from '@app/data/functions/setMockData';

import getChildrenItemIds from './getChildrenItemIds';

describe('getChildrenItemIds', () => {
  beforeAll(async () => {
    // Collection
    await setMockData('collection', [
      {
        __type: 'collection',
        __id: '1',
        name: 'Collection',
        collection_reference_number: '0000',
        icon_name: 'box',
        icon_color: 'blue',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
    ]);

    // Items
    await setMockData('item', [
      {
        __type: 'item',
        __id: 'a',
        name: 'Item A',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        contents_order: ['a-1', 'a-2'],
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: 'b',
        name: 'Item B',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: 'c',
        container_id: 'c-1', // Circular
        name: 'Item C',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: 'd',
        name: 'Item D',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: 'e',
        name: 'Item E',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: false, // Not a container
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },

      // Items under Item A
      {
        container_id: 'a',
        __type: 'item',
        __id: 'a-2',
        name: 'Item A-2',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'a',
        __type: 'item',
        __id: 'a-3',
        name: 'Item A-2',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 1000,
        __updated_at: 1000,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'a',
        __type: 'item',
        __id: 'a-4',
        name: 'Item A-4',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 2000,
        __updated_at: 2000,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'a',
        __type: 'item',
        __id: 'a-1',
        name: 'Item A-1',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },

      // Items under Item B
      {
        container_id: 'b',
        __type: 'item',
        __id: 'b-1',
        name: 'Item B-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'b-1',
        __type: 'item',
        __id: 'b-1-1',
        name: 'Item B-1-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'b-1-1',
        __type: 'item',
        __id: 'b-1-1-1',
        name: 'Item B-1-1-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'b-1-1-1',
        __type: 'item',
        __id: 'b-1-1-1-1',
        name: 'Item B-1-1-1-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'b-1-1-1-1',
        __type: 'item',
        __id: 'b-1-1-1-1-1',
        name: 'Item B-1-1-1-1-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },

      // Items under Item C
      {
        container_id: 'c',
        __type: 'item',
        __id: 'c-1',
        name: 'Item C-1',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: true,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },

      // Items under Item D and E
      {
        container_id: 'd',
        __type: 'item',
        __id: 'd-1',
        name: 'Item D-1',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        _can_contain_items: false, // Not a container
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'd-1',
        __type: 'item',
        __id: 'd-1-1',
        name: 'Item D-1-1',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        container_id: 'e',
        __type: 'item',
        __id: 'e-1',
        name: 'Item E-1',
        icon_name: 'box',
        icon_color: 'blue',
        collection_id: '1',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
    ]);
  });

  it('sorts ids by contents_order then __created_at', async () => {
    const ids = await getChildrenItemIds(['a'], { db: {} as any });
    expect(ids.a).toStrictEqual(['a-1', 'a-2', 'a-3', 'a-4']);
  });

  it('loads nested ids', async () => {
    const ids = await getChildrenItemIds(['b'], { db: {} as any });
    expect(ids).toStrictEqual({
      b: ['b-1'],
      'b-1': ['b-1-1'],
      'b-1-1': ['b-1-1-1'],
      'b-1-1-1': ['b-1-1-1-1'],
      'b-1-1-1-1': ['b-1-1-1-1-1'],
      'b-1-1-1-1-1': [],
    });
  });

  it('works with circular references', async () => {
    const ids = await getChildrenItemIds(['c'], { db: {} as any });
    expect(ids).toStrictEqual({
      c: ['c-1'],
      'c-1': ['c'],
    });
  });

  it('will not return ids for items that cannot contain items', async () => {
    const ids = await getChildrenItemIds(['d', 'e'], { db: {} as any });
    expect(ids).toStrictEqual({ d: ['d-1'] });
  });

  it('works with multiple IDs', async () => {
    const ids = await getChildrenItemIds(['a', 'b', 'c', 'd', 'e'], {
      db: {} as any,
    });
    expect(ids).toMatchSnapshot();
  });
});
