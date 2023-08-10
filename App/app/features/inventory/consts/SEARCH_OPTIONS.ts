export const SEARCH_OPTIONS = {
  fields: {
    'data.name': 10,
    'data._individual_asset_reference': 8,
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

export const SEARCH_ITEMS_OPTIONS = {
  ...SEARCH_OPTIONS,
  filter: function (doc: any) {
    return doc.type === 'item';
  },
};

export const SEARCH_ITEM_AS_CONTAINER_OPTIONS = {
  ...SEARCH_OPTIONS,
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
