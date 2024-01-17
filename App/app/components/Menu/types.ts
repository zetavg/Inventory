import type { ColorValue } from 'react-native';

/**
 * The state of the action.
 * - off: A constant indicating the menu element is in the “off” state.
 * - on: A constant indicating the menu element is in the “on” state.
 * - mixed: A constant indicating the menu element is in the “mixed” state.
 */
type MenuState = 'off' | 'on' | 'mixed';

export type MenuAction = {
  type?: 'section';
  onPress?: () => void;
  /**
   * The action's title.
   */
  title?: string;
  /**
   * (iOS only) The SF Symbol name of the icon for the action.
   * @platform iOS
   */
  sfSymbolName?: string;
  // /**
  //  * (Android only)
  //  * The action's title color.
  //  * @platform Android
  //  */
  // titleColor?: number | ColorValue;
  // /**
  //  * (iOS14+ only)
  //  * An elaborated title that explains the purpose of the action.
  //  * @platform iOS
  //  */
  // subtitle?: string;
  /**
   * The attributes indicating the style of the action.
   */
  attributes?: MenuAttributes;
  /**
   * The state of the action.
   */
  state?: MenuState;
  /**
   * An attribute indicating the destructive style.
   */
  destructive?: boolean;
  // /**
  //  * (Android and iOS13+ only)
  //  * - The action's image.
  //  * - Allows icon name included in project or system (Android) resources drawables and
  //  * in SF Symbol (iOS)
  //  * @example // (iOS)
  //  * image="plus"
  //  * @example // (Android)
  //  * image="ic_menu_add"
  //  * - TODO: Allow images other than those included in SF Symbol and resources drawables
  //  */
  // image?: string;
  // /**
  //  * (Android and iOS13+ only)
  //  * - The action's image color.
  //  */
  // imageColor?: number | ColorValue;
  /**
   * (Android and iOS14+ only)
   * - Actions to be displayed in the sub menu
   * - On Android it does not support nesting next sub menus in sub menu item
   */
  children?: MenuAction[];
  /**
   * Whether nested children should be inline (separated by divider) or nested (sub menu)
   */
  // displayChildrenInline?: boolean;
};
