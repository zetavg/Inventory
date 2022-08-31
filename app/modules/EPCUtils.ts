import epcTds from 'epc-tds';

const EPCUtils = {
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
    if (!prefix || prefix < 10)
      throw new Error('prefix must be larger than 10');
    if (!prefix || prefix > 99)
      throw new Error('prefix must be smaller than 99');

    if (!collectionReference.match(/^[0-9]{4}$/))
      throw new Error('collection reference has invalid format');

    if (!itemReference.match(/^[0-8]{1,8}$/))
      throw new Error('item reference has invalid format');

    if (serial < 0) throw new Error('serial must be larger than 0');
    if (serial > 9999) throw new Error('serial must be smaller than 9999');

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
