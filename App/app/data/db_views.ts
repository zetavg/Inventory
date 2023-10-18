export const DB_VIEWS_PREFIX = 'inv_app';

export const DB_VIEWS = {
  db_images_size: {
    map: `
      function (doc) {
        if (
          doc.type === 'image' &&
          typeof doc.data.size === 'number'
        ) {
          emit(doc._id, doc.data.size);
        }
      };
    `,
    reduce: '_sum',
  },
  purchase_price_sums: {
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
      };
    `,
  },
} as const;

export default DB_VIEWS;
