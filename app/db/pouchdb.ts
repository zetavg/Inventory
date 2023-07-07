import { Platform } from 'react-native';
import WebSQLite from 'react-native-quick-websql';

import PouchDB from 'pouchdb';

import logger from '@app/logger';

import LinguisticTaggerModuleIOS from '@app/modules/LinguisticTaggerModuleIOS';

// import { deleteSqliteDb } from './sqlite';

const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite')(WebSQLite);

const lunr = require('lunr');
require('lunr-languages/lunr.stemmer.support')(lunr);
require('lunr-languages/lunr.multi')(lunr);
(global as any).lunr = lunr; // For pouchdb-quick-search

const tokenizerBasic = (str: string) =>
  str
    .split(/[\s-]+/)
    .flatMap(word =>
      Array.from(
        word.matchAll(
          /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}]|.+/gu,
        ),
        m => m[0],
      ),
    );

if (Platform.OS === 'ios') {
  // Since LinguisticTaggerModuleIOS.cut is a blocking method, init the tagger
  // asynchronous first to avoid long blocking on the first call.
  LinguisticTaggerModuleIOS.initTagger();

  const nodejiebaPolyfill = {
    load() {},
    cut(str: string) {
      const nativeTokenizerWords = LinguisticTaggerModuleIOS.cut(str);
      const basicTokenizerWords = tokenizerBasic(str).filter(
        (value, index, array) =>
          !nativeTokenizerWords.includes(value) &&
          array.indexOf(value) === index,
      );
      const words = [...nativeTokenizerWords, ...basicTokenizerWords];
      logger.debug(`Cut "${str}": ${JSON.stringify(words)}`, {
        module: 'pouchdb',
        function: 'tokenizer',
        details: 'nodejiebaPolyfill (iOS)',
      });
      return (
        words
          // Single character words will be ignored, this is a hack to prevent it.
          .map(w => (w.length <= 1 ? `${w}${w}` : w))
      );
    },
  };
  require('lunr-languages/lunr.zh.js')(lunr, null, nodejiebaPolyfill);
} else {
  // const tokenizer = require('lunr-languages/lunr.tokenizer');
  // TODO: better support zh searching on Android
  const nodejiebaPolyfill = {
    load() {},
    cut(str: string) {
      const words = tokenizerBasic(str);
      logger.debug(`Cut "${str}": ${JSON.stringify(words)}`, {
        module: 'pouchdb',
        function: 'tokenizer',
        details: 'nodejiebaPolyfill',
      });
      return (
        words
          // Single character words will be ignored, this is a hack to prevent it.
          .map(w => (w.length <= 1 ? `${w}${w}` : w))
      );
    },
  };
  require('lunr-languages/lunr.zh.js')(lunr, null, nodejiebaPolyfill);
}

PouchDB.plugin(require('pouchdb-authentication'));
PouchDB.plugin(require('pouchdb-quick-search'));
PouchDB.plugin(SQLiteAdapter);

export async function getPouchDBDatabase<Content extends {} = {}>(
  name: string,
): Promise<PouchDB.Database<Content>> {
  const db = new PouchDB<Content>(name, {
    adapter: 'react-native-sqlite',
  });
  return db;
}

export { PouchDB };

// export async function deletePouchDBDatabase(name: string) {
//   // Since the database is backed by sqlite, we delete the sqlite file directly.
//   const results = await deleteSqliteDb(name);
//   return results;
// }
