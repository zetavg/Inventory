import { getDatumFromDoc } from './functions/couchdb-utils';

export const VIEWS_PREFIX = '01_inv_app';

function view_defn<
  T extends {
    version: number;
    map: string;
    reduce?: string;
    dataParser: (data: unknown) => unknown;
  },
>(defn: T) {
  return defn;
}

export const VIEWS = {
  db_images_size: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'image' &&
          typeof doc.data.size === 'number'
        ) {
          emit(doc._id, doc.data.size);
        }
      }
    `,
    reduce: '_sum',
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return 0;
      const value = rows[0].value;
      if (typeof value !== 'number') return null;
      return value;
    },
  }),
  out_of_stock_items_count: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          doc.data.item_type === 'consumable' &&
          typeof doc.data.consumable_stock_quantity === 'number' &&
          doc.data.consumable_stock_quantity <= 0 &&
          !doc.data.consumable_will_not_restock
        ) {
          emit(doc._id);
        }
      }
    `,
    reduce: '_count',
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return 0;
      const value = rows[0].value;
      if (typeof value !== 'number') return null;
      return value;
    },
  }),
  low_stock_items_count: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          doc.data.item_type === 'consumable' &&
          typeof doc.data.consumable_stock_quantity === 'number' &&
          typeof doc.data.consumable_min_stock_level === 'number' &&
          doc.data.consumable_stock_quantity < doc.data.consumable_min_stock_level &&
          !doc.data.consumable_will_not_restock
        ) {
          emit(doc._id);
        }
      }
    `,
    reduce: '_count',
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return 0;
      const value = rows[0].value;
      if (typeof value !== 'number') return null;
      return value;
    },
  }),
  out_of_stock_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          doc.data.item_type === 'consumable' &&
          typeof doc.data.consumable_stock_quantity === 'number' &&
          doc.data.consumable_stock_quantity <= 0 &&
          !doc.data.consumable_will_not_restock
        ) {
          emit([doc.data.collection_id, doc._id], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  low_stock_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          doc.data.item_type === 'consumable' &&
          typeof doc.data.consumable_stock_quantity === 'number' &&
          typeof doc.data.consumable_min_stock_level === 'number' &&
          doc.data.consumable_stock_quantity < doc.data.consumable_min_stock_level &&
          !doc.data.consumable_will_not_restock
        ) {
          emit([doc.data.collection_id, doc._id], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  expired_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          typeof doc.data.expiry_date === 'number' &&
          (doc.data.item_type !== 'consumable' || (typeof doc.data.consumable_stock_quantity === 'number' && doc.data.consumable_stock_quantity > 0))
        ) {
          emit(doc.data.expiry_date, { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  expire_soon_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          typeof doc.data._expire_soon_at === 'number' &&
          (doc.data.item_type !== 'consumable' || (typeof doc.data.consumable_stock_quantity === 'number' && doc.data.consumable_stock_quantity > 0))
        ) {
          emit(doc.data._expire_soon_at, { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_untagged_items_count: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit(doc._id);
        }
      }
    `,
    reduce: '_count',
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return 0;
      const value = rows[0].value;
      if (typeof value !== 'number') return null;
      return value;
    },
  }),
  rfid_untagged_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.data.collection_id, doc._id], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_untagged_items_by_updated_time: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.updated_at], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_untagged_items_by_created_time: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.created_at], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_tag_outdated_items_count: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !!doc.data.actual_rfid_tag_epc_memory_bank_contents &&
          doc.data.rfid_tag_epc_memory_bank_contents !== doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit(doc._id);
        }
      }
    `,
    reduce: '_count',
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return 0;
      const value = rows[0].value;
      if (typeof value !== 'number') return null;
      return value;
    },
  }),
  rfid_tag_outdated_items: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !!doc.data.actual_rfid_tag_epc_memory_bank_contents &&
          doc.data.rfid_tag_epc_memory_bank_contents !== doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.data.collection_id, doc._id], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_tag_outdated_items_by_updated_time: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !!doc.data.actual_rfid_tag_epc_memory_bank_contents &&
          doc.data.rfid_tag_epc_memory_bank_contents !== doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.updated_at], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  rfid_tag_outdated_items_by_created_time: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          !!doc.data.rfid_tag_epc_memory_bank_contents &&
          !!doc.data.actual_rfid_tag_epc_memory_bank_contents &&
          doc.data.rfid_tag_epc_memory_bank_contents !== doc.data.actual_rfid_tag_epc_memory_bank_contents
        ) {
          emit([doc.created_at], { _id: doc._id });
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      return rows.map(row =>
        row.doc
          ? {
              __data_included: true,
              key: row.key,
              id: row.id,
              value: row.value,
              data: getDatumFromDoc('item', row.doc),
            }
          : {
              __data_included: false,
              key: row.key,
              id: row.id,
              value: row.value,
            },
      );
    },
  }),
  purchase_price_sums: view_defn({
    version: 1,
    map: `
      function (doc) {
        if (
          doc.type === 'item' &&
          doc.data.purchase_price_currency &&
          typeof doc.data.purchase_price_x1000 === 'number'
        ) {
          emit(
            doc.data.purchase_price_currency,
            doc.data.purchase_price_x1000 *
              (doc.data.item_type === 'consumable'
                ? typeof doc.data.consumable_stock_quantity === 'number'
                  ? doc.data.consumable_stock_quantity
                  : 1
                : 1),
          );
        }
      }
    `,
    reduce: `
      function (keys, values, rereduce) {
        if (rereduce) {
          return values.reduce((acc, curr) => {
            Object.keys(curr).forEach(key => {
              acc[key] = (acc[key] || 0) + curr[key];
            });
            return acc;
          }, {});
        } else {
          const sums = {};
          keys.forEach(([k], i) => {
            sums[k] = (sums[k] || 0) + values[i];
          });
          return sums;
        }
      }
    `,
    dataParser: (data: unknown) => {
      if (!data) return null;
      if (typeof data !== 'object') return null;
      const rows = (data as any).rows;
      if (!Array.isArray(rows)) return null;
      if (!rows[0]) return {};
      const value = rows[0].value;
      if (!value || typeof value !== 'object') return null;
      return Object.fromEntries(
        Object.entries(value).filter(
          (kv): kv is [string, number] =>
            typeof kv[0] === 'string' && typeof kv[1] === 'number',
        ),
      );
    },
  }),
} as const;

export default VIEWS;
