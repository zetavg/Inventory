import { DataTypeWithID } from '@invt/data/types';

import mapObjectValues from '@app/utils/mapObjectValues';

import utils from './print-utils';
import { Label, LabelT, PrinterConfig, PrinterConfigT } from './types';

export function getPrinterConfigFromString(str: string): unknown {
  // eslint-disable-next-line no-eval
  return eval(`cfg = ${str}`);
}

export function getLabels(
  printerConfig: PrinterConfigT,
  options: Record<string, any>,
  items: ReadonlyArray<
    DataTypeWithID<'item'> & {
      collection: DataTypeWithID<'collection'>;
      container?: DataTypeWithID<'item'> | undefined;
    }
  >,
) {
  const labels = items.map(item => {
    try {
      const label = printerConfig.getLabel({ item, options, utils });
      return Label.parse(label);
    } catch (e) {
      throw new Error(
        `Error getting label for item "${item.name}" (ID ${item.__id}): ${
          e instanceof Error ? e.message : 'unknown error'
        }`,
      );
    }
  });
  return labels;
}

export function getDefaultOptions(printerConfig: unknown): Record<string, any> {
  const parsedPrinterConfig = (() => {
    try {
      return PrinterConfig.parse(printerConfig);
    } catch (e) {
      throw new Error(
        `Invalid printer config: ${
          e instanceof Error ? e.message : 'unknown error'
        } (${JSON.stringify(printerConfig)})`,
      );
    }
  })();
  return mapObjectValues(parsedPrinterConfig.options, opt => {
    switch (true) {
      case opt.hasOwnProperty('enum'): {
        return opt.default || (opt as any).enum[0];
      }
      case (opt as any).type === 'string': {
        if (typeof opt.default === 'string') return opt.default;
        if (Array.isArray((opt as any).choices)) {
          return (opt as any).choices[0] || '';
        }
        return '';
      }
      case (opt as any).type === 'integer': {
        return opt.default || undefined;
      }
      default:
        return '';
    }
  });
}

export async function print(
  printerConfig: unknown,
  options: Record<string, any>,
  labels: ReadonlyArray<LabelT>,
  signal?: AbortSignal,
) {
  const parsedPrinterConfig = (() => {
    try {
      return PrinterConfig.parse(printerConfig);
    } catch (e) {
      throw new Error(
        `Invalid printer config: ${
          e instanceof Error ? e.message : 'unknown error'
        } (${JSON.stringify(printerConfig)})`,
      );
    }
  })();
  return await parsedPrinterConfig.print({ options, labels, utils, signal });
}
