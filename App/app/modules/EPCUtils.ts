import epcTds from 'epc-tds';

const COLLECTION_REFERENCE_REGEX = /^[0-9]+$/;
const ITEM_REFERENCE_REGEX = /^[0-9]+$/;
const MIN_PREFIX = 0;
const MAX_PREFIX = 999;
const MAX_SERIAL = 9999;

const getCollectionReferenceDigitsLimit = ({
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

const getItemReferenceDigitsLimit = ({
  tagPrefixDigits,
  companyPrefixDigits,
}: {
  tagPrefixDigits: number;
  companyPrefixDigits: number;
}): number => {
  const collectionReferenceDigitsLimit = getCollectionReferenceDigitsLimit({
    tagPrefixDigits,
    companyPrefixDigits,
  });
  return (
    24 -
    4 /* serial length */ -
    collectionReferenceDigitsLimit -
    tagPrefixDigits -
    companyPrefixDigits
  );
};

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
  getCollectionReferenceDigitsLimit,
  getItemReferenceDigitsLimit,
  encodeIndividualAssetReference: (
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
      /** This is only used to check if the GIAI Individual Asset Reference field will be out of range */
      companyPrefix?: string;
    } = {},
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

    if (typeof companyPrefix === 'string') {
      const companyPrefixDigits = companyPrefix.length;
      const tagPrefixDigits = prefix.toString().length;
      const collectionReferenceDigitsLimit = getCollectionReferenceDigitsLimit({
        companyPrefixDigits,
        tagPrefixDigits,
      });
      if (collectionReference.length > collectionReferenceDigitsLimit) {
        throw new Error(
          `collection reference is too long (max. ${collectionReferenceDigitsLimit} digits)`,
        );
      }
      const itemReferenceDigitsLimit = getItemReferenceDigitsLimit({
        companyPrefixDigits,
        tagPrefixDigits,
      });
      if (itemReference.length > itemReferenceDigitsLimit) {
        throw new Error(
          `item reference is too long (max. ${itemReferenceDigitsLimit} digits)`,
        );
      }
    }

    return [
      includePrefix && prefix.toString(),
      collectionReference,
      itemReference,
      serial.toString().padStart(4, '0'),
    ]
      .filter(s => s)
      .join(joinBy);
  },
  encodeGIAI: (
    format: 'uri' | 'hex',
    {
      companyPrefix,
      assetReference,
    }: {
      companyPrefix: string;
      assetReference: string;
    },
  ) => {
    const uri = `urn:epc:tag:giai-96:0.${companyPrefix}.${assetReference}`;
    const epc = epcTds.fromTagURI(uri);

    if (format === 'uri') return epc.toTagURI();
    return epc.toHexString();
  },
};

export default EPCUtils;
