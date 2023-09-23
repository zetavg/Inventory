import getAssetById from '../getAssetById';

it('returns a asset', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Asset',
        asset_tag: '00123',
        serial: '',
        category: {
          id: 2,
          name: 'Test Category',
        },
        model: {
          id: 3,
          name: 'Test Model',
        },
      };
    },
  });

  const asset = await getAssetById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(asset?.name).toBe('Test Asset');
  expect(asset?.category.name).toBe('Test Category');
});

it('returns null if a asset cannot be found', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        status: 'error',
        messages: 'Asset not found',
        payload: null,
      };
    },
  });

  const asset = await getAssetById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(asset).toBe(null);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Asset',
        category: null,
      };
    },
  });

  await expect(async () => {
    await getAssetById(
      {
        fetch: mockedFetch,
        baseUrl: '',
        key: '',
      },
      1,
    );
  }).rejects.toThrow();
});
