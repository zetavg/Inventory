import React, { useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

import {
  MenuAction as RNMenuAction,
  MenuView as RNMenuView,
  NativeActionEvent,
} from '@react-native-menu/menu';

import useActionSheet from '@app/hooks/useActionSheet';
import useLogger from '@app/hooks/useLogger';

import { MenuAction } from './types';

export type Props = {
  /** The title of the menu. Currently it will only work on iOS. */
  title?: string;
  /** Actions in the menu. */
  actions: ReadonlyArray<MenuAction>;
  children?: React.ReactNode | undefined;
  disabled?: boolean;
};

const NATIVE_STATE_SUPPORTED = Platform.OS === 'ios';

function processActions(
  actions: ReadonlyArray<MenuAction>,
  { idPrefix }: { idPrefix?: string } = {},
): RNMenuAction[] {
  return actions.map((action, i) => {
    const id = `${idPrefix || ''}${i}`;
    return {
      id: id,
      title:
        NATIVE_STATE_SUPPORTED || !action.state
          ? (action.title as any)
          : `${(() => {
              switch (action.state) {
                case 'on':
                  return '☑';
                case 'off':
                  return '☐';
                case 'mixed':
                  return '☒';
              }
            })()} ${action.title}`,
      image: Platform.select({
        ios: action.sfSymbolName,
        android: undefined, // Not supported yet
      }),
      state: NATIVE_STATE_SUPPORTED ? action.state : undefined,
      subactions: Array.isArray(action.children)
        ? processActions(action.children, { idPrefix: `${id}-` })
        : undefined,
      attributes: {
        destructive: action.destructive,
      },
      displayInline: action.type === 'section',
    };
  });
}

export default function MenuView({
  title,
  actions,
  disabled,
  ...restProps
}: Props) {
  const logger = useLogger('MenuView');
  const processedActions = useMemo(() => processActions(actions), [actions]);
  const handlePressAction = useCallback<
    ({ nativeEvent }: NativeActionEvent) => void
  >(
    e => {
      const id = e.nativeEvent.event;
      const idA = id.split('-');

      let currentActions: typeof actions | undefined = actions;
      let action: MenuAction | undefined;
      for (const idP of idA) {
        if (!Array.isArray(currentActions)) {
          logger.error(
            `Cannot find action by ID "${id}". There might be a bug in the MenuView component. Please report this to the developer.`,
            { showAlert: true },
          );
          return;
        }
        action = currentActions[parseInt(idP, 10)];
        currentActions = action?.children;
      }

      if (!action) {
        logger.error(
          `Cannot find action by ID "${id}". There might be a bug in the MenuView component. Please report this to the developer.`,
          { showAlert: true },
        );
        return;
      }

      action.onPress?.();
    },
    [actions, logger],
  );

  const { showActionSheet } = useActionSheet();

  if (disabled) return restProps.children || null;

  if (Platform.OS === 'android') {
    // @react-native-menu/menu will not work on Android randomly. Fall back to ActionSheet.
    // See: https://github.com/react-native-menu/menu/issues/539
    const handleOpenActionSheetForMenuActions = (
      menuActions: ReadonlyArray<MenuAction>,
    ) => {
      showActionSheet(
        menuActions
          .flatMap(a => (a.type === 'section' ? a.children : [a]))
          .filter((a): a is NonNullable<typeof a> => !!a)
          .map(a => ({
            name: !a.state
              ? (a.title as any)
              : `${(() => {
                  switch (a.state) {
                    case 'on':
                      return '☑';
                    case 'off':
                      return '☐';
                    case 'mixed':
                      return '☒';
                  }
                })()} ${a.title}`,
            destructive: a.destructive,
            onSelect: a.children
              ? () => handleOpenActionSheetForMenuActions(a.children || [])
              : a.onPress || (() => {}),
          })),
      );
    };
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          !disabled && handleOpenActionSheetForMenuActions(actions)
        }
        {...restProps}
      />
    );
  }

  return (
    <RNMenuView
      title={title}
      actions={processedActions}
      onPressAction={handlePressAction}
      {...restProps}
    />
  );
}
