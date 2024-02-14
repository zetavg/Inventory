import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import useDebouncedValue from '@app/hooks/useDebouncedValue';

import { MenuAction } from '@app/components/Menu';
import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const SAMPLE_MENU_ACTIONS: ReadonlyArray<MenuAction> = [
  {
    title: 'Add',
    sfSymbolName: 'plus',
    children: [
      {
        title: 'Take Picture from Camera',
        sfSymbolName: 'camera',
        onPress: () => Alert.alert('"Take Picture from Camera" pressed'),
      },
      {
        title: 'Select from Photo Library',
        sfSymbolName: 'photo.on.rectangle',
        onPress: () => Alert.alert('"Select from Photo Library" pressed'),
      },
      {
        title: 'Select from Files',
        sfSymbolName: 'folder',
        onPress: () => Alert.alert('"Select from Files" pressed'),
      },
    ],
  },
  {
    title: 'Options',
    sfSymbolName: 'slider.horizontal.3',
    children: [
      {
        title: 'On State',
        state: 'on',
        onPress: () => Alert.alert('"On State" pressed'),
      },
      {
        title: 'Off State',
        state: 'off',
        onPress: () => Alert.alert('"Off State" pressed'),
      },
      {
        title: 'Mixed State',
        state: 'mixed',
        onPress: () => Alert.alert('"Mixed State" pressed'),
      },
    ],
  },
  {
    title: 'Share',
    sfSymbolName: 'square.and.arrow.up',
    onPress: () => Alert.alert('"Share" pressed'),
  },
  {
    title: 'Destructive',
    destructive: true,
    sfSymbolName: 'trash',
    onPress: () => Alert.alert('"Destructive" pressed'),
  },
];

function SampleScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Sample'>) {
  const showAppbar =
    typeof route.params?.showAppbar === 'boolean'
      ? route.params?.showAppbar
      : true;
  const showSearch =
    typeof route.params?.showSearch === 'boolean'
      ? route.params?.showSearch
      : false;
  // const autoFocusSearch =
  //   typeof route.params?.autoFocusSearch === 'boolean'
  //     ? route.params?.autoFocusSearch
  //     : false;

  const [title, setTitle] = useState('Sample Screen');
  const [headerLargeTitle, setHeaderLargeTitle] = useState(true);
  const [searchText, setSearchText] = useState('');

  const [action1Label, setAction1Label] = useState('Action 1');
  const [action1SFSymbolName, setAction1SFSymbolName] =
    useState('square.and.pencil');
  const [action1MaterialIconName, setAction1MaterialIconName] =
    useState('pencil');
  const debouncedAction1SFSymbolName = useDebouncedValue(
    action1SFSymbolName,
    1000,
  );
  const debouncedAction1MaterialIconName = useDebouncedValue(
    action1MaterialIconName,
    1000,
  );
  const [action1UseMenu, setAction1UseMenu] = useState(false);

  const [action2Label, setAction2Label] = useState('Action 2');
  const [action2SFSymbolName, setAction2SFSymbolName] = useState('trash');
  const [action2MaterialIconName, setAction2MaterialIconName] =
    useState('delete');
  const debouncedAction2SFSymbolName = useDebouncedValue(
    action2SFSymbolName,
    2000,
  );
  const debouncedAction2MaterialIconName = useDebouncedValue(
    action2MaterialIconName,
    1000,
  );
  const [action2UseMenu, setAction2UseMenu] = useState(false);

  const [action3Label, setAction3Label] = useState('Action 3');
  const [action3SFSymbolName, setAction3SFSymbolName] = useState('gearshape');
  const [action3MaterialIconName, setAction3MaterialIconName] = useState('cog');
  const debouncedAction3SFSymbolName = useDebouncedValue(
    action3SFSymbolName,
    3000,
  );
  const debouncedAction3MaterialIconName = useDebouncedValue(
    action3MaterialIconName,
    1000,
  );
  const [action3UseMenu, setAction3UseMenu] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      showAppBar={showAppbar}
      title={title || 'Title'}
      headerLargeTitle={headerLargeTitle}
      showSearch={showSearch}
      // autoFocusSearch={autoFocusSearch}
      onSearchChangeText={t => setSearchText(t)}
      action1Label={action1Label}
      action1SFSymbolName={debouncedAction1SFSymbolName}
      action1MaterialIconName={debouncedAction1MaterialIconName}
      onAction1Press={
        !action1UseMenu ? () => Alert.alert('Action 1 Pressed') : undefined
      }
      action1MenuActions={action1UseMenu ? SAMPLE_MENU_ACTIONS : undefined}
      action2Label={action2Label}
      action2SFSymbolName={debouncedAction2SFSymbolName}
      action2MaterialIconName={debouncedAction2MaterialIconName}
      onAction2Press={
        !action2UseMenu ? () => Alert.alert('Action 2 Pressed') : undefined
      }
      action2MenuActions={action2UseMenu ? SAMPLE_MENU_ACTIONS : undefined}
      action3Label={action3Label}
      action3SFSymbolName={debouncedAction3SFSymbolName}
      action3MaterialIconName={debouncedAction3MaterialIconName}
      onAction3Press={
        !action3UseMenu ? () => Alert.alert('Action 3 Pressed') : undefined
      }
      action3MenuActions={action3UseMenu ? SAMPLE_MENU_ACTIONS : undefined}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle={headerLargeTitle} />
        <UIGroup>
          <UIGroup.ListItem
            label="Show AppBar"
            detail={
              <UIGroup.ListItem.Switch
                value={showAppbar}
                onValueChange={() =>
                  navigation.push('Sample', {
                    showAppbar: !showAppbar,
                    showSearch,
                    // autoFocusSearch,
                  })
                }
              />
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Title"
            horizontalLabel
            placeholder="Title"
            returnKeyType="done"
            autoCapitalize="words"
            value={title}
            onChangeText={t => setTitle(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Header Large Title"
            detail={
              <UIGroup.ListItem.Switch
                value={headerLargeTitle}
                onValueChange={v => setHeaderLargeTitle(v)}
              />
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Show Search"
            detail={
              <UIGroup.ListItem.Switch
                value={showSearch}
                onValueChange={() =>
                  navigation.push('Sample', {
                    showAppbar,
                    showSearch: !showSearch,
                    // autoFocusSearch,
                  })
                }
              />
            }
          />
          {showSearch && (
            <>
              {/*<UIGroup.ListItemSeparator />
              <UIGroup.ListItem
                label="Auto Focus Search"
                detail={
                  <Switch
                    value={autoFocusSearch}
                    onValueChange={() =>
                      navigation.push('Sample', {
                        showAppbar,
                        showSearch,
                        autoFocusSearch: !autoFocusSearch,
                      })
                    }
                  />
                }
              />*/}
              <UIGroup.ListItemSeparator />
              <UIGroup.ListItem
                label="Search Text"
                detail={searchText || '(None)'}
              />
            </>
          )}
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Go Back"
            button
            onPress={() => navigation.goBack()}
          />
        </UIGroup>

        <UIGroup header="Action 1">
          <UIGroup.ListTextInputItem
            label="Label"
            horizontalLabel
            clearButtonMode="always"
            placeholder="Label"
            returnKeyType="done"
            autoCapitalize="words"
            value={action1Label}
            onChangeText={t => setAction1Label(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="SF Symbol"
            horizontalLabel
            clearButtonMode="always"
            placeholder="square.and.pencil"
            returnKeyType="done"
            autoCapitalize="none"
            value={action1SFSymbolName}
            onChangeText={t => setAction1SFSymbolName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Material Icon"
            horizontalLabel
            clearButtonMode="always"
            placeholder="pencil"
            returnKeyType="done"
            autoCapitalize="none"
            value={action1MaterialIconName}
            onChangeText={t => setAction1MaterialIconName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Use Menu"
            horizontalLabel
            inputElement={
              <UIGroup.ListItem.Switch
                value={action1UseMenu}
                onValueChange={v => setAction1UseMenu(v)}
              />
            }
          />
        </UIGroup>

        <UIGroup header="Action 2">
          <UIGroup.ListTextInputItem
            label="Label"
            horizontalLabel
            clearButtonMode="always"
            placeholder="Label"
            returnKeyType="done"
            autoCapitalize="words"
            value={action2Label}
            onChangeText={t => setAction2Label(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="SF Symbol"
            horizontalLabel
            clearButtonMode="always"
            placeholder="trash"
            returnKeyType="done"
            autoCapitalize="none"
            value={action2SFSymbolName}
            onChangeText={t => setAction2SFSymbolName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Material Icon"
            horizontalLabel
            clearButtonMode="always"
            placeholder="delete"
            returnKeyType="done"
            autoCapitalize="none"
            value={action2MaterialIconName}
            onChangeText={t => setAction2MaterialIconName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Use Menu"
            horizontalLabel
            inputElement={
              <UIGroup.ListItem.Switch
                value={action2UseMenu}
                onValueChange={v => setAction2UseMenu(v)}
              />
            }
          />
        </UIGroup>

        <UIGroup header="Action 3">
          <UIGroup.ListTextInputItem
            label="Label"
            horizontalLabel
            clearButtonMode="always"
            placeholder="Label"
            returnKeyType="done"
            autoCapitalize="words"
            value={action3Label}
            onChangeText={t => setAction3Label(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="SF Symbol"
            horizontalLabel
            clearButtonMode="always"
            placeholder="gearshape"
            returnKeyType="done"
            autoCapitalize="none"
            value={action3SFSymbolName}
            onChangeText={t => setAction3SFSymbolName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Material Icon"
            horizontalLabel
            clearButtonMode="always"
            placeholder="cog"
            returnKeyType="done"
            autoCapitalize="none"
            value={action3MaterialIconName}
            onChangeText={t => setAction3MaterialIconName(t)}
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Use Menu"
            horizontalLabel
            inputElement={
              <UIGroup.ListItem.Switch
                value={action3UseMenu}
                onValueChange={v => setAction3UseMenu(v)}
              />
            }
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default SampleScreen;
