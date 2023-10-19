import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import UIText from '@app/components/Text';

import Icon, { IconName } from '../Icon';

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

      <UIGroup header="Large Title With" largeTitle headerRight="headerRight" />

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

      <UIGroup header="Component as Detail">
        <UIGroup.ListItem
          label={`With Switch (${switchValue ? 'On' : 'Off'})`}
          detail={
            <UIGroup.ListItem.Switch
              value={switchValue}
              onChange={() => setSwitchValue(v => !v)}
            />
          }
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          label="Using renderer function"
          // eslint-disable-next-line react/no-unstable-nested-components
          detail={({ textProps }) => (
            <TouchableWithoutFeedback onPress={() => Alert.alert('Touched!')}>
              <View>
                <Text {...textProps}>Touch me!</Text>
              </View>
            </TouchableWithoutFeedback>
          )}
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

      <UIGroup header="Vertical Arranged Normal Label iOS">
        <UIGroup.ListItem
          verticalArrangedNormalLabelIOS
          label="Name"
          detail="iPhone"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedNormalLabelIOS
          label="Software Version"
          detail="15.5"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedNormalLabelIOS
          label="Model Name"
          detail="iPhone 12 mini"
          navigable
          onPress={() => Alert.alert('Model Name', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedNormalLabelIOS
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedNormalLabelIOS
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </UIGroup>

      <UIGroup header="Vertical Arranged Large Text iOS">
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Name"
          detail="iPhone"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Software Version"
          detail="15.5"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Model Name"
          detail="iPhone 12 mini"
          navigable
          onPress={() => Alert.alert('Model Name', 'Pressed.')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="With Right Element"
          detail="An Icon as Right Element"
          // eslint-disable-next-line react/no-unstable-nested-components
          rightElement={({ iconProps }) => (
            <Icon name="cube-outline" color="grey" {...iconProps} />
          )}
        />
      </UIGroup>

      <UIGroup header="Monospace Detail">
        <UIGroup.ListItem monospaceDetail label="Name" detail="iPhone" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          monospaceDetail
          verticalArrangedIOS
          label="Software Version"
          detail="15.5"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          monospaceDetail
          verticalArrangedNormalLabelIOS
          label="Model Name"
          detail="iPhone 12 mini"
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          monospaceDetail
          verticalArrangedLargeTextIOS
          label="Model Number"
          detail="ABCD1234"
        />
      </UIGroup>

      <UIGroup header="With Icon">
        <UIGroup.ListItem label="Food" icon="food" />
        <UIGroup.ListItemSeparator forItemWithIcon />
        <UIGroup.ListItem label="Drink" icon="wineglass" />
        <UIGroup.ListItemSeparator forItemWithIcon />
        <UIGroup.ListItem label="With Color" icon="cup" iconColor="blue" />
        <UIGroup.ListItemSeparator forItemWithIcon />
        <UIGroup.ListItem
          label="Coffee"
          icon="coffee"
          iconColor="brown"
          detail="With Detail"
        />
        <UIGroup.ListItemSeparator forItemWithIcon />
        <UIGroup.ListItem
          label="Beer"
          icon="beer"
          iconColor="yellow"
          detail="With Detail (verticalArrangedNormalLabelIOS)"
          verticalArrangedNormalLabelIOS
        />
      </UIGroup>

      <UIGroup header="Text Input">
        <UIGroup.ListTextInputItem placeholder="Username" />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem placeholder="Password" secureTextEntry />
      </UIGroup>

      <UIGroup header="Text Input with Button">
        <UIGroup.ListTextInputItem
          placeholder="Placeholder"
          controlElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => Alert.alert('List Text Input Button', 'Pressed.')}
            >
              Select
            </UIGroup.ListTextInputItem.Button>
          }
        />
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
          label="With Pressable Unit"
          placeholder="0"
          keyboardType="number-pad"
          unit="USD"
          onUnitPress={() => Alert.alert('Unit Pressed')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="With Button"
          placeholder="Placeholder"
          controlElement={
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
          controlElement={
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
          label="With Right Element"
          placeholder="Placeholder"
          // eslint-disable-next-line react/no-unstable-nested-components
          rightElement={({ iconProps }) => (
            <TouchableOpacity onPress={() => Alert.alert('Pressed')}>
              <Icon {...iconProps} name="cube-outline" color="grey" />
            </TouchableOpacity>
          )}
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
          label="With Pressable Unit"
          placeholder="0"
          keyboardType="number-pad"
          unit="USD"
          onUnitPress={() => Alert.alert('Unit Pressed')}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="With Button"
          placeholder="Placeholder"
          controlElement={
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
          controlElement={
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
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Switch"
          inputElement={<UIGroup.ListItem.Switch value={true} />}
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          horizontalLabel
          label="Date Picker"
          inputElement={
            <UIGroup.ListItem.DatePicker value={{ y: 2023, m: 1, d: 1 }} />
          }
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
          controlElement={
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
        <UIGroup.ListItemSeparator />
        <UIGroup.ListTextInputItem
          label="Horizontal Label With Custom Input"
          horizontalLabel
          inputElement={
            <TouchableOpacity
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ flexDirection: 'row', flexWrap: 'wrap' }}
              onPress={() => Alert.alert('Pressed')}
            >
              {'A Custom Element. A Custom Element. A Custom Element.'
                .split('')
                .map((c, i) => (
                  <UIText key={i}>{c}</UIText>
                ))}
            </TouchableOpacity>
          }
        />
      </UIGroup>

      <UIGroup header="Adjusts Detail Font Size To Fit">
        <UIGroup.ListItem
          label="Serial Number"
          detail="XXXX-XXXX-XXXX-XXXX-XXXX"
          adjustsDetailFontSizeToFit
        />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem
          label="Serial Number"
          detail="XXXX-XXXX"
          adjustsDetailFontSizeToFit
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

const SECTION_VIEW_DATA = [
  {
    title: 'Main dishes',
    data: ['Pizza', 'Burger', 'Risotto'],
  },
  {
    title: 'Sides',
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
  },
  {
    title: 'Drinks',
    data: ['Water', 'Coke', 'Beer'],
  },
  {
    title: 'Cats',
    data: ['null'],
  },
  {
    title: 'Desserts',
    data: ['Cheese Cake', 'Ice Cream'],
  },
];

export function WithListItemsInListView() {
  return (
    <SectionList
      stickySectionHeadersEnabled={false}
      initialNumToRender={32}
      // eslint-disable-next-line react/no-unstable-nested-components
      ListHeaderComponent={() => <UIGroup.FirstGroupSpacing />}
      sections={SECTION_VIEW_DATA}
      keyExtractor={(item, index) => (item || 'null') + index}
      renderSectionHeader={({ section: { title } }) => (
        <UIGroup asSectionHeader header={title} />
      )}
      renderItem={({ item, index, section }) => (
        <UIGroup.ListItem.RenderItemContainer
          isFirst={index === 0}
          isLast={index === section.data.length - 1}
        >
          {item !== 'null' ? (
            <UIGroup.ListItem label={item} />
          ) : (
            <UIGroup placeholder="No Items" asPlaceholderContent />
          )}
        </UIGroup.ListItem.RenderItemContainer>
      )}
      SectionSeparatorComponent={UIGroup.SectionSeparatorComponent}
      ItemSeparatorComponent={UIGroup.ListItem.ItemSeparatorComponent}
    />
  );
}

const SECTION_VIEW_WITH_ICON_DATA: ReadonlyArray<{
  title: string;
  data: ReadonlyArray<{ label: string; icon: IconName }>;
}> = [
  {
    title: 'Food',
    data: [
      { label: 'Carrot', icon: 'carrot' },
      { label: 'Bread', icon: 'bread' },
      { label: 'Cookie', icon: 'cookie' },
      { label: 'Cupcake', icon: 'cupcake' },
      { label: 'Apple', icon: 'apple' },
    ],
  },
  {
    title: 'Drink',
    data: [
      { label: 'Coffee', icon: 'coffee' },
      { label: 'Beer', icon: 'beer' },
      { label: 'Wine', icon: 'wineglass' },
      { label: 'Martini', icon: 'martini-glass' },
    ],
  },
  {
    title: 'Furniture',
    data: [
      { label: 'Table', icon: 'table' },
      { label: 'Chair', icon: 'chair' },
      { label: 'Lounge', icon: 'lounge' },
      { label: 'Bed', icon: 'bed' },
    ],
  },
  {
    title: 'Devices',
    data: [
      { label: 'Cellphone', icon: 'cellphone' },
      { label: 'Tablet', icon: 'tablet' },
      { label: 'Laptop Computer', icon: 'laptop-computer' },
      { label: 'Desktop Computer', icon: 'desktop-computer' },
      { label: 'Monitor', icon: 'monitor' },
      { label: 'Headphones', icon: 'headphones' },
    ],
  },
];

export function WithListItemsWithIconInListView() {
  return (
    <SectionList
      stickySectionHeadersEnabled={false}
      initialNumToRender={32}
      // eslint-disable-next-line react/no-unstable-nested-components
      ListHeaderComponent={() => <UIGroup.FirstGroupSpacing />}
      sections={SECTION_VIEW_WITH_ICON_DATA}
      keyExtractor={(item, index) => item.label + index}
      renderSectionHeader={({ section: { title } }) => (
        <UIGroup asSectionHeader header={title} />
      )}
      renderItem={({ item, index, section }) => (
        <UIGroup.ListItem.RenderItemContainer
          isFirst={index === 0}
          isLast={index === section.data.length - 1}
        >
          <UIGroup.ListItem label={item.label} icon={item.icon} />
        </UIGroup.ListItem.RenderItemContainer>
      )}
      SectionSeparatorComponent={UIGroup.SectionSeparatorComponent}
      ItemSeparatorComponent={
        UIGroup.ListItem.ItemSeparatorComponent.ForItemWithIcon
      }
    />
  );
}
