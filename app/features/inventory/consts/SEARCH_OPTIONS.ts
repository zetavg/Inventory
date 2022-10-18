import { Platform } from 'react-native';

export const SEARCH_OPTIONS = {
  fields: {
    'data.name': 10,
    'data.notes': 2,
    'data.individualAssetReference': 8,
    'data.modelName': 8,
    'data.purchasedFrom': 2,
  },
  filter: function (doc: any) {
    return doc.type === 'collection' || doc.type === 'item';
  },
  // TODO: support zh searching on Android
  // `language: ['zh', 'en']` will not work well
  // See: patches/Search-quick-search+1.3.0.patch, uncomment `console.log('queryTerms', queryTerms)` and see the tokens got from string
  language: Platform.OS === 'ios' ? 'zh' : 'en',
  include_docs: true,
  limit: 100,
};

export const SEARCH_ITEMS_OPTIONS = {
  ...SEARCH_OPTIONS,
  filter: function (doc: any) {
    return doc.type === 'item';
  },
};

export default SEARCH_OPTIONS;
