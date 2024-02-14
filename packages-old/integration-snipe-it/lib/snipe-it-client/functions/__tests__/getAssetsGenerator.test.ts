import getAssetsGenerator, { BATCH_SIZE } from '../getAssetsGenerator';

it('yields all assets with total and current counters', async () => {
  // Test an edge case
  const assetsCount = BATCH_SIZE * 2 + 1;

  let mockedRemainingAssetsCount = assetsCount;
  const mockedFetch: any = async () => ({
    json() {
      const currentBatchSize = Math.min(mockedRemainingAssetsCount, BATCH_SIZE);
      mockedRemainingAssetsCount -= currentBatchSize;
      return {
        total: assetsCount,
        rows: Array.from(new Array(currentBatchSize)).map(() => ({
          id: 1,
          name: '',
          asset_tag: '',
          serial: '',
          model: {
            id: 1,
            name: 'Test Model',
          },
          category: {
            id: 1,
            name: 'Test Category',
          },
          created_at: {
            datetime: '2023-01-01 00:00:00',
            formatted: '2023-01-01 00:00 AM',
          },
          updated_at: {
            datetime: '2023-01-01 00:00:00',
            formatted: '2023-01-01 00:00 AM',
          },
        })),
      };
    },
  });

  const ctx = {
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  };

  let count = 0;
  for await (const { total, current, asset } of getAssetsGenerator(ctx)) {
    expect(total).toEqual(assetsCount);
    expect(current).toEqual(count + 1);
    expect(asset.model.name).toEqual('Test Model');
    count++;
  }
  expect(count).toEqual(assetsCount);
});

it('yields nothing if there are no assets', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 0,
        rows: [],
      };
    },
  });

  const ctx = {
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  };

  let count = 0;
  for await (const _ of getAssetsGenerator(ctx)) {
    count++;
  }
  expect(count).toEqual(0);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 1,
        rows: [{}],
      };
    },
  });

  const ctx = {
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  };

  await expect(async () => {
    for await (const _ of getAssetsGenerator(ctx)) {
      // intentionally empty
    }
  }).rejects.toThrow();
});
