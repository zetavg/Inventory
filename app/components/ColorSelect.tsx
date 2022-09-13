import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import useColors from '@app/hooks/useColors';

export type ColorSelectColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'gray';

type Props = {
  value?: ColorSelectColor;
  onChange: (color: ColorSelectColor) => void;
};

export default function ColorSelect({ value, onChange }: Props) {
  const {
    red,
    orange,
    yellow,
    green,
    teal,
    blue,
    indigo,
    purple,
    pink,
    gray,
    iosTintColor,
  } = useColors();

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => onChange('red')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'red' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: red,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('orange')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'orange' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: orange,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('yellow')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'yellow' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: yellow,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('green')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'green' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: green,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('teal')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'teal' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: teal,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('blue')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'blue' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: blue,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('indigo')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'indigo' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: indigo,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={() => onChange('purple')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'purple' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: purple,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
      {/*<TouchableWithoutFeedback onPress={() => onChange('pink')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'pink' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: pink,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>*/}
      <TouchableWithoutFeedback onPress={() => onChange('gray')}>
        <View
          style={[
            styles.colorItemContainer,
            value === 'gray' && { borderColor: iosTintColor },
          ]}
        >
          <View
            style={[
              styles.colorItem,
              {
                backgroundColor: gray,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorItemContainer: {
    width: 32,
    height: 32,
    borderRadius: 128,
    borderColor: 'transparent',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItem: {
    width: 20,
    height: 20,
    borderRadius: 128,
  },
});
