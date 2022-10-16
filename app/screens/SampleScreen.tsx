import React, { useRef, useState } from 'react';
import { ScrollView, Alert } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Switch from '@app/components/Switch';
import commonStyles from '@app/utils/commonStyles';
import useDebouncedValue from '@app/hooks/useDebouncedValue';

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
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      showAppBar={showAppbar}
      title={title || 'Title'}
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
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item
            label="Show AppBar"
            detail={
              <Switch
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
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Title"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Title"
                returnKeyType="done"
                autoCapitalize="words"
                value={title}
                onChangeText={t => setTitle(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Show Search"
            detail={
              <Switch
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
              {/*<InsetGroup.ItemSeparator />
              <InsetGroup.Item
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
              <InsetGroup.ItemSeparator />
              <InsetGroup.Item
                label="Search Text"
                detail={searchText || '(None)'}
              />
            </>
          )}
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="Go Back"
            button
            onPress={() => navigation.goBack()}
          />
        </InsetGroup>

        <InsetGroup label="Action 1">
          <InsetGroup.Item
            label="Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Label"
                returnKeyType="done"
                autoCapitalize="words"
                value={action1Label}
                onChangeText={t => setAction1Label(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="SF Symbol"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="square.and.pencil"
                returnKeyType="done"
                autoCapitalize="none"
                value={action1SFSymbolName}
                onChangeText={t => setAction1SFSymbolName(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Material Icon"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="pencil"
                returnKeyType="done"
                autoCapitalize="none"
                value={action1MaterialIconName}
                onChangeText={t => setAction1MaterialIconName(t)}
              />
            }
          />
        </InsetGroup>

        <InsetGroup label="Action 2">
          <InsetGroup.Item
            label="Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Label"
                returnKeyType="done"
                autoCapitalize="words"
                value={action2Label}
                onChangeText={t => setAction2Label(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="SF Symbol"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="trash"
                returnKeyType="done"
                autoCapitalize="none"
                value={action2SFSymbolName}
                onChangeText={t => setAction2SFSymbolName(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Material Icon"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="delete"
                returnKeyType="done"
                autoCapitalize="none"
                value={action2MaterialIconName}
                onChangeText={t => setAction2MaterialIconName(t)}
              />
            }
          />
        </InsetGroup>

        <InsetGroup label="Action 3">
          <InsetGroup.Item
            label="Label"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="Label"
                returnKeyType="done"
                autoCapitalize="words"
                value={action3Label}
                onChangeText={t => setAction3Label(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="SF Symbol"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="gearshape"
                returnKeyType="done"
                autoCapitalize="none"
                value={action3SFSymbolName}
                onChangeText={t => setAction3SFSymbolName(t)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item
            label="Material Icon"
            detail={
              <InsetGroup.TextInput
                alignRight
                placeholder="cog"
                returnKeyType="done"
                autoCapitalize="none"
                value={action3MaterialIconName}
                onChangeText={t => setAction3MaterialIconName(t)}
              />
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default SampleScreen;
