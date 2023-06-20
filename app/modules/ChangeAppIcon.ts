import { Platform } from 'react-native';
import { changeIcon, getIcon } from 'react-native-change-icon';

const ChangeAppIcon = {
  get: async (): Promise<string> => {
    const iconName = await getIcon();

    return iconName;
  },
  set: async (iconName: string | null): Promise<string> => {
    let internalIconName: string | null = iconName;
    if (!internalIconName) internalIconName = null;
    if (internalIconName === 'default') internalIconName = null;

    try {
      return await changeIcon(internalIconName);
    } catch (e: any) {
      if (
        e.message.includes('file') &&
        e.message.includes('exist') &&
        Platform.OS === 'ios' &&
        internalIconName
      ) {
        return await changeIcon(`AppIcon-${internalIconName}`);
      } else {
        throw e;
      }
    }
  },
};

export default ChangeAppIcon;
