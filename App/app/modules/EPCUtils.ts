import epcTds from 'epc-tds';

// import logger from '@app/logger';

const COLLECTION_REFERENCE_REGEX = /^[0-9]+$/;
const ITEM_REFERENCE_REGEX = /^[0-9]+$/;
const MIN_PREFIX = 10;
const MAX_PREFIX = 999;
const MAX_SERIAL = 9999;

// const getCollectionReferenceDigitsLimit = ({
//   tagPrefixDigits,
//   companyPrefixDigits,
// }: {
//   tagPrefixDigits: number;
//   companyPrefixDigits: number;
// }): number => {
//   logger.warn(
//     'getCollectionReferenceDigitsLimit is deprecated, use getCollectionReferenceDigits instead.',
//   );
//   if (tagPrefixDigits + companyPrefixDigits < 10) {
//     return 4;
//   } else {
//     return 3;
//   }
// };

// const getItemReferenceDigitsLimit = ({
//   tagPrefixDigits,
//   companyPrefixDigits,
// }: {
//   tagPrefixDigits: number;
//   companyPrefixDigits: number;
// }): number => {
//   logger.warn(
//     'getItemReferenceDigitsLimit is deprecated, use getItemReferenceDigits instead.',
//   );
//   const collectionReferenceDigitsLimit = getCollectionReferenceDigitsLimit({
//     tagPrefixDigits,
//     companyPrefixDigits,
//   });
//   return (
//     24 -
//     4 /* serial length */ -
//     collectionReferenceDigitsLimit -
//     tagPrefixDigits -
//     companyPrefixDigits
//   );
// };

const getCollectionReferenceDigits = ({
  tagPrefixDigits,
  companyPrefixDigits,
}: {
  tagPrefixDigits: number;
  companyPrefixDigits: number;
}): number => {
  if (tagPrefixDigits + companyPrefixDigits < 10) {
    return 4;
  } else {
    return 3;
  }
};

const getItemReferenceDigits = ({
  tagPrefixDigits,
  companyPrefixDigits,
}: {
  tagPrefixDigits: number;
  companyPrefixDigits: number;
}): number => {
  const collectionReferenceDigits = getCollectionReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  return Math.min(
    24 -
      4 /* serial length */ -
      collectionReferenceDigits -
      tagPrefixDigits -
      companyPrefixDigits,
    6,
  );
};

const getEpcFilterLength = ({
  tagPrefixDigits,
  companyPrefixDigits,
}: {
  tagPrefixDigits: number;
  companyPrefixDigits: number;
}): number => {
  const collectionReferenceDigits = getCollectionReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  const itemReferenceDigits = getItemReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });

  if (collectionReferenceDigits === 3 && itemReferenceDigits === 6) {
    return 12;
  }

  if (collectionReferenceDigits === 4 && itemReferenceDigits === 6) {
    return 12;
  }

  // TODO: Calculate filter length for other cases
  return 8;
};

const getEpcFilter = ({
  tagPrefix,
  companyPrefix,
}: {
  tagPrefix: string;
  companyPrefix: string;
}): string => {
  const tagPrefixDigits = tagPrefix.length;
  const companyPrefixDigits = companyPrefix.length;
  const collectionReferenceDigits = getCollectionReferenceDigits({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  const epcFilterLength = getEpcFilterLength({
    tagPrefixDigits,
    companyPrefixDigits,
  });

  const sampleIndividualAssetReference =
    EPCUtils.encodeIndividualAssetReference({
      companyPrefix,
      tagPrefix,
      collectionReference: '0'.repeat(collectionReferenceDigits),
      itemReference: '0',
      serial: 0,
    });
  const sampleGiai = EPCUtils.encodeGiaiFromIndividualAssetReference({
    individualAssetReference: sampleIndividualAssetReference,
    companyPrefix,
  });
  const hex = EPCUtils.encodeEpcHexFromGiai(sampleGiai);

  return hex.slice(0, epcFilterLength);
};

const _encodeIndividualAssetReference = (
  prefix: number,
  collectionReference: string,
  itemReference: string,
  serial: number = 0,
  {
    joinBy = '',
    includePrefix = true,
    companyPrefix,
  }: {
    joinBy?: string;
    includePrefix?: boolean;
    companyPrefix: string;
  },
): string => {
  if (!prefix || prefix < MIN_PREFIX)
    throw new Error(`prefix must be larger than ${MIN_PREFIX}`);
  if (!prefix || prefix > MAX_PREFIX)
    throw new Error(`prefix must be smaller than ${MAX_PREFIX}`);

  if (!collectionReference.match(COLLECTION_REFERENCE_REGEX))
    throw new Error('collection reference has invalid format');

  if (!itemReference.match(ITEM_REFERENCE_REGEX))
    throw new Error('item reference has invalid format');

  if (serial < 0) throw new Error('serial must be larger than 0');
  if (serial > MAX_SERIAL)
    throw new Error(`serial must be smaller than ${MAX_SERIAL}`);

  const companyPrefixDigits = companyPrefix.length;
  const tagPrefixDigits = prefix.toString().length;
  const collectionReferenceDigits = getCollectionReferenceDigits({
    companyPrefixDigits,
    tagPrefixDigits,
  });
  if (collectionReference.length !== collectionReferenceDigits) {
    throw new Error(
      `collection reference should have ${collectionReferenceDigits} digits`,
    );
  }
  const itemReferenceDigits = getItemReferenceDigits({
    companyPrefixDigits,
    tagPrefixDigits,
  });

  if (itemReference.length > itemReferenceDigits) {
    throw new Error(
      `item reference should not exceed ${itemReferenceDigits} digits`,
    );
  }

  return [
    includePrefix && prefix.toString(),
    collectionReference,
    itemReference,
    serial.toString().padStart(4, '0'),
  ]
    .filter(s => s)
    .join(joinBy);
};

// const _encodeGIAI = (
//   format: 'uri' | 'hex',
//   {
//     companyPrefix,
//     assetReference,
//   }: {
//     companyPrefix: string;
//     assetReference: string;
//   },
// ) => {
//   const uri = `urn:epc:tag:giai-96:0.${companyPrefix}.${assetReference}`;
//   const epc = epcTds.fromTagURI(uri);

//   if (format === 'uri') return epc.toTagURI();
//   return epc.toHexString();
// };

const EPCUtils = {
  COLLECTION_REFERENCE_REGEX: COLLECTION_REFERENCE_REGEX,
  ITEM_REFERENCE_REGEX: ITEM_REFERENCE_REGEX,
  MIN_PREFIX: MIN_PREFIX,
  MAX_PREFIX: MAX_PREFIX,
  MAX_SERIAL: MAX_SERIAL,
  decodeHexEPC: (hexEPC: string): [string, any] => {
    const epc = epcTds.valueOf(hexEPC);
    return [epc.toTagURI(), epc];
  },
  encodeHexEPC: (uri: string): [string, any] => {
    const epc = epcTds.fromTagURI(uri);
    return [epc.toHexString(), epc];
  },
  // getCollectionReferenceDigitsLimit,
  // getItemReferenceDigitsLimit,
  getCollectionReferenceDigits,
  getItemReferenceDigits,
  getEpcFilterLength,
  getEpcFilter,
  encodeIndividualAssetReference: ({
    companyPrefix,
    tagPrefix,
    collectionReference,
    itemReference,
    serial = 0,
  }: {
    companyPrefix: string;
    tagPrefix: string;
    collectionReference: string;
    itemReference: string;
    serial: number;
  }): string => {
    return _encodeIndividualAssetReference(
      parseInt(tagPrefix, 10),
      collectionReference,
      itemReference,
      serial,
      { includePrefix: true, joinBy: '.', companyPrefix },
    );
  },
  encodeGiaiFromIndividualAssetReference: ({
    individualAssetReference,
    companyPrefix,
  }: {
    individualAssetReference: string;
    companyPrefix: string;
  }) => {
    const individualAssetReferenceParts = individualAssetReference.split('.');
    if (individualAssetReferenceParts.length !== 4) {
      throw new Error(
        `invalid individual asset reference: ${individualAssetReference}`,
      );
    }
    individualAssetReferenceParts[2] =
      individualAssetReferenceParts[2].padStart(
        getItemReferenceDigits({
          companyPrefixDigits: companyPrefix.length,
          tagPrefixDigits: individualAssetReferenceParts[0].length,
        }),
        '0',
      );
    const assetReference = individualAssetReferenceParts.join('');
    const uri = `urn:epc:tag:giai-96:0.${companyPrefix}.${assetReference}`;
    const epc = epcTds.fromTagURI(uri);

    return epc.toTagURI();
  },
  encodeEpcHexFromGiai: (giai: string) => {
    const epc = epcTds.fromTagURI(giai);
    return epc.toHexString();
  },
};

export default EPCUtils;
