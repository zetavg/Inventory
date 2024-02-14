import { MATERIAL_COMMUNITY_ICON_NAMES_SET } from '@app/consts/material-community-icons';

export default function verifyMaterialCommunityIconName(
  name: string | undefined,
) {
  if (!name) return undefined;

  if (MATERIAL_COMMUNITY_ICON_NAMES_SET.has(name)) {
    return name;
  }

  console.warn(`Unknown Material Community icon name: ${name}.`);

  return undefined;
}
