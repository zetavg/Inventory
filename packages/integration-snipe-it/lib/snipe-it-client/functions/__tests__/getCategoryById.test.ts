import getCategoryById from '../getCategoryById';

it('returns a category', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Category',
        category_type: 'Asset',
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

  const category = await getCategoryById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(category?.name).toBe('Test Category');
});

it('returns null if a category cannot be found', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        status: 'error',
        messages: 'Category not found',
        payload: null,
      };
    },
  });

  const category = await getCategoryById(
    {
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    },
    1,
  );
  expect(category).toBe(null);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        id: 1,
        name: 'Test Category',
        category_type: 'NoSuchType',
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
    await getCategoryById(
      {
        fetch: mockedFetch,
        baseUrl: '',
        key: '',
      },
      1,
    );
  }).rejects.toThrow();
});
