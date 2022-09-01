import epcTds from 'epc-tds';

const COLLECTION_REFERENCE_REGEX = /^[0-9]{4}$/;
const ITEM_REFERENCE_REGEX = /^[0-8]{1,8}$/;
const MIN_PREFIX = 10;
const MAX_PERFIX = 99;
const MAX_SERIAL = 9999;

const EPCUtils = {
  COLLECTION_REFERENCE_REGEX: COLLECTION_REFERENCE_REGEX,
  ITEM_REFERENCE_REGEX: ITEM_REFERENCE_REGEX,
  MIN_PREFIX: MIN_PREFIX,
  MAX_PERFIX: MAX_PERFIX,
  MAX_SERIAL: MAX_SERIAL,
  decodeHexEPC: (hexEPC: string): [string, any] => {
    const epc = epcTds.valueOf(hexEPC);
    return [epc.toTagURI(), epc];
  },
  encodeHexEPC: (uri: string): [string, any] => {
    const epc = epcTds.fromTagURI(uri);
    return [epc.toHexString(), epc];
  },
  encodeIndividualAssetReference: (
    prefix: number,
    collectionReference: string,
    itemReference: string,
    serial: number = 0,
    {
      joinBy = '',
      includePrefix = true,
    }: { joinBy?: string; includePrefix?: boolean } = {},
  ): string => {
    if (!prefix || prefix < MIN_PREFIX)
      throw new Error(`prefix must be larger than ${MIN_PREFIX}`);
    if (!prefix || prefix > MAX_PERFIX)
      throw new Error(`prefix must be smaller than ${MAX_PERFIX}`);

    if (!collectionReference.match(COLLECTION_REFERENCE_REGEX))
      throw new Error('collection reference has invalid format');

    if (!itemReference.match(ITEM_REFERENCE_REGEX))
      throw new Error('item reference has invalid format');

    if (serial < 0) throw new Error('serial must be larger than 0');
    if (serial > MAX_SERIAL)
      throw new Error(`serial must be smaller than ${MAX_SERIAL}`);

    return [
      includePrefix && prefix.toString().padStart(2, '0'),
      collectionReference.padStart(4, '0'),
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
