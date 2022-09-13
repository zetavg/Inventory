export type IconColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'gray';

export const ICONS = {
  default: {
    sfSymbolName: 'circle.fill',
    materialIconName: 'checkbox-blank-circle',
    keywords: '',
  },
  books: {
    sfSymbolName: 'books.vertical.fill',
    materialIconName: 'bookshelf',
    keywords: 'book books library',
  },
  box: {
    sfSymbolName: 'archivebox.fill',
    materialIconName: 'archive',
    keywords: 'box archive',
  },
  clothes: {
    sfSymbolName: 'tshirt.fill',
    materialIconName: 'tshirt-crew',
    keywords: 'clothes tshirt t-shirt',
  },
  tag: {
    sfSymbolName: 'tag.fill',
    materialIconName: 'tag',
    keywords: 'tab label',
  },
  electronics: {
    sfSymbolName: 'laptopcomputer.and.iphone',
    materialIconName: 'cellphone-link',
    keywords: 'computer phone laptop electronics',
  },
  travel: {
    sfSymbolName: 'airplane',
    materialIconName: 'airplane',
    keywords: 'travel',
  },
  tools: {
    sfSymbolName: 'wrench.and.screwdriver.fill',
    materialIconName: 'hammer-screwdriver',
    keywords: 'tools hammer screwdriver wrench',
  },
} as const;

export type IconName = keyof typeof ICONS;
