import objectEntries from '@app/utils/objectEntries';

export const ICON_COLORS = [
  'blue',
  'brown',
  'gray',
  'green',
  'indigo',
  'yellow',
  'red',
  'purple',
  'orange',
  'teal',
] as const;

export type IconColor = typeof ICON_COLORS[number];

export const ICONS = {
  // Box
  'cube-outline': {
    sfSymbolName: 'cube',
    materialIconName: 'cube-outline',
    keywords: 'seal',
  },
  box: {
    sfSymbolName: 'archivebox.fill',
    materialIconName: 'archive',
    keywords: 'box archive',
  },
  'shipping-box': {
    sfSymbolName: 'shippingbox.fill',
    materialIconName: 'cube',
    keywords: '',
  },
  'shallow-box': {
    sfSymbolName: 'tray.fill',
    materialIconName: 'inbox',
    keywords: '',
  },
  gift: {
    sfSymbolName: 'gift.fill',
    materialIconName: 'gift',
    keywords: '',
  },

  // Container Furniture
  'file-cabinet': {
    materialIconName: 'file-cabinet',
    keywords: 'cabinet',
  },
  closet: {
    // sfSymbolName: 'cabinet.fill',
    materialIconName: 'wardrobe',
    keywords: 'wardrobe cabinet',
  },

  // House
  house: {
    sfSymbolName: 'house.fill',
    materialIconName: 'home',
    keywords: 'home',
  },
  furniture: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'table-furniture',
    keywords: 'table-furniture',
  },
  lounge: {
    // sfSymbolName: 'chair.lounge.fill',
    materialIconName: 'sofa-single',
    keywords: 'chair sofa lounge',
  },
  bed: {
    sfSymbolName: 'bed.double.fill',
    materialIconName: 'bed-double',
    keywords: 'bed sleep',
  },
  sink: {
    // sfSymbolName: 'sink.fill',
    materialIconName: 'countertop',
    keywords: 'countertop sink bathroom toilet',
  },
  bathtub: {
    // sfSymbolName: 'bathtub.fill',
    materialIconName: 'bathtub',
    keywords: 'bathtub bathroom toilet',
  },
  shower: {
    // sfSymbolName: 'shower.fill',
    materialIconName: 'shower-head',
    keywords: 'shower bathroom toilet',
  },
  lamp: {
    // sfSymbolName: 'lamp.table.fill',
    materialIconName: 'lamp',
    keywords: '',
  },
  rug: {
    // sfSymbolName: 'rug',
    materialIconName: 'rug',
    keywords: 'rug',
  },
  bin: {
    // sfSymbolName: 'bin',
    materialIconName: 'delete',
    keywords: 'delete',
  },
  plant: {
    sfSymbolName: 'leaf.fill',
    materialIconName: 'sprout',
    keywords: 'leaf sprout',
  },

  // Dining
  dining: {
    sfSymbolName: 'fork.knife',
    materialIconName: 'silverware-fork-knife',
    keywords: 'dining fork knife',
  },
  wineglass: {
    // sfSymbolName: 'wineglass.fill',
    materialIconName: 'glass-wine',
    keywords: 'glass-wine',
  },
  winebottle: {
    // sfSymbolName: 'wineglass.fill',
    materialIconName: 'bottle-wine',
    keywords: 'bottle-wine',
  },
  coffee: {
    materialIconName: 'coffee',
  },
  cup: {
    materialIconName: 'cup',
  },
  knife: {
    materialIconName: 'knife',
    keywords: 'knife',
  },
  food: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'food-apple',
    keywords: 'food',
  },
  cupcake: {
    materialIconName: 'cupcake',
  },
  kettle: {
    // sfSymbolName: '',
    materialIconName: 'kettle-steam',
    keywords: 'kettle-steam',
  },
  hanger: {
    // sfSymbolName: '',
    materialIconName: 'hanger',
    keywords: '',
  },

  // Book
  book: {
    sfSymbolName: 'book.closed.fill',
    materialIconName: 'book',
    keywords: 'book books library',
  },
  books: {
    sfSymbolName: 'books.vertical.fill',
    materialIconName: 'bookshelf',
    keywords: 'book books library',
  },
  magazine: {
    sfSymbolName: 'magazine.fill',
    materialIconName: 'book-open-page-variant',
    keywords: 'books library magazine',
  },

  // Office
  stationery: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'pencil-ruler',
    keywords: 'pencil ruler paper',
  },
  desk: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'desk',
    keywords: 'desk',
  },
  paper: {
    sfSymbolName: 'doc.fill',
    materialIconName: 'file',
    keywords: 'document paper file',
  },
  document: {
    sfSymbolName: 'doc.text.fill',
    materialIconName: 'file-document',
    keywords: 'document paper',
  },
  tray: {
    sfSymbolName: 'tray.fill',
    materialIconName: 'tray',
    keywords: 'tray',
  },
  ruler: {
    sfSymbolName: 'ruler.fill',
    materialIconName: 'ruler',
    keywords: 'ruler',
  },
  tag: {
    sfSymbolName: 'tag.fill',
    materialIconName: 'tag',
    keywords: 'tab label',
  },
  list: {
    sfSymbolName: 'list.bullet',
    materialIconName: 'format-list-bulleted',
    keywords: 'format-list-bulleted',
  },

  // Personal Items
  clothes: {
    sfSymbolName: 'tshirt.fill',
    materialIconName: 'tshirt-crew',
    keywords: 'clothes tshirt t-shirt',
  },
  shoe: {
    // sfSymbolName: '',
    materialIconName: 'shoe-formal',
    keywords: 'shoe',
  },
  comb: {
    sfSymbolName: 'comb.fill',
    materialIconName: 'square',
    keywords: 'comb',
  },
  hairdryer: {
    // sfSymbolName: 'hairdryer',
    materialIconName: 'hair-dryer',
    keywords: 'hairdryer',
  },
  toothbrush: {
    // sfSymbolName: 'toothbrush',
    materialIconName: 'toothbrush',
    keywords: 'toothbrush',
  },
  'toothbrush-paste': {
    // sfSymbolName: 'toothbrush-paste',
    materialIconName: 'toothbrush-paste',
    keywords: 'toothbrush-paste toothpaste',
  },
  key: {
    sfSymbolName: 'key.fill',
    materialIconName: 'key',
    keywords: 'key',
  },
  wallet: {
    sfSymbolName: 'wallet.pass.fill',
    materialIconName: 'wallet',
    keywords: 'wallet',
  },
  suitcase: {
    // sfSymbolName: 'suitcase.fill',
    materialIconName: 'bag-suitcase',
    keywords: 'travel suitcase',
  },
  briefcase: {
    sfSymbolName: 'briefcase.fill',
    materialIconName: 'briefcase',
    keywords: 'bag briefcase',
  },
  'latch-case': {
    sfSymbolName: 'latch.2.case.fill',
    materialIconName: 'toolbox',
    keywords: 'bag briefcase',
  },
  'cross-case': {
    sfSymbolName: 'cross.case.fill',
    materialIconName: 'medical-bag',
    keywords: 'medication',
  },
  backpack: {
    // sfSymbolName: 'backpack.fill',
    materialIconName: 'bag-personal',
    keywords: 'bag personal backpack',
  },
  medication: {
    sfSymbolName: 'cross.vial.fill',
    materialIconName: 'pill',
    keywords: 'medication',
  },

  // Electronics
  'phone-and-computer': {
    // sfSymbolName: 'laptopcomputer.and.iphone',
    materialIconName: 'cellphone-link',
    keywords: 'computer phone laptop electronics',
  },
  'laptop-computer': {
    sfSymbolName: 'laptopcomputer',
    materialIconName: 'laptop',
    keywords: '',
  },
  'desktop-computer': {
    sfSymbolName: 'desktopcomputer',
    materialIconName: 'desktop-classic',
    keywords: '',
  },
  tablet: {
    materialIconName: 'tablet',
    keywords: '',
  },
  cellphone: {
    materialIconName: 'cellphone',
    keywords: '',
  },
  headphones: {
    sfSymbolName: 'headphones',
    materialIconName: 'headphones',
    keywords: 'headphones',
  },
  monitor: {
    materialIconName: 'monitor',
    keywords: 'screen',
  },
  speaker: {
    sfSymbolName: 'hifispeaker.fill',
    materialIconName: 'speaker',
    keywords: 'hifispeaker',
  },
  keyboard: {
    sfSymbolName: 'keyboard.fill',
    materialIconName: 'keyboard',
    keywords: '',
  },
  'computer-mouse': {
    sfSymbolName: 'computermouse.fill',
    materialIconName: 'mouse',
    keywords: 'computermouse',
  },
  'external-drive': {
    sfSymbolName: 'externaldrive.fill',
    materialIconName: 'harddisk',
    keywords: 'harddisk',
  },
  'usb-port': {
    // sfSymbolName: '',
    materialIconName: 'usb-port',
    keywords: '',
  },
  'hdmi-port': {
    // sfSymbolName: '',
    materialIconName: 'video-input-hdmi',
    keywords: '',
  },
  'ethernet-port': {
    // sfSymbolName: '',
    materialIconName: 'ethernet-cable',
    keywords: '',
  },
  'data-cable': {
    // sfSymbolName: '',
    materialIconName: 'cable-data',
    keywords: '',
  },
  chip: {
    sfSymbolName: 'memorychip',
    materialIconName: 'chip',
    keywords: 'chip cpu electronics',
  },
  flashlight: {
    sfSymbolName: 'flashlight.on.fill',
    materialIconName: 'flashlight',
    keywords: 'flashlight',
  },
  bolt: {
    sfSymbolName: 'bolt.fill',
    materialIconName: 'lightning-bolt',
    keywords: 'lightning',
  },
  powerplug: {
    sfSymbolName: 'powerplug.fill',
    materialIconName: 'power-plug',
    keywords: 'powerplug',
  },

  // Appliances
  tv: {
    sfSymbolName: 'tv.inset.filled',
    materialIconName: 'television',
    keywords: 'television',
  },
  microwave: {
    // sfSymbolName: 'microwave.fill',
    materialIconName: 'microwave',
    keywords: 'microwave kitchen',
  },
  oven: {
    // sfSymbolName: 'oven.fill',
    materialIconName: 'toaster-oven',
    keywords: 'oven kitchen',
  },
  dishwasher: {
    // sfSymbolName: 'dishwasher.fill',
    materialIconName: 'dishwasher',
    keywords: 'dishwasher kitchen',
  },
  'washing-machine': {
    // sfSymbolName: 'washer.fill',
    materialIconName: 'washing-machine',
    keywords: 'washing machine clothes',
  },
  vacuum: {
    // sfSymbolName: 'vacuum.fill',
    materialIconName: 'vacuum',
    keywords: 'vacuum cleaner',
  },
  fan: {
    // sfSymbolName: 'fan',
    materialIconName: 'fan',
    keywords: 'fan',
  },

  // Outdoors
  sun: {
    sfSymbolName: 'sun.max.fill',
    materialIconName: 'white-balance-sunny',
    keywords: 'outdoor',
  },
  umbrella: {
    sfSymbolName: 'umbrella.fill',
    materialIconName: 'umbrella',
    keywords: 'umbrella',
  },

  // Transport
  airplane: {
    sfSymbolName: 'airplane',
    materialIconName: 'airplane',
    keywords: 'travel',
  },
  bicycle: {
    sfSymbolName: 'bicycle',
    materialIconName: 'bicycle',
    keywords: 'bicycle',
  },
  scooter: {
    // sfSymbolName: 'scooter',
    materialIconName: 'moped',
    keywords: 'scooter moped',
  },
  // motorcycle: {
  //   // sfSymbolName: 'scooter',
  //   materialIconName: 'atv',
  //   keywords: 'scooter motorcycle atv',
  // },
  car: {
    sfSymbolName: 'car.fill',
    materialIconName: 'car',
    keywords: 'car',
  },

  // Activities
  gamecontroller: {
    sfSymbolName: 'gamecontroller.fill',
    materialIconName: 'microsoft-xbox-controller',
    keywords: 'gamecontroller',
  },
  'card-game': {
    // sfSymbolName: 'greetingcard.fill',
    materialIconName: 'cards-playing-spade-multiple',
    keywords: '',
  },
  piano: {
    sfSymbolName: 'pianokeys',
    materialIconName: 'piano',
    keywords: 'pianokeys',
  },
  dumbbell: {
    // sfSymbolName: 'dumbbell',
    materialIconName: 'dumbbell',
    keywords: 'dumbbell sport workout',
  },
  // baseball: {
  //   sfSymbolName: 'baseball.fill',
  //   materialIconName: 'file',
  //   keywords: 'document paper file',
  // },

  // Things for making things
  camera: {
    sfSymbolName: 'camera.fill',
    materialIconName: 'camera',
    keywords: 'gamecontroller',
  },
  cutter: {
    materialIconName: 'box-cutter',
    keywords: 'knife',
  },
  printer: {
    sfSymbolName: 'printer.filled.and.paper',
    materialIconName: 'printer',
    keywords: '',
  },
  '3d-printer': {
    // sfSymbolName: 'printer.filled.and.paper',
    materialIconName: 'printer-3d',
    keywords: '',
  },
  'label-printer': {
    // sfSymbolName: 'printer.filled.and.paper',
    materialIconName: 'printer-pos',
    keywords: '',
  },
  scanner: {
    sfSymbolName: 'scanner.fill',
    materialIconName: 'scanner',
    keywords: '',
  },
  tools: {
    sfSymbolName: 'wrench.and.screwdriver.fill',
    materialIconName: 'hammer-screwdriver',
    keywords: 'tools hammer screwdriver wrench',
  },
  screwdriver: {
    sfSymbolName: 'screwdriver.fill',
    materialIconName: 'screwdriver',
    keywords: 'screwdriver',
  },
  hammer: {
    sfSymbolName: 'hammer.fill',
    materialIconName: 'hammer',
    keywords: 'tools hammer',
  },
  wrench: {
    // sfSymbolName: 'wrench.adjustable.fill',
    materialIconName: 'wrench',
    keywords: 'tools wrench',
  },
  'hand-saw': {
    materialIconName: 'hand-saw',
    keywords: '',
  },
  'circular-saw': {
    materialIconName: 'circular-saw',
    keywords: '',
  },
  'saw-blade': {
    materialIconName: 'saw-blade',
    keywords: '',
  },
  'test-tube': {
    materialIconName: 'saw-blade',
    keywords: '',
  },

  // Material
  water: {
    sfSymbolName: 'drop.fill',
    materialIconName: 'water',
    keywords: 'water drop',
  },

  // Military
  'military-knife': {
    materialIconName: 'knife-military',
    keywords: 'dagger poniard saber',
  },
  pistol: {
    materialIconName: 'pistol',
    keywords: 'gun',
  },
  'pistol-magazine': {
    materialIconName: 'magazine-pistol',
    keywords: 'gun',
  },

  // App
  'rfid-locate': {
    sfSymbolName: 'scope',
    materialIconName: 'magnify-scan',
  },
  'rfid-write': {
    sfSymbolName: 'dot.radiowaves.forward',
    // sfSymbolStyle: {},
    materialIconName: 'square-edit-outline',
  },
  'app-exclamation': {
    sfSymbolName: 'exclamationmark.triangle.fill',
    materialIconName: 'exclamation-thick',
  },
  'app-reorder': {
    sfSymbolName: 'list.bullet.indent',
    materialIconName: 'sort',
  },
  'app-questionmark': {
    sfSymbolName: 'questionmark',
    materialIconName: 'help',
  },
  add: {
    sfSymbolName: 'plus',
    materialIconName: 'plus',
  },

  // Shape
  heart: {
    sfSymbolName: 'heart.fill',
    materialIconName: 'heart',
    keywords: 'heart favorite love like',
  },
  shield: {
    sfSymbolName: 'shield.fill',
    materialIconName: 'shield',
    keywords: 'shield',
  },
  triangle: {
    sfSymbolName: 'triangle.fill',
    materialIconName: 'triangle',
    keywords: 'triangle',
  },
  square: {
    sfSymbolName: 'square.fill',
    materialIconName: 'square',
    keywords: 'square',
  },
  diamond: {
    sfSymbolName: 'diamond.fill',
    materialIconName: 'diamond',
    keywords: 'diamond',
  },
  pentagon: {
    sfSymbolName: 'pentagon.fill',
    materialIconName: 'pentagon',
    keywords: 'pentagon',
  },
  hexagon: {
    sfSymbolName: 'hexagon.fill',
    materialIconName: 'hexagon',
    keywords: 'hexagon',
  },
  circle: {
    sfSymbolName: 'circle.fill',
    materialIconName: 'circle',
    keywords: 'circle',
  },
  seal: {
    sfSymbolName: 'seal.fill',
    materialIconName: 'seal',
    keywords: 'seal',
  },

  // Other
  // carrot: {
  //   sfSymbolName: 'carrot.fill',
  //   materialIconName: 'carrot',
  //   keywords: '',
  // },
  // poweroutlet: {
  //   sfSymbolName: 'poweroutlet.strip.fill',
  //   materialIconName: '',
  //   keywords: '',
  // },
  // 'desk-lamp': {
  //   sfSymbolName: 'lamp.desk.fill',
  //   materialIconName: 'lamp',
  //   keywords: '',
  // },
} as const;

export const ICON_NAMES = objectEntries(ICONS).map(([name]) => name);

export type IconName = keyof typeof ICONS;
