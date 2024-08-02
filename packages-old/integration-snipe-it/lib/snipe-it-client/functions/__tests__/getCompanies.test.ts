import getCompanies, { BATCH_SIZE } from '../getCompanies';

it('returns all companies', async () => {
  // Test a edge case
  const companiesCount = BATCH_SIZE * 2 + 1;

  let mockedRemainingCompaniesCount = companiesCount;
  const mockedFetch: any = async () => ({
    json() {
      const currentBatchSize = Math.min(
        mockedRemainingCompaniesCount,
        BATCH_SIZE,
      );
      mockedRemainingCompaniesCount -= currentBatchSize;
      return {
        total: companiesCount,
        rows: Array.from(new Array(currentBatchSize)).map(() => ({
          id: 1,
          name: 'Company',
          _additionalField: '...',
        })),
      };
    },
  });

  const companies = await getCompanies({
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  });
  expect(companies).toHaveLength(companiesCount);
});

it('returns [] if there are no companies', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 0,
        rows: [],
      };
    },
  });

  const companies = await getCompanies({
    fetch: mockedFetch,
    baseUrl: '',
    key: '',
  });
  expect(companies).toHaveLength(0);
});

it('throws error if response data is invalid', async () => {
  const mockedFetch: any = async () => ({
    json() {
      return {
        total: 1,
        rows: [{ id: 'a' /* should be a number */, name: 'Company' }],
      };
    },
  });

  await expect(async () => {
    await getCompanies({
      fetch: mockedFetch,
      baseUrl: '',
      key: '',
    });
  }).rejects.toThrow();
});
