import RNFS from 'react-native-fs';

export default async function base64FromFile(uri: string) {
  return await RNFS.readFile(uri, 'base64');
}
