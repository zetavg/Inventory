import EPCUtils, { GiaiOutOfRangeError, IAREncodingError } from './EPCUtils';

describe('EPCUtils.getMaxIarPrefix', () => {
  it('works as expected', () => {
    const snapshotData: { [k: string]: number } = {};
    [
      '123456',
      '1234567',
      '12345678',
      '123456789',
      '1234567890',
      '12345678901',
      '123456789012',
    ].forEach(companyPrefix => {
      snapshotData[companyPrefix] = EPCUtils.getMaxIarPrefix({ companyPrefix });
    });
    expect(snapshotData).toMatchSnapshot();
  });

  it('returns 0 if companyPrefix is invalid', () => {
    expect(EPCUtils.getMaxIarPrefix({ companyPrefix: 'abc' })).toBe(0);
    expect(EPCUtils.getMaxIarPrefix({ companyPrefix: '123' })).toBe(0);
    expect(EPCUtils.getMaxIarPrefix({ companyPrefix: '12345678901234' })).toBe(
      0,
    );
  });
});

describe('EPCUtils.getMaxNsIarPrefix', () => {
  it('works as expected', () => {
    const snapshotData: { [k: string]: number } = {};
    [
      '123456',
      '1234567',
      '12345678',
      '123456789',
      '1234567890',
      '12345678901',
      '123456789012',
    ].forEach(companyPrefix => {
      snapshotData[companyPrefix] = EPCUtils.getMaxNsIarPrefix({
        companyPrefix,
      });
    });
    expect(snapshotData).toMatchSnapshot();
  });

  it('returns 0 if companyPrefix is invalid', () => {
    expect(EPCUtils.getMaxNsIarPrefix({ companyPrefix: 'abc' })).toBe(0);
    expect(EPCUtils.getMaxNsIarPrefix({ companyPrefix: '123' })).toBe(0);
    expect(
      EPCUtils.getMaxNsIarPrefix({ companyPrefix: '12345678901234' }),
    ).toBe(0);
  });
});

describe('EPCUtils.getCollectionReferenceDigits', () => {
  it('works as expected', () => {
    const snapshotData: { [k: string]: number } = {};
    [
      '123456',
      '1234567',
      '12345678',
      '123456789',
      '1234567890',
      '12345678901',
      '123456789012',
    ].forEach(companyPrefix => {
      const maxIarPrefix = EPCUtils.getMaxIarPrefix({ companyPrefix });
      let prevEdgeResult = null;
      let prevResult = null;
      let prevResultIarPrefix = null;
      for (let iarPrefix = 1; iarPrefix <= maxIarPrefix; iarPrefix++) {
        const result = EPCUtils.getCollectionReferenceDigits({
          companyPrefix,
          iarPrefix: iarPrefix.toString(),
        });
        if (result !== prevEdgeResult) {
          if (prevResultIarPrefix !== null && prevResult !== null) {
            snapshotData[`${companyPrefix}.${prevResultIarPrefix}`] =
              prevResult;
          }
          snapshotData[`${companyPrefix}.${iarPrefix}`] = result;
          prevEdgeResult = result;
          prevResultIarPrefix = iarPrefix;
        }
        prevResult = result;
        prevResultIarPrefix = iarPrefix;
      }
      if (prevResultIarPrefix !== null && prevResult !== null) {
        snapshotData[`${companyPrefix}.${prevResultIarPrefix}`] = prevResult;
      }
    });
    expect(snapshotData).toMatchSnapshot();
  });

  it('returns 0 if companyPrefix is invalid', () => {
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: 'abc',
        iarPrefix: '1',
      }),
    ).toBe(0);
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: '123',
        iarPrefix: '1',
      }),
    ).toBe(0);
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: '12345678901234',
        iarPrefix: '1',
      }),
    ).toBe(0);
  });
});

describe('EPCUtils.getItemReferenceDigits', () => {
  it('works as expected', () => {
    const snapshotData: { [k: string]: number } = {};
    [
      '123456',
      '1234567',
      '12345678',
      '123456789',
      '1234567890',
      '12345678901',
      '123456789012',
    ].forEach(companyPrefix => {
      const maxIarPrefix = EPCUtils.getMaxIarPrefix({ companyPrefix });
      let prevEdgeResult = null;
      let prevResult = null;
      let prevResultIarPrefix = null;
      for (let iarPrefix = 1; iarPrefix <= maxIarPrefix; iarPrefix++) {
        const result = EPCUtils.getItemReferenceDigits({
          companyPrefix,
          iarPrefix: iarPrefix.toString(),
        });
        if (result !== prevEdgeResult) {
          if (prevResultIarPrefix !== null && prevResult !== null) {
            snapshotData[`${companyPrefix}.${prevResultIarPrefix}`] =
              prevResult;
          }
          snapshotData[`${companyPrefix}.${iarPrefix}`] = result;
          prevEdgeResult = result;
          prevResultIarPrefix = iarPrefix;
        }
        prevResult = result;
        prevResultIarPrefix = iarPrefix;
      }
      if (prevResultIarPrefix !== null && prevResult !== null) {
        snapshotData[`${companyPrefix}.${prevResultIarPrefix}`] = prevResult;
      }
    });
    expect(snapshotData).toMatchSnapshot();
  });

  it('returns 0 if companyPrefix is invalid', () => {
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: 'abc',
        iarPrefix: '1',
      }),
    ).toBe(0);
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: '123',
        iarPrefix: '1',
      }),
    ).toBe(0);
    expect(
      EPCUtils.getCollectionReferenceDigits({
        companyPrefix: '12345678901234',
        iarPrefix: '1',
      }),
    ).toBe(0);
  });
});

describe('EPCUtils.getEpcFilter', () => {
  it('works as expected', () => {
    const keys = getCompanyIarPrefixCaseKeys();
    const snapshotData: { [k: string]: string } = {};
    for (const key of keys) {
      const [companyPrefix, iarPrefix] = key.split('.');
      snapshotData[key] = EPCUtils.getEpcFilter({ companyPrefix, iarPrefix });
    }
    expect(snapshotData).toMatchSnapshot();
  });
});

describe('EPCUtils.encodeIndividualAssetReference', () => {
  it('works as expected', () => {
    const keys = getCompanyIarPrefixCaseKeys();
    const snapshotData: { [k: string]: string } = {};
    for (const key of keys) {
      const [companyPrefix, iarPrefix] = key.split('.');
      const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      snapshotData[key] = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '9'.repeat(collectionReferenceDigits),
        itemReference: '9'.repeat(itemReferenceDigits),
        serial: EPCUtils.MAX_SERIAL,
      });
    }
    expect(snapshotData).toMatchSnapshot();
  });

  it('allows itemReference digits to be less', () => {
    expect(
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '0000000',
        iarPrefix: '123',
        collectionReference: '1234',
        itemReference: '1234',
        serial: 1234,
      }),
    ).toBe('1234.1234.1234');
  });

  it('does not allow itemReference digits to be more', () => {
    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '0000000',
        iarPrefix: '123',
        collectionReference: '1234',
        itemReference: '1234567',
        serial: 1234,
      }),
    ).toThrow(IAREncodingError);

    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '123456789012',
        iarPrefix: '1',
        collectionReference: '1234',
        itemReference: '12345',
        serial: 1234,
      }),
    ).toThrow(IAREncodingError);
  });

  it('does not allow collectionReference digits to be less', () => {
    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '0000000',
        iarPrefix: '123',
        collectionReference: '001',
        itemReference: '1234',
        serial: 1234,
      }),
    ).toThrow(IAREncodingError);
  });

  it('does not allow collectionReference digits to be more', () => {
    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '0000000',
        iarPrefix: '123',
        collectionReference: '12345',
        itemReference: '1234',
        serial: 1234,
      }),
    ).toThrow(IAREncodingError);

    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '12345678901',
        iarPrefix: '1',
        collectionReference: '1234',
        itemReference: '1234',
        serial: 1234,
      }),
    ).toThrow(IAREncodingError);
  });

  it('does not allow serial to be over max allowed value', () => {
    expect(() =>
      EPCUtils.encodeIndividualAssetReference({
        companyPrefix: '0000000',
        iarPrefix: '123',
        collectionReference: '1234',
        itemReference: '1234',
        serial: EPCUtils.MAX_SERIAL + 1,
      }),
    ).toThrow(IAREncodingError);
  });
});

describe('EPCUtils.encodeGiaiFromIndividualAssetReference', () => {
  it('works as expected', () => {
    const keys = getCompanyIarPrefixCaseKeys();
    const snapshotData: { [k: string]: [string, string] } = {};
    for (const key of keys) {
      const [companyPrefix, iarPrefix] = key.split('.');
      const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const iar1 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '0'.repeat(collectionReferenceDigits),
        itemReference: '0',
        serial: EPCUtils.MAX_SERIAL,
      });
      const iar2 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '9'.repeat(collectionReferenceDigits),
        itemReference: '9'.repeat(itemReferenceDigits),
        serial: EPCUtils.MAX_SERIAL,
      });
      const giai1 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar1,
      });
      const giai2 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar2,
      });
      snapshotData[key] = [giai1, giai2];
    }
    expect(snapshotData).toMatchSnapshot();
  });

  it('pads zeros in front of item reference', () => {
    expect(
      EPCUtils.encodeGiaiFromIndividualAssetReference({
        individualAssetReference: '1234.1234.1234',
        iarPrefix: '123',
        companyPrefix: '0000000',
      }),
    ).toBe('urn:epc:tag:giai-96:0.0000000.12312340012341234');

    expect(
      EPCUtils.encodeGiaiFromIndividualAssetReference({
        individualAssetReference: '123.1234.1234',
        iarPrefix: '1',
        companyPrefix: '12345678901',
      }),
    ).toBe('urn:epc:tag:giai-96:0.12345678901.11230012341234');
  });
});

describe('EPCUtils.encodeEpcHexFromGiai', () => {
  it('works as expected', () => {
    const keys = getCompanyIarPrefixCaseKeys();
    const snapshotData: { [k: string]: [string, string] } = {};
    for (const key of keys) {
      const [companyPrefix, iarPrefix] = key.split('.');
      const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const iar1 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '0'.repeat(collectionReferenceDigits),
        itemReference: '0',
        serial: EPCUtils.MAX_SERIAL,
      });
      const iar2 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '9'.repeat(collectionReferenceDigits),
        itemReference: '9'.repeat(itemReferenceDigits),
        serial: EPCUtils.MAX_SERIAL,
      });
      const giai1 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar1,
      });
      const giai2 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar2,
      });
      const hex1 = EPCUtils.encodeEpcHexFromGiai(giai1);
      const hex2 = EPCUtils.encodeEpcHexFromGiai(giai2);
      snapshotData[key] = [hex1, hex2];
    }
    expect(snapshotData).toMatchSnapshot();
  });

  it('throws if out of range', () => {
    // 6
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.999999.4611686018427387904',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 7
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.9999999.288230376151711744',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 8
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.99999999.36028797018963968',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 9
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.999999999.4503599627370496',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 10
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.9999999999.281474976710656',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 11
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.99999999999.35184372088832',
      ),
    ).toThrow(GiaiOutOfRangeError);

    // 12
    expect(() =>
      EPCUtils.encodeEpcHexFromGiai(
        'urn:epc:tag:giai-96:0.999999999999.4398046511104',
      ),
    ).toThrow(GiaiOutOfRangeError);
  });
});

describe('EPCUtils.getGiaiUriFromEpcHex', () => {
  it('works as expected', () => {
    const keys = getCompanyIarPrefixCaseKeys();
    for (const key of keys) {
      const [companyPrefix, iarPrefix] = key.split('.');
      const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const itemReferenceDigits = EPCUtils.getItemReferenceDigits({
        companyPrefix,
        iarPrefix,
      });
      const iar1 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '0'.repeat(collectionReferenceDigits),
        itemReference: '0',
        serial: EPCUtils.MAX_SERIAL,
      });
      const iar2 = EPCUtils.encodeIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        collectionReference: '9'.repeat(collectionReferenceDigits),
        itemReference: '9'.repeat(itemReferenceDigits),
        serial: EPCUtils.MAX_SERIAL,
      });
      const giai1 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar1,
      });
      const giai2 = EPCUtils.encodeGiaiFromIndividualAssetReference({
        companyPrefix,
        iarPrefix,
        individualAssetReference: iar2,
      });
      const hex1 = EPCUtils.encodeEpcHexFromGiai(giai1);
      const hex2 = EPCUtils.encodeEpcHexFromGiai(giai2);
      expect(EPCUtils.getGiaiUriFromEpcHex(hex1)).toBe(giai1);
      expect(EPCUtils.getGiaiUriFromEpcHex(hex2)).toBe(giai2);
    }
  });
});

function getCompanyIarPrefixCaseKeys() {
  const sd = require('./__snapshots__/EPCUtils.test.ts.snap');
  const sdKeys1 = Object.keys(
    // eslint-disable-next-line no-eval
    eval(
      `(${sd['EPCUtils.getCollectionReferenceDigits works as expected 1']})`,
    ),
  );
  const sdKeys2 = Object.keys(
    // eslint-disable-next-line no-eval
    eval(`(${sd['EPCUtils.getItemReferenceDigits works as expected 1']})`),
  );

  const keys = Array.from(new Set(sdKeys1.concat(sdKeys2))).sort((a, b) => {
    const paddedA = a
      .split('.')
      .map(num => num.padStart(16, '0'))
      .join('.');
    const paddedB = b
      .split('.')
      .map(num => num.padStart(16, '0'))
      .join('.');
    return paddedA.localeCompare(paddedB);
  });
  return keys;
}
