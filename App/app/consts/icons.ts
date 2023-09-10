import { Platform } from 'react-native';

import objectEntries from '@app/utils/objectEntries';
import { unknown } from 'zod';

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

export type IconColor = (typeof ICON_COLORS)[number];

function sfSymbolForOSVersion(
  sfSymbolName: string,
  { ios }: { ios: number },
): string | undefined {
  if (Platform.OS === 'ios') {
    const majorVersionIOS = parseInt(Platform.Version, 10);
    if (majorVersionIOS < ios) {
      return undefined;
    }

    return sfSymbolName;
  }

  return undefined;
}

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
  'box-open': {
    fa5IconName: 'box-open',
    materialIconName: 'cube',
    keywords: '',
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
  chair: {
    // sfSymbolName: 'chair.fill',
    fa5IconName: 'chair',
    keywords: 'seat',
  },
  bed: {
    sfSymbolName: 'bed.double.fill',
    materialIconName: 'bed-double',
    keywords: 'bed sleep',
  },
  table: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'table-furniture',
    keywords: 'table-furniture',
  },
  'art-frame': {
    sfSymbolName: 'photo.artframe',
    fa5IconName: 'image',
    keywords: 'painting photo',
  },
  sink: {
    // sfSymbolName: 'sink.fill',
    materialIconName: 'countertop',
    fa5IconName: 'sink',
    keywords: 'countertop sink bathroom toilet',
  },
  toilet: {
    fa5IconName: 'toilet',
  },
  'toilet-paper': {
    fa5IconName: 'toilet-paper',
  },
  bathtub: {
    // sfSymbolName: 'bathtub.fill',
    fa5IconName: 'bath',
    materialIconName: 'bathtub',
    keywords: 'bathtub bathroom toilet',
  },
  shower: {
    // sfSymbolName: 'shower.fill',
    fa5IconName: 'shower',
    materialIconName: 'shower-head',
    keywords: 'shower bathroom toilet',
  },
  spigot: {
    // sfSymbolName: 'spigot.fill',
    fa5IconName: 'faucet',
    keywords: 'faucet water',
  },
  'pump-soap': {
    // sfSymbolName: 'shower.fill',
    fa5IconName: 'pump-soap',
    keywords: 'bathroom toilet bottle',
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
    keywords: 'delete trash',
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
  'martini-glass': {
    fa5IconName: 'glass-martini',
  },
  wineglass: {
    sfSymbolName: sfSymbolForOSVersion('wineglass.fill', { ios: 16 }),
    fa5IconName: 'wine-glass',
    materialIconName: 'glass-wine',
    keywords: 'glass-wine',
  },
  winebottle: {
    // sfSymbolName: 'wineglass.fill',
    materialIconName: 'bottle-wine',
    keywords: 'bottle-wine',
  },
  bottle: {
    // sfSymbolName: 'wineglass.fill',
    materialIconName: 'bottle-soda',
    keywords: '',
  },
  knife: {
    materialIconName: 'knife',
    keywords: 'knife',
  },
  coffee: {
    sfSymbolName: sfSymbolForOSVersion('cup.and.saucer.fill', { ios: 15 }),
    materialIconName: 'coffee',
  },
  cup: {
    materialIconName: 'cup',
  },
  beer: {
    fa5IconName: 'beer',
  },
  'tissue-box': {
    fa5IconName: 'box-tissue',
  },
  food: {
    sfSymbolName: sfSymbolForOSVersion('carrot.fill', { ios: 16 }),
    materialIconName: 'carrot',
    keywords: 'carrot',
  },
  kettle: {
    // sfSymbolName: '',
    materialIconName: 'kettle-steam',
    keywords: 'kettle-steam',
  },
  bread: {
    fa5IconName: 'bread-slice',
  },
  cookie: {
    fa5IconName: 'cookie',
  },
  cupcake: {
    materialIconName: 'cupcake',
  },
  carrot: {
    // sfSymbolName: 'carrot.fill',
    materialIconName: 'carrot',
    keywords: '',
  },
  apple: {
    // sfSymbolName: 'pencil.and.ruler.fill',
    materialIconName: 'food-apple',
    keywords: 'food',
  },
  lemon: {
    fa5IconName: 'lemon',
  },
  egg: {
    fa5IconName: 'egg',
  },
  fish: {
    // sfSymbolName: 'fish.fill',
    fa5IconName: 'fish',
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
  'sticky-note': {
    fa5IconName: 'sticky-note',
    materialIconName: 'file',
    keywords: 'post-it post it',
  },
  receipt: {
    fa5IconName: 'receipt',
    keywords: 'paper',
  },
  stamp: {
    fa5IconName: 'stamp',
  },
  tray: {
    sfSymbolName: 'tray.fill',
    materialIconName: 'tray',
    keywords: 'tray',
  },
  paperclip: {
    fa5IconName: 'paperclip',
    materialIconName: 'file',
    keywords: 'paper clip',
  },
  eraser: {
    // sfSymbolName: 'eraser.fill',
    materialIconName: 'eraser',
  },
  pencil: {
    materialIconName: 'pencil',
  },
  pen: {
    materialIconName: 'pen',
  },
  'fountain-pen': {
    materialIconName: 'fountain-pen',
  },
  marker: {
    fa5IconName: 'marker',
  },
  paintbrush: {
    sfSymbolName: 'paintbrush.pointed.fill',
    fa5IconName: 'paint-brush',
  },
  ruler: {
    sfSymbolName: 'ruler.fill',
    materialIconName: 'ruler',
    keywords: 'ruler',
  },
  scissors: {
    sfSymbolName: 'scissors',
    materialIconName: 'content-cut',
    keywords: 'scissors cut cutter',
  },
  'drafting-compass': {
    fa5IconName: 'drafting-compass',
  },
  magnifier: {
    sfSymbolName: 'magnifyingglass',
    fa5IconName: 'search',
  },
  tape: {
    fa5IconName: 'tape',
    materialIconName: 'tape-measure',
  },
  tag: {
    sfSymbolName: 'tag.fill',
    materialIconName: 'tag',
    keywords: 'tab label',
  },
  magnet: {
    fa5IconName: 'magnet',
  },
  list: {
    sfSymbolName: 'list.bullet',
    materialIconName: 'format-list-bulleted',
    keywords: 'format-list-bulleted',
  },
  feather: {
    fa5IconName: 'feather-alt',
  },

  // Personal Items
  clothes: {
    sfSymbolName: 'tshirt.fill',
    materialIconName: 'tshirt-crew',
    keywords: 'clothes tshirt t-shirt',
  },
  hanger: {
    // sfSymbolName: '',
    materialIconName: 'hanger',
    keywords: '',
  },
  shoe: {
    // sfSymbolName: '',
    materialIconName: 'shoe-formal',
    keywords: 'shoe',
  },
  'shoe-heel': {
    // sfSymbolName: '',
    materialIconName: 'shoe-heel',
    keywords: 'shoe-heel',
  },
  'shoe-sneaker': {
    // sfSymbolName: '',
    materialIconName: 'shoe-sneaker',
    keywords: 'shoe-sneaker',
  },
  socks: {
    fa5IconName: 'socks',
  },
  slipper: {
    fontistoIconName: 'beach-slipper',
  },
  glasses: {
    sfSymbolName: 'eyeglasses',
    materialIconName: 'glasses',
    keywords: 'eyeglasses',
  },
  hat: {
    materialIconName: 'hat-fedora',
  },
  'cowboy-hat': {
    fa5IconName: 'hat-cowboy-side',
  },
  'hard-hat': {
    fa5IconName: 'hard-hat',
  },
  helmet: {
    materialIconName: 'racing-helmet',
  },
  'face-mask': {
    sfSymbolName: 'facemask.fill',
    materialIconName: 'face-mask',
    keywords: 'facemask face-mask',
  },
  towel: {
    materialIconName: 'receipt',
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
    fa5IconName: 'key',
    materialIconName: 'key',
    keywords: 'key',
  },
  wallet: {
    // sfSymbolName: 'wallet.pass.fill',
    fa5IconName: 'wallet',
    materialIconName: 'wallet',
    keywords: 'wallet',
  },
  'id-card': {
    fa5IconName: 'id-card',
  },
  'id-badge': {
    fa5IconName: 'id-badge',
  },
  'credit-card': {
    sfSymbolName: 'creditcard.fill',
    materialIconName: 'credit-card',
    keywords: 'money wallet',
  },
  'money-bill': {
    fa5IconName: 'money-bill',
  },
  'wallet-pass': {
    sfSymbolName: 'wallet.pass.fill',
    fa5IconName: 'ticket-alt',
  },
  ticket: {
    fa5IconName: 'ticket-alt',
  },
  passport: {
    fa5IconName: 'passport',
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
  'shopping-bag': {
    fa5IconName: 'shopping-bag',
    materialIconName: 'shopping',
    keywords: 'bag personal',
  },
  basket: {
    materialIconName: 'basket',
    keywords: 'bag personal',
  },
  medal: {
    // sfSymbolName: 'medal.fill',
    fa5IconName: 'medal',
  },
  trophy: {
    // sfSymbolName: 'trophy.fill',
    fa5IconName: 'trophy',
  },
  cross: {
    fa5IconName: 'cross',
  },
  bible: {
    fa5IconName: 'bible',
  },
  spray: {
    materialIconName: 'spray',
  },
  'spray-bottle': {
    materialIconName: 'spray-bottle',
  },
  lipstick: {
    materialIconName: 'lipstick',
  },
  lock: {
    sfSymbolName: 'lock.fill',
    fa5IconName: 'lock',
  },
  smoking: {
    fa5IconName: 'smoking',
  },

  // Medication
  medication: {
    sfSymbolName: 'cross.vial.fill',
    materialIconName: 'pill',
    keywords: 'medication',
  },
  pill: {
    // sfSymbolName: 'pill.fill',
    fa5IconName: 'capsules',
    materialIconName: 'pill',
    keywords: 'medication',
  },
  'medicine-bottle': {
    sfSymbolName: 'cross.vial.fill',
    fa5IconName: 'prescription-bottle-alt',
    materialIconName: 'pill',
    keywords: 'medication',
  },
  'prescription-bottle': {
    fa5IconName: 'prescription-bottle',
  },
  'eye-dropper': {
    fa5IconName: 'eye-dropper',
  },
  'medical-thermometer': {
    // sfSymbolName: 'medical.thermometer.fill',
    fa5IconName: 'thermometer-half',
  },
  bandage: {
    sfSymbolName: 'bandage.fill',
    fa5IconName: 'band-aid',
  },
  'first-aid': {
    fa5IconName: 'first-aid',
  },
  syringe: {
    // sfSymbolName: 'syringe.fill',
    fa5IconName: 'syringe',
  },
  cannabis: {
    fa5IconName: 'cannabis',
    keywords: 'weed',
  },
  'joint-cannabis': {
    fa5IconName: 'joint',
    keywords: 'weed smoke',
  },
  bong: {
    fa5IconName: 'bong',
    keywords: 'weed smoke',
  },
  biohazard: {
    fa5IconName: 'biohazard',
    keywords: 'biological hazard',
  },
  radiation: {
    fa5IconName: 'radiation',
  },

  // Electronics
  'phone-and-computer': {
    // sfSymbolName: 'laptopcomputer.and.iphone',
    materialIconName: 'cellphone-link',
    keywords: 'computer phone laptop electronics',
  },
  'laptop-computer': {
    sfSymbolName: 'laptopcomputer',
    fa5IconName: 'laptop',
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
  projector: {
    materialIconName: 'projector',
    keywords: 'screen',
  },
  'projector-screen': {
    materialIconName: 'projector-screen',
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
  'compact-disc': {
    fa5IconName: 'compact-disc',
  },
  'external-drive': {
    sfSymbolName: 'externaldrive.fill',
    materialIconName: 'harddisk',
    keywords: 'harddisk',
  },
  'wifi-router': {
    // sfSymbolName: 'wifi.router.fill',
    fa5IconName: 'wifi',
  },
  'sim-card': {
    fa5IconName: 'sim-card',
  },
  'sd-card': {
    // sfSymbolName: '',
    materialIconName: 'sd',
    keywords: '',
  },
  'micro-sd-card': {
    // sfSymbolName: '',
    materialIconName: 'micro-sd',
    keywords: '',
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
  'satellite-dish': {
    fa5IconName: 'satellite-dish',
  },
  satellite: {
    fa5IconName: 'satellite',
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
  blender: {
    fa5IconName: 'blender',
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
  iron: {
    materialIconName: 'iron',
  },
  'air-purifier': {
    // sfSymbolName: 'air.purifier.fill',
    materialIconName: 'air-purifier',
  },

  // Cleaning
  broom: {
    fa5IconName: 'broom',
  },

  // Outdoors
  sun: {
    sfSymbolName: 'sun.max.fill',
    materialIconName: 'white-balance-sunny',
    keywords: 'outdoor weather',
  },
  'cloud-sun': {
    sfSymbolName: 'cloud.sun.fill',
    materialIconName: 'weather-partly-cloudy',
    keywords: 'outdoor weather',
  },
  cloud: {
    sfSymbolName: 'cloud.fill',
    materialIconName: 'cloud',
    keywords: 'outdoor weather',
  },
  'cloud-rain': {
    sfSymbolName: 'cloud.rain.fill',
    materialIconName: 'weather-pouring',
    keywords: 'outdoor weather',
  },
  'cloud-snow': {
    sfSymbolName: 'cloud.snow.fill',
    materialIconName: 'weather-snowy',
    keywords: 'outdoor weather',
  },
  snowflake: {
    sfSymbolName: 'snowflake',
    fa5IconName: 'snowflake',
    keywords: 'outdoor weather',
  },
  umbrella: {
    sfSymbolName: 'umbrella.fill',
    materialIconName: 'umbrella',
    keywords: 'umbrella',
  },
  compass: {
    fa5IconName: 'compass',
  },
  binoculars: {
    sfSymbolName: 'binoculars.fill',
    fa5IconName: 'binoculars',
    keywords: 'find finder search',
  },
  bullhorn: {
    fa5IconName: 'bullhorn',
  },
  flag: {
    sfSymbolName: 'flag.fill',
    fa5IconName: 'flag',
  },
  tent: {
    fa5IconName: 'campground',
    keywords: 'camp',
  },
  fire: {
    sfSymbolName: 'flame.fill',
    fa5IconName: 'fire',
    keywords: 'lighter',
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
  motorcycle: {
    // sfSymbolName: 'scooter',
    // materialIconName: 'atv',
    fa5IconName: 'motorcycle',
    keywords: 'scooter motorcycle atv',
  },
  car: {
    sfSymbolName: 'car.fill',
    materialIconName: 'car',
    keywords: 'car',
  },
  truck: {
    fa5IconName: 'truck',
  },
  helicopter: {
    // fa5SymbolName: 'helicopter',
    materialIconName: 'helicopter',
  },

  // Activities
  music: {
    fa5IconName: 'music',
  },
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
  chess: {
    fa5IconName: 'chess-knight',
  },
  piano: {
    sfSymbolName: 'pianokeys',
    materialIconName: 'piano',
    keywords: 'pianokeys',
  },
  guitar: {
    fa5IconName: 'guitar',
  },
  drum: {
    fa5IconName: 'drum',
  },
  racket: {
    // sfSymbolName: 'tennis.racket',
    materialIconName: 'tennis',
  },
  dumbbell: {
    // sfSymbolName: 'dumbbell',
    fa5IconName: 'dumbbell',
    materialIconName: 'dumbbell',
    keywords: 'dumbbell sport workout',
  },
  // baseball: {
  //   sfSymbolName: 'baseball.fill',
  //   materialIconName: 'file',
  //   keywords: 'document paper file',
  // },

  // Matter of time
  clock: {
    sfSymbolName: 'clock.fill',
    fa5IconName: 'clock',
    keywords: 'time',
  },
  stopwatch: {
    sfSymbolName: 'stopwatch.fill',
    fa5IconName: 'stopwatch',
    keywords: 'time timer',
  },
  alarm: {
    sfSymbolName: 'alarm.fill',
    materialIconName: 'alarm',
    keywords: 'time',
  },
  calender: {
    sfSymbolName: 'calendar',
    fa5IconName: 'calendar-alt',
    keywords: 'time date',
  },

  // Things for making things, tools
  camera: {
    sfSymbolName: 'camera.fill',
    materialIconName: 'camera',
    keywords: 'camera recorder',
  },
  video: {
    sfSymbolName: 'video.fill',
    materialIconName: 'video',
    keywords: 'camera video recorder',
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
  microscope: {
    fa5IconName: 'microscope',
  },
  swatchbook: {
    fa5IconName: 'swatchbook',
    keywords: 'samples',
  },
  tools: {
    sfSymbolName: 'wrench.and.screwdriver.fill',
    materialIconName: 'hammer-screwdriver',
    keywords: 'tools hammer screwdriver wrench',
  },
  'tape-measure': {
    materialIconName: 'tape-measure',
  },
  pliers: {
    materialIconName: 'pliers',
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
  gavel: {
    fa5IconName: 'gavel',
  },
  wrench: {
    // sfSymbolName: 'wrench.adjustable.fill',
    materialIconName: 'wrench',
    keywords: 'tools wrench',
  },
  nail: {
    materialIconName: 'nail',
    keywords: '',
  },
  screw: {
    materialIconName: 'screw-machine-flat-top',
    keywords: 'bolt',
  },
  nut: {
    materialIconName: 'nut',
    keywords: 'screw',
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
    materialIconName: 'test-tube',
    keywords: '',
  },
  flask: {
    fa5IconName: 'flask',
  },
  funnel: {
    fa5IconName: 'filter',
  },
  ladder: {
    materialIconName: 'ladder',
    keywords: '',
  },
  cart: {
    fa5IconName: 'dolly-flatbed',
  },
  dolly: {
    fa5IconName: 'dolly',
  },
  shovel: {
    materialIconName: 'shovel',
    keywords: '',
  },
  brush: {
    sfSymbolName: 'paintbrush.fill',
    fa5IconName: 'brush',
  },
  'paint-roller': {
    fa5IconName: 'paint-roller',
  },
  thermometer: {
    fa5IconName: 'thermometer-half',
    keywords: 'temperature',
  },
  tachometer: {
    fa5IconName: 'tachometer-alt',
    keywords: 'meter',
  },
  'fire-extinguisher': {
    materialIconName: 'fire-extinguisher',
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
    sfSymbolName: 'dot.radiowaves.forward',
    materialIconName: 'magnify-scan',
  },
  'rfid-write': {
    // sfSymbolName: 'arrowtriangle.left.square',
    sfSymbolName: 'arrow.down.left.square',
    // sfSymbolStyle: {},
    materialIconName: 'square-edit-outline',
  },
  'app-exclamation': {
    sfSymbolName: 'exclamationmark.triangle.fill',
    materialIconName: 'exclamation-thick',
  },
  'app-info': {
    sfSymbolName: 'info.circle.fill',
    materialIconName: 'information',
  },
  'app-reorder': {
    sfSymbolName: 'list.bullet.indent',
    materialIconName: 'sort',
  },
  'app-questionmark': {
    sfSymbolName: 'questionmark',
    materialIconName: 'help',
  },
  'app-rfid-scan': {
    sfSymbolName: 'dot.radiowaves.forward',
    materialIconName: 'cellphone-wireless',
  },
  'app-plus': {
    sfSymbolName: 'plus.circle.fill',
    materialIconName: 'plus-circle',
  },
  'app-minus': {
    sfSymbolName: 'minus.circle.fill',
    materialIconName: 'minus-circle',
  },
  'app-plus-without-frame': {
    sfSymbolName: 'plus',
    materialIconName: 'plus',
  },
  'app-minus-without-frame': {
    sfSymbolName: 'minus',
    materialIconName: 'minus',
  },
  add: {
    sfSymbolName: 'plus',
    materialIconName: 'plus',
  },
  checklist: {
    sfSymbolName: 'checklist',
    materialIconName: 'order-bool-descending-variant',
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

export function verifyIconName(
  iconName: string | undefined | unknown,
): IconName | undefined {
  if (!iconName) return undefined;

  if (ICON_NAMES.includes(iconName as any)) {
    return iconName as any;
  }

  return undefined;
}

export function verifyIconNameWithDefault(
  iconName: string | undefined | unknown,
  df: IconName = 'cube-outline',
): IconName {
  return verifyIconName(iconName) || df;
}

export function verifyIconColor(
  iconColor: string | undefined | unknown,
): IconColor | undefined {
  if (!iconColor) return undefined;

  if (ICON_COLORS.includes(iconColor as any)) {
    return iconColor as any;
  }

  return undefined;
}

export function verifyIconColorWithDefault(
  iconColor: string | undefined | unknown,
  df: IconColor = 'gray',
): IconColor {
  return verifyIconColor(iconColor) || df;
}
