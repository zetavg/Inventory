import RNFS from 'react-native-fs';

export const getSqliteDbNames = async () => {
  const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
  return files
    .filter(file => {
      if (file.name.match('-mrview-')) return false;
      if (file.name.match('-search-')) return false;

      return (
        file.name.startsWith('db_') ||
        file.name.endsWith('.sqlite') ||
        file.name.endsWith('.sqlite3')
      );
    })
    .map(file => file.name);
};

export const deleteSqliteDb = async (
  dbName: string,
  { dryRun = false } = {},
) => {
  const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
  const filesToDelete = files.filter(
    file =>
      file.name === dbName ||
      file.name.startsWith(`${dbName}-mrview-`) ||
      file.name.startsWith(`${dbName}-search-`),
  );

  if (dryRun) {
    return filesToDelete;
  }

  await Promise.all(
    files
      .filter(
        file =>
          file.name === dbName || file.name.startsWith(`${dbName}-mrview-`),
      )
      .map(file => RNFS.unlink(file.path)),
  );

  return filesToDelete;
};
