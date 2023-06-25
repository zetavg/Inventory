import React, { useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
} from 'react-native';

import UIText from '@app/components/Text';

import Icon from '../Icon';

import UIGroup from './UIGroup';

export function Basic() {
  const uiGroupStyles = UIGroup.useStyles();

  return (
    <ScrollView
      style={uiGroupStyles.container}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <UIGroup.FirstGroupSpacing />

      <UIGroup
        header="With Placeholder"
        placeholder="This is the placeholder for an empty group."
      />

      <UIGroup header="With Footer" footer="This is footer." />

      <UIGroup header="Loading" loading />

      <UIGroup header="Large Title" largeTitle />

      <UIGroup
        header="Large Title With"
        largeTitle
        headerRight={
          <UIGroup.TitleButton
            primary
            onPress={() => Alert.alert('Title Button', 'Pressed.')}
          >
            A Button
          </UIGroup.TitleButton>
        }
      />

      <UIGroup
        header="Title Buttons"
        largeTitle
        headerRight={
          <>
            <UIGroup.TitleButton
              onPress={() => Alert.alert('Title Button 2', 'Pressed.')}
            >
              {({ iconProps }) => <Icon {...iconProps} name="app-reorder" />}
            </UIGroup.TitleButton>
            <UIGroup.TitleButton
              primary
              onPress={() => Alert.alert('Title Button 1', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="add" />
                  <Text {...textProps}>Add</Text>
                </>
              )}
            </UIGroup.TitleButton>
          </>
        }
      />

      <UIGroup
        header="More Title Buttons"
        largeTitle
        headerRight={
          <>
            <UIGroup.TitleButton
              onPress={() => Alert.alert('Title Button 2', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="app-reorder" />
                  <Text {...textProps}>Re-order</Text>
                </>
              )}
            </UIGroup.TitleButton>
            <UIGroup.TitleButton
              primary
              onPress={() => Alert.alert('Title Button 1', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="add" />
                </>
              )}
            </UIGroup.TitleButton>
          </>
        }
      />

      <UIGroup
        header="Large Title with Footer"
        largeTitle
        footer="This is footer. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
      />
    </ScrollView>
  );
}

export function WithListItems() {
  const [switchValue, setSwitchValue] = useState(true);
  const uiGroupStyles = UIGroup.useStyles();

  return (
    <ScrollView
      style={uiGroupStyles.container}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <UIGroup.FirstGroupSpacing />
      <UIGroup>
        <UIGroup.ListItem label="Name" detail="iPhone" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Software Version" detail="15.5" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Model Name" detail="iPhone 12 mini" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </UIGroup>

      <UIGroup>
        <UIGroup.ListItem label="Hello World" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Hello Worlddddddddddddddddddddddddddddd" />
      </UIGroup>

      <UIGroup header="Interactable">
        <UIGroup.ListItem navigable label="Navigable" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          navigable
          label="Navigable with onPress"
          onPress={() => Alert.alert('Navigable with onPress', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          selected
          label="Selected"
          onPress={() => Alert.alert('Selected', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          button
          label="Button"
          onPress={() => Alert.alert('List Item Button', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          button
          destructive
          label="Destructive Button"
          onPress={() => Alert.alert('Destructive Button', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          button
          disabled
          label="Disabled Button"
          onPress={() => Alert.alert('Disabled Button', 'Pressed.')}
        />
      </UIGroup>

      <UIGroup header="Detail Component">
        <UIGroup.ListItem
          label={`With Switch (${switchValue ? 'On' : 'Off'})`}
          detail={
            <UIGroup.ListItem.Switch
              value={switchValue}
              onChange={() => setSwitchValue(v => !v)}
            />
          }
        />
      </UIGroup>

      <UIGroup header="Vertical Arranged iOS">
        <UIGroup.ListItem verticalArrangedIOS label="Name" detail="iPhone" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedIOS
          label="Software Version"
          detail="15.5"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedIOS
          label="Model Name"
          detail="iPhone 12 mini"
          navigable
          onPress={() => Alert.alert('Model Name', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedIOS
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedIOS
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </UIGroup>

      <UIGroup header="Text Input">
        <UIGroup.ListTextInputItem placeholder="Username" horizontalLabel />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem placeholder="Password" secureTextEntry />
      </UIGroup>

      <UIGroup header="Text Input with Label">
        <UIGroup.ListTextInputItem label="Label" placeholder="Placeholder" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Value"
          placeholder="Placeholder"
          value="Input value."
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Disabled"
          disabled
          value="Disabled Input Value"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Readonly"
          readonly
          value="Readonly Input Value"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Unit"
          placeholder="0"
          keyboardType="number-pad"
          unit="Units"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Button"
          placeholder="Placeholder"
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              Select
            </UIGroup.ListTextInputItem.Button>
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Icon on Button"
          placeholder="Placeholder"
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="add" />
                  <Text {...textProps}>Add</Text>
                </>
              )}
            </UIGroup.ListTextInputItem.Button>
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Monospaced"
          monospaced
          placeholder="Monospaced"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Monospaced (small)"
          monospaced
          small
          placeholder="Monospaced (small)"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Multiline"
          multiline
          placeholder="Multiline input."
        />
      </UIGroup>

      <UIGroup header="Custom Input Element">
        <UIGroup.ListTextInputItem
          label="With Custom Input Element"
          inputElement={
            <TouchableOpacity
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ flexDirection: 'row', flexWrap: 'wrap' }}
              onPress={() => Alert.alert('Pressed')}
            >
              {'A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element.'
                .split('')
                .map((c, i) => (
                  <UIText key={i}>{c}</UIText>
                ))}
            </TouchableOpacity>
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Custom Input Element And Button"
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="add" />
                  <Text {...textProps}>Add</Text>
                </>
              )}
            </UIGroup.ListTextInputItem.Button>
          }
          inputElement={
            <TouchableOpacity
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ flexDirection: 'row', flexWrap: 'wrap' }}
              onPress={() => Alert.alert('Pressed')}
            >
              {'A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element. A Custom Element.'
                .split('')
                .map((c, i) => (
                  <UIText key={i}>{c}</UIText>
                ))}
            </TouchableOpacity>
          }
        />
      </UIGroup>

      <UIGroup header="Text Input with Horizontal Label">
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Label"
          placeholder="Placeholder"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="With Value"
          placeholder="Placeholder"
          value="Input value."
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Disabled"
          disabled
          value="Disabled Input Value"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Readonly"
          readonly
          value="Readonly Input Value"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="With Unit"
          placeholder="0"
          keyboardType="number-pad"
          unit="Units"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="With Button"
          placeholder="Placeholder"
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              Select
            </UIGroup.ListTextInputItem.Button>
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="With Icon on Button"
          placeholder="Placeholder"
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              {({ iconProps, textProps }) => (
                <>
                  <Icon {...iconProps} name="add" />
                  <Text {...textProps}>Add</Text>
                </>
              )}
            </UIGroup.ListTextInputItem.Button>
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Monospaced"
          monospaced
          placeholder="Monospaced"
        />
      </UIGroup>

      <UIGroup header="Loading" loading>
        <UIGroup.ListItem label="Hello World" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Loading..." />
      </UIGroup>

      <UIGroup
        header="With Footer"
        footer="This is footer. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
      >
        <UIGroup.ListItem label="Hello World" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Hi" />
      </UIGroup>
    </ScrollView>
  );
}
