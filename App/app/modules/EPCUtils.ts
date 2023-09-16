import epcTds, { Giai96 } from 'epc-tds';

// import logger from '@app/logger';

const NUMBER_STR_REGEX = /^[0-9]+$/;

const MIN_IAR_PREFIX = 1;
const MAX_SERIAL = 9999;

const MAX_IAR_MAP = {
  6: '4611686018427387903',
  7: '288230376151711743',
  8: '36028797018963967',
  9: '4503599627370495',
  10: '281474976710655',
  11: '35184372088831',
  12: '4398046511103',
} as const;

const getMaxIarPrefix = ({
  companyPrefix,
}: {
  companyPrefix: string;
}): number => {
  if (!companyPrefix.match(NUMBER_STR_REGEX)) return 0;

  const maxIarStr = (MAX_IAR_MAP as any)[companyPrefix.length as any] as
    | string
    | undefined;
  if (!maxIarStr) {
    return 0;
  }

  const maxIarPrefixStr = maxIarStr.slice(0, -12);
  return parseInt(maxIarPrefixStr, 10) - 1;
};

const getMaxNsIarPrefix = ({
  companyPrefix,
}: {
  companyPrefix: string;
}): number => {
  if (!companyPrefix.match(NUMBER_STR_REGEX)) return 0;

  const maxIarStr = (MAX_IAR_MAP as any)[companyPrefix.length as any] as
    | string
    | undefined;
  if (!maxIarStr) {
    return 0;
  }

  let maxIarPrefixStr = '';
  let nextD = 14;
  while (!maxIarPrefixStr && nextD > 0) {
    maxIarPrefixStr = maxIarStr.slice(0, -nextD);

    nextD -= 1;
  }
  return parseInt(maxIarPrefixStr, 10) - 1;
};

const getUsableIarDigits = ({
  iarPrefix,
  companyPrefix,
}: {
  iarPrefix: string;
  companyPrefix: string;
}): number => {
  if (!companyPrefix.match(NUMBER_STR_REGEX)) return 0;

  const maxIarStr = (MAX_IAR_MAP as any)[companyPrefix.length as any] as
    | string
    | undefined;
  if (!maxIarStr) {
    return 0;
  }

  const iarPrefixDigits = iarPrefix.length;
  const iarPStr = maxIarStr.slice(0, iarPrefixDigits);
  const iarP = parseInt(iarPStr, 10);

  if (parseInt(iarPrefix, 10) < iarP) {
    return maxIarStr.length - iarPrefixDigits;
  } else {
    return maxIarStr.length - iarPrefixDigits - 1;
  }
};

const getCollectionReferenceDigits = ({
  iarPrefix,
  companyPrefix,
}: {
  iarPrefix: string;
  companyPrefix: string;
}): number => {
  const usableIarDigits = getUsableIarDigits({
    iarPrefix,
    companyPrefix,
  });

  // Special cases
  if (usableIarDigits === 13) {
    // 123.123456.1234
    return 3;
  }

  const n = Math.min(usableIarDigits - 8, 4);
  if (n < 0) return 0;
  return n;
};

const getItemReferenceDigits = ({
  iarPrefix,
  companyPrefix,
}: {
  iarPrefix: string;
  companyPrefix: string;
}): number => {
  const usableIarDigits = getUsableIarDigits({
    iarPrefix,
    companyPrefix,
  });
  const collectionReferenceDigits = getCollectionReferenceDigits({
    iarPrefix,
    companyPrefix,
  });
  const n = Math.min(
    usableIarDigits - 4 /* serial length */ - collectionReferenceDigits,
    6,
  );
  if (n < 0) return 0;
  return n;
};

const encodeGiaiFromIndividualAssetReference = ({
  individualAssetReference,
  iarPrefix,
  companyPrefix,
}: {
  individualAssetReference: string;
  iarPrefix: string;
  companyPrefix: string;
}) => {
  if (!iarPrefix.match(NUMBER_STR_REGEX))
    throw new IAREncodingError('iarPrefix has invalid format');
  if (iarPrefix.startsWith('0'))
    throw new IAREncodingError('iarPrefix cannot start with 0');

  let pureIndividualAssetReference = individualAssetReference;
  if (individualAssetReference.includes('.')) {
    const individualAssetReferenceParts = individualAssetReference.split('.');
    if (individualAssetReferenceParts.length !== 3) {
      throw new Error(
        `invalid individual asset reference: ${individualAssetReference}`,
      );
    }
    individualAssetReferenceParts[1] =
      individualAssetReferenceParts[1].padStart(
        getItemReferenceDigits({
          companyPrefix,
          iarPrefix,
        }),
        '0',
      );
    pureIndividualAssetReference = individualAssetReferenceParts.join('');
  }

  const uri = `urn:epc:tag:giai-96:0.${companyPrefix}.${iarPrefix}${pureIndividualAssetReference}`;

  return uri;
};

export class GiaiOutOfRangeError extends Error {}

const encodeEpcHexFromGiai = (giaiUri: string) => {
  // Giai96.fromTagURI have integer overflow issue, so we have to parse the uri manually and use BigInt instead of parseInt at some places
  const value = giaiUri.split(':');
  try {
    if (value[3] === Giai96.TAG_URI) {
      const data = value[4].split('.');
      const result = new Giai96();
      result.setFilter(parseInt(data[0], 10));
      result.setPartition(12 - data[1].length);
      result.setCompanyPrefix(BigInt(data[1]));
      result.setAssetReference(BigInt(data[2]));
      const hexString = result.toHexString();

      let checkUri;
      try {
        checkUri = getGiaiUriFromEpcHex(hexString);
      } catch (e) {
        throw new GiaiOutOfRangeError(
          `getGiaiUriFromEpcHex(generatedHex) throws error ${e}, possible value out of range or leading zero in value.`,
        );
      }

      if (checkUri !== giaiUri) {
        throw new GiaiOutOfRangeError(
          `Individual Asset Reference mismatch, possible value out of range or leading zero in value: ${checkUri}, ${giaiUri}`,
        );
      }

      return hexString;
    }
  } catch (e) {
    if (e instanceof GiaiOutOfRangeError) {
      throw e;
    }
  }
  throw new Error(`${giaiUri} is not a known EPC tag URI scheme`);
};

const getGiaiUriFromEpcHex = (epcHex: string): string => {
  // Giai96.fromTagURI have integer overflow issue, so we have to do this manually and use BigInt instead of parseInt at some places
  const epc = new Giai96(epcHex);

  let partition = Giai96.PARTITIONS[epc.getPartition()];

  const companyPrefix = epc.getSegmentString(partition.a);

  const assetReferenceNumber = epc
    .getBigInt(partition.b.start, partition.b.end)
    .toString();

  return Giai96.TAG_URI_TEMPLATE(
    epc.getFilter(),
    companyPrefix,
    assetReferenceNumber,
  );
};

const getEpcFilterLength = ({
  iarPrefix,
  companyPrefix,
}: {
  iarPrefix: string;
  companyPrefix: string;
}): number => {
  try {
    const collectionReferenceDigits = getCollectionReferenceDigits({
      iarPrefix,
      companyPrefix,
    });

    const sampleIndividualAssetReference1 =
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '0'.repeat(collectionReferenceDigits),
        itemReference: '0',
        serial: 0,
      });
    const sampleGiai1 = EPCUtils.encodeGiaiFromIndividualAssetReference({
      individualAssetReference: sampleIndividualAssetReference1,
      iarPrefix,
      companyPrefix,
    });
    const sampleHex1 = EPCUtils.encodeEpcHexFromGiai(sampleGiai1);

    const sampleIndividualAssetReference2 =
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '9'.repeat(collectionReferenceDigits),
        itemReference: '9',
        serial: 9999,
      });
    const sampleGiai2 = EPCUtils.encodeGiaiFromIndividualAssetReference({
      individualAssetReference: sampleIndividualAssetReference2,
      iarPrefix,
      companyPrefix,
    });
    const sampleHex2 = EPCUtils.encodeEpcHexFromGiai(sampleGiai2);

    let commonLength = 0;

    // Loop to compare each character
    for (let i = 0; i < Math.min(sampleHex1.length, sampleHex2.length); i++) {
      if (sampleHex1[i] === sampleHex2[i]) {
        commonLength++;
      } else {
        break;
      }
    }

    return commonLength;
  } catch (e) {
    return 0;
  }
};

const getEpcFilter = ({
  iarPrefix,
  companyPrefix,
}: {
  iarPrefix: string;
  companyPrefix: string;
}): string => {
  const collectionReferenceDigits = getCollectionReferenceDigits({
    iarPrefix,
    companyPrefix,
  });
  const epcFilterLength = getEpcFilterLength({
    iarPrefix,
    companyPrefix,
  });

  const sampleIndividualAssetReference =
    EPCUtils.encodeIndividualAssetReference({
      companyPrefix,
      iarPrefix,
      collectionReference: '0'.repeat(collectionReferenceDigits),
      itemReference: '0',
      serial: 0,
    });
  const sampleGiai = EPCUtils.encodeGiaiFromIndividualAssetReference({
    individualAssetReference: sampleIndividualAssetReference,
    iarPrefix,
    companyPrefix,
  });
  const hex = EPCUtils.encodeEpcHexFromGiai(sampleGiai);

  return hex.slice(0, epcFilterLength);
};

export class IAREncodingError extends Error {}

const encodeIndividualAssetReference = ({
  companyPrefix,
  iarPrefix,
  collectionReference,
  itemReference,
  serial = 0,
}: {
  companyPrefix: string;
  iarPrefix: string;
  collectionReference: string;
  itemReference: string;
  serial: number;
}): string => {
  if (!iarPrefix.match(NUMBER_STR_REGEX))
    throw new IAREncodingError('iarPrefix has invalid format');

  if (!iarPrefix || parseInt(iarPrefix, 10) < MIN_IAR_PREFIX)
    throw new IAREncodingError(`iarPrefix must >= ${MIN_IAR_PREFIX}`);
  const minIarPrefix = EPCUtils.getMaxIarPrefix({ companyPrefix });
  if (!iarPrefix || parseInt(iarPrefix, 10) > minIarPrefix)
    throw new IAREncodingError(`iarPrefix must <= ${minIarPrefix}`);

  if (!collectionReference.match(NUMBER_STR_REGEX))
    throw new IAREncodingError('collection reference has invalid format');

  if (!itemReference.match(NUMBER_STR_REGEX))
    throw new IAREncodingError('item reference has invalid format');

  if (serial < 0) throw new IAREncodingError('serial must be larger than 0');
  if (serial > MAX_SERIAL)
    throw new IAREncodingError(`serial must be smaller than ${MAX_SERIAL}`);

  const collectionReferenceDigits = getCollectionReferenceDigits({
    companyPrefix,
    iarPrefix,
  });
  if (collectionReference.length !== collectionReferenceDigits) {
    throw new IAREncodingError(
      `collection reference should have ${collectionReferenceDigits} digits`,
    );
  }

  const itemReferenceDigits = getItemReferenceDigits({
    companyPrefix,
    iarPrefix,
  });
  if (itemReference.length > itemReferenceDigits) {
    throw new IAREncodingError(
      `item reference should not exceed ${itemReferenceDigits} digits`,
    );
  }

  return [
    collectionReference,
    itemReference,
    serial.toString().padStart(4, '0'),
  ].join('.');
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
  // MIN_IAR_PREFIX: MIN_IAR_PREFIX,
  // MAX_PREFIX: MAX_PREFIX,
  MAX_SERIAL: MAX_SERIAL,
  // decodeHexEPC: (hexEPC: string): [string, any] => {
  //   const epc = epcTds.valueOf(hexEPC);
  //   return [epc.toTagURI(), epc];
  // },
  // encodeHexEPC: (uri: string): [string, any] => {
  //   const epc = epcTds.fromTagURI(uri);
  //   return [epc.toHexString(), epc];
  // },
  // getCollectionReferenceDigitsLimit,
  // getItemReferenceDigitsLimit,
  getMaxIarPrefix,
  getMaxNsIarPrefix,
  getCollectionReferenceDigits,
  getItemReferenceDigits,
  getEpcFilterLength,
  getEpcFilter,
  encodeIndividualAssetReference,
  encodeGiaiFromIndividualAssetReference,
  encodeEpcHexFromGiai,
  getGiaiUriFromEpcHex,
  // getGiaiFromHexEpc: (hexEpc: string) => {
  //   const epc = epcTds.valueOf(hexEpc);
  //   return epc.toTagURI();
  // },
};

export default EPCUtils;
