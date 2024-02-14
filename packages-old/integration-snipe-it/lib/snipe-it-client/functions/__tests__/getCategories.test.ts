import getCategories, { BATCH_SIZE } from '../getCategories';

it('returns all categories', async () => {
  // Test a edge case
  const categoriesCount = BATCH_SIZE * 2 + 1;

  let mockedRemainingCategoriesCount = categoriesCount;
  const mockedFetch: any = async () => ({
    json() {
      const currentBatchSize = Math.min(
        mockedRemainingCategoriesCount,
        BATCH_SIZE,
      );
      mockedRemainingCategoriesCount -= currentBatchSize;
      return {
        total: categoriesCount,
        rows: Array.from(new Array(currentBatchSize)).map(() => ({
          id: 1,
          name: 'Company',
          category_type: 'Asset',
          created_at: {
            datetime: '2023-01-01 00:00:00',
            formatted: '2023-01-01 00:00 AM',
          },
          updated_at: {
            datetime: '2023-01-01 00:00:00',
            formatted: '2023-01-01 00:00 AM',
          },
          _additionalField: '...',
        })),
      };
    },
  });

  const categories = await getCategories({
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  });
  expect(categories).toHaveLength(categoriesCount);
});

it('returns [] if there are no categories', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 0,
        rows: [],
      };
    },
  });

  const categories = await getCategories({
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  });
  expect(categories).toHaveLength(0);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 1,
        rows: [
          {
            id: 1,
            name: 'Company',
            type: 'NoSuchType',
            created_at: {
              datetime: '2023-01-01 00:00:00',
              formatted: '2023-01-01 00:00 AM',
            },
            updated_at: {
              datetime: '2023-01-01 00:00:00',
              formatted: '2023-01-01 00:00 AM',
            },
          },
        ],
      };
    },
  });

  await expect(async () => {
    await getCategories({
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    });
  }).rejects.toThrow();
});
