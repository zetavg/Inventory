export const SEARCH_OPTIONS = {
  fields: {
    'data.name': 10,
    'data.individual_asset_reference': 8,
    'data.collection_reference_number': 8,
    'data.item_reference_number': 8,
    'data.serial': 7,
    'data.model_name': 8,
    'data.epc_tag_uri': 7,
    'data.notes': 2,
    'data.purchased_from': 1,
    'data.rfid_tag_epc_memory_bank_contents': 1,
    'data.actual_rfid_tag_epc_memory_bank_contents': 1,
  },
  filter: function (doc: any) {
    return (
      doc.type === 'collection' ||
      doc.type === 'item' ||
      doc.type === 'checklist'
    );
  },
  language: ['zh', 'en'],
};

export function getItemSearchOptionsForCollection(collectionId: string) {
  return {
    ...SEARCH_OPTIONS,
    fields: {
      ...SEARCH_OPTIONS.fields,
      [`%%only_in_collection_${collectionId}%%`]: 1, // A hack to make this index differentiate from the default one
    },
    filter: function (doc: any) {
      return doc?.type === 'item' && doc?.data?.collection_id === collectionId;
    },
  };
}

export const DEFAULT_SEARCH_LANGUAGES = ['zh', 'en'];

export const SEARCH_ITEMS_OPTIONS = {
  ...SEARCH_OPTIONS,
  fields: {
    ...SEARCH_OPTIONS.fields,
    '%%only_items%%': 1, // A hack to make this index differentiate from the default one
  },
  filter: function (doc: any) {
    return doc.type === 'item';
  },
};

export const SEARCH_ITEM_AS_CONTAINER_OPTIONS = {
  ...SEARCH_OPTIONS,
  fields: {
    ...SEARCH_OPTIONS.fields,
    '%%only_item_as_container%%': 1, // A hack to make this index differentiate from the default one
  },
  filter: function (doc: any) {
    if (doc.type !== 'item') {
      return false;
    }
    if (typeof doc.data !== 'object') {
      return false;
    }
    return doc.data._can_contain_items;
  },
};

export default SEARCH_OPTIONS;
