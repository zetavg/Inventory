import React from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from 'react-native-paper';
import cs from '@app/utils/commonStyles';
import Text from '@app/components/Text';
import Button from '@app/components/Button';

import { action } from '@storybook/addon-actions';

import InsetGroup from './InsetGroup';

export default {
  title: 'InsetGroup',
  component: InsetGroup,
  parameters: {
    notes: 'InsetGroup',
  },
  args: {
    children: 'Hello world',
    variant: undefined,
  },
  argTypes: {
    variant: {
      options: [
        undefined,
        'displayLarge',
        'displayMedium',
        'displaySmall',
        'headlineLarge',
        'headlineMedium',
        'headlineSmall',
        'titleLarge',
        'titleMedium',
        'titleSmall',
        'labelLarge',
        'labelMedium',
        'labelSmall',
        'bodyLarge',
        'bodyMedium',
        'bodySmall',
      ],
      control: { type: 'select' },
    },
  },
};

export const Basic = (args: React.ComponentProps<typeof InsetGroup>) => (
  <ScrollView>
    <InsetGroup.Container>
      <InsetGroup
        style={{
          height: 44 * 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>Hello, I'm a InsetGroup!</Text>
      </InsetGroup>
      <InsetGroup
        style={{
          height: 44 * 4,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>I'm another InsetGroup!</Text>
      </InsetGroup>
      <InsetGroup
        label="This is the label"
        style={{
          height: 44 * 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>I'm a InsetGroup with label!</Text>
      </InsetGroup>
      <InsetGroup
        label="Large label"
        labelVariant="large"
        style={{
          height: 44 * 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>I'm a InsetGroup with large label!</Text>
      </InsetGroup>
      <InsetGroup
        label="Large label with labelRight"
        labelVariant="large"
        labelRight={<Button title="A Button" mode="contained" />}
        footerLabel="And this is a footer. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat."
        style={{
          height: 44 * 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>I'm a InsetGroup with large label</Text>
        <Text>and a button on labelRight!</Text>
      </InsetGroup>
    </InsetGroup.Container>
  </ScrollView>
);

export const WithItem = (args: React.ComponentProps<typeof InsetGroup>) => (
  <ScrollView
    keyboardDismissMode="interactive"
    keyboardShouldPersistTaps="handled"
  >
    <InsetGroup.Container>
      <InsetGroup>
        <InsetGroup.Item label="Name" detail="iPhone" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Software Version" detail="15.5" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Model Name" detail="iPhone 12 mini" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </InsetGroup>

      <InsetGroup>
        <InsetGroup.Item label="Hello World" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Hello Worlddddddddddddddddddddddddddddd" />
      </InsetGroup>

      <InsetGroup>
        <InsetGroup.Item
          leftElement={
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                backgroundColor: '#eee',
              }}
            />
          }
          label="With Left Element"
        />
        <InsetGroup.ItemSeparator leftInset={60} />
        <InsetGroup.Item
          vertical
          leftElement={
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                backgroundColor: '#eee',
              }}
            />
          }
          label="Hi"
          detail="The seperator has leftInset set to 60"
        />
      </InsetGroup>

      <InsetGroup>
        <InsetGroup.Item arrow label="Arrow" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          arrow
          label="Arrow with onPress"
          onPress={action('press')}
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item selected label="Selected" />
      </InsetGroup>
      <InsetGroup>
        <InsetGroup.Item button label="Button" onPress={action('press')} />
      </InsetGroup>
      <InsetGroup>
        <InsetGroup.Item
          button
          destructive
          label="Distructive Button"
          onPress={action('press')}
        />
      </InsetGroup>
      <InsetGroup>
        <InsetGroup.Item
          button
          disabled
          label="Disabled Button"
          onPress={action('press')}
        />
      </InsetGroup>
      <InsetGroup label="Compact Label">
        <InsetGroup.Item compactLabel label="Name" detail="iPhone" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item compactLabel label="Software Version" detail="15.5" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Model Name"
          detail="iPhone 12 mini"
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </InsetGroup>
      <InsetGroup label="Compact Label with Inputs">
        <InsetGroup.Item
          compactLabel
          label="Name"
          detail={
            <InsetGroup.TextInput
              alignRight
              placeholder="iPhone"
              returnKeyType="done"
              autoCapitalize="words"
            />
          }
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Quantity"
          detail={
            <>
              <InsetGroup.TextInput
                alignRight
                placeholder="0"
                keyboardType="number-pad"
              />
              <InsetGroup.ItemAffix>Units</InsetGroup.ItemAffix>
            </>
          }
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Disabled"
          detail={
            <InsetGroup.TextInput
              alignRight
              disabled
              value="Input value"
              returnKeyType="done"
              autoCapitalize="words"
            />
          }
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          compactLabel
          label="Tags"
          detail={
            <InsetGroup.ItemDetailButton
              label="Add"
              onPress={action('press')}
            />
          }
        >
          <>
            <Chip compact style={cs.mr8}>
              Tag 1
            </Chip>
            <Chip compact style={cs.mr8}>
              Tag 2
            </Chip>
            <Chip compact style={cs.mr8}>
              Tag 3
            </Chip>
            <Chip compact style={cs.mr8}>
              Tag 4
            </Chip>
          </>
        </InsetGroup.Item>
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item compactLabel label="Notes">
          <InsetGroup.TextInput
            multiline
            style={{ minHeight: 60 }}
            placeholder="Enter notes"
          />
        </InsetGroup.Item>
      </InsetGroup>
      <InsetGroup label="Vertical">
        <InsetGroup.Item vertical label="Name" detail="iPhone" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item vertical label="Software Version" detail="15.5" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical
          arrow
          label="Model Name"
          detail="iPhone 12 mini"
          onPress={action('press')}
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </InsetGroup>
      <InsetGroup label="Vertical 2">
        <InsetGroup.Item vertical2 label="Name" detail="iPhone" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item vertical2 label="Software Version" detail="15.5" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical2
          arrow
          label="Model Name"
          detail="iPhone 12 mini"
          onPress={action('press')}
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical2
          label="Model Number"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item
          vertical2
          label="Serial Numberrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          detail="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        />
      </InsetGroup>
      <InsetGroup label="This is label">
        <InsetGroup.Item label="Hello World" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Hello World" />
      </InsetGroup>
      <InsetGroup label="This is large label" labelVariant="large">
        <InsetGroup.Item label="Hello World" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Hello World" />
      </InsetGroup>
      <InsetGroup
        label="This is large label with labelRight"
        labelVariant="large"
        labelRight={
          <InsetGroup.LabelButton title="A Button" onPress={() => {}} />
        }
        footerLabel="And this is a footer. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat."
      >
        <InsetGroup.Item label="Hello World" />
        <InsetGroup.ItemSeparator />
        <InsetGroup.Item label="Hello World" />
      </InsetGroup>
    </InsetGroup.Container>
  </ScrollView>
);
