import React, { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import useDebouncedValue from '@app/hooks/useDebouncedValue';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

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
      onAction1Press={() => Alert.alert('Action 1 Pressed')}
      action2Label={action2Label}
      action2SFSymbolName={debouncedAction2SFSymbolName}
      action2MaterialIconName={debouncedAction2MaterialIconName}
      onAction2Press={() => Alert.alert('Action 2 Pressed')}
      action3Label={action3Label}
      action3SFSymbolName={debouncedAction3SFSymbolName}
      action3MaterialIconName={debouncedAction3MaterialIconName}
      onAction3Press={() => Alert.alert('Action 3 Pressed')}
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
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default SampleScreen;
