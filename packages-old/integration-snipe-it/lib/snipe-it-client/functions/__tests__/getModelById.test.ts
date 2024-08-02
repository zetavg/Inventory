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
        created_at: {
          datetime: '2023-01-01 00:00:00',
          formatted: '2023-01-01 00:00 AM',
        },
        updated_at: {
          datetime: '2023-01-01 00:00:00',
          formatted: '2023-01-01 00:00 AM',
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
        created_at: {
          datetime: '2023-01-01 00:00:00',
          formatted: '2023-01-01 00:00 AM',
        },
        updated_at: {
          datetime: '2023-01-01 00:00:00',
          formatted: '2023-01-01 00:00 AM',
        },
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
