const ACRONYMS_DICT: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  uri: 'URI',
  url: 'URL',
  id: 'ID',
  uid: 'UID',
  uuid: 'UUID',
  db: 'DB',
  rfid: 'RFID',
  epc: 'EPC',
  iar: 'IAR',
};

export default function capitalizeAcronyms(str: string) {
  return str.replace(
    /\w[^\r\n\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff.-]*/g,
    function (word: string) {
      const lowerCaseWord = word.toLowerCase();

      if (ACRONYMS_DICT[lowerCaseWord]) {
        return ACRONYMS_DICT[lowerCaseWord];
      }

      return word;
    },
  );
}
