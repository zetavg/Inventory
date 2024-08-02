export const DEFAULT_ICON_COLOR = 'gray';
export const DEFAULT_COLLECTION_ICON_NAME = 'box';
export const DEFAULT_ITEM_ICON_NAME = 'cube-outline';

export function getDefaultItemIconName(item: unknown) {
  if (!item) return DEFAULT_ITEM_ICON_NAME;

  if (typeof item !== 'object') {
    return DEFAULT_ITEM_ICON_NAME;
  }

  if ((item as any).item_type === 'container') {
    return 'shallow-box';
  }

  return DEFAULT_ITEM_ICON_NAME;
}
