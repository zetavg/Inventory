/* global jest */

jest.mock('app/logger/logsDB.ts');

jest.mock('app/data/functions/config.ts');
jest.mock('app/data/functions/getData.ts');
jest.mock('app/data/functions/getDatum.ts');
// Not necessary since the underlying functions are mocked
// jest.mock('app/data/functions/getRelated.ts');
jest.mock('app/data/functions/saveDatum.ts');
