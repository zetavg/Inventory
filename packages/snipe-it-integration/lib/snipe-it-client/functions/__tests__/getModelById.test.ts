import getModelById from '../getModelById';

it('returns a model', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Model',
        category: {
          id: 2,
          name: 'Test Category',
        },
      };
    },
  });

  const model = await getModelById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(model?.name).toBe('Test Model');
  expect(model?.category.name).toBe('Test Category');
});

it('returns null if a model cannot be found', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        status: 'error',
        messages: 'AssetModel not found',
        payload: null,
      };
    },
  });

  const model = await getModelById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(model).toBe(null);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Model',
        category: null,
      };
    },
  });

  await expect(async () => {
    await getModelById(
      {
        fetch: mockedFetch,
        baseUrl: '',
        key: '',
      },
      1,
    );
  }).rejects.toThrow();
});
