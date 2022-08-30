import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { ShadowBox } from 'react-native-neomorph-shadows';

import useColors from '@app/hooks/useColors';
import Color from 'color';

// import { Chip } from 'react-native-paper';
// import cs from '@app/utils/commonStyles';
// import Text from '@app/components/Text';
// import Button from '@app/components/Button';

// import { action } from '@storybook/addon-actions';

import NeomorphBox from './NeomorphBox';

export default {
  title: 'NeomorphShadow',
  // component: NeomorphShadow,
  parameters: {
    notes: 'NeomorphShadow',
  },
};

const ShadowControl = () => {
  const { contentBackgroundColor } = useColors();
  const [color, setColor] = useState(0);
  const colorStr = `rgb(${color}, ${color}, ${color})`;
  const [opacity, setOpacity] = useState(0.5);
  const [borderRadius, setBorderRadius] = useState(20);
  const [shadowRadius, setShadowRadius] = useState(10);
  // const colorStr = `rgb(${colorRed}, ${colorGreen}, ${colorBlue})`;

  return (
    <View style={styles.main}>
      <View style={{ height: 32 }} />
      <ShadowBox
        // inner
        useSvg
        style={{
          ...styles.shadowStyle,
          borderRadius: borderRadius,
          shadowColor: colorStr,
          shadowOpacity: opacity,
          shadowRadius: shadowRadius,
          backgroundColor: contentBackgroundColor,
        }}
      >
        <Text style={styles.textShadow}>SHADOW</Text>
      </ShadowBox>
      <View style={{ height: 32 }} />
      <View style={{ width: 300 }}>
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Color:</Text>
          <Text style={styles.blockValueText2}>{colorStr}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={255}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setColor(val)}
          value={color}
          step={1}
        />
        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Opacity:</Text>
          <Text style={styles.blockValueText2}>
            {Math.round(opacity * 100) / 100}
          </Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={1}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setOpacity(val)}
          value={opacity}
          step={0.01}
        />
        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Border radius:</Text>
          <Text style={styles.blockValueText2}>{Math.round(borderRadius)}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={200}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setBorderRadius(val)}
          value={borderRadius}
          step={1}
        />
        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Shadow radius:</Text>
          <Text style={styles.blockValueText2}>{Math.round(shadowRadius)}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={50}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setShadowRadius(val)}
          value={shadowRadius}
        />
      </View>
    </View>
  );
};

export const Shadow = () => (
  <ScrollView>
    <ShadowControl />
  </ScrollView>
);

const NeomorphControl = () => {
  const { contentBackgroundColor } = useColors();
  const [color, setColor] = useState(128);
  const colorStr = `rgb(${color}, ${color}, ${color})`;
  const [invert, setInvert] = useState(false);
  const [borderRadius, setBorderRadius] = useState(20);
  const [opacity, setOpacity] = useState(0.24);
  const [shadowRadius, setShadowRadius] = useState(8);
  const [innerOpacity, setInnerOpacity] = useState(0.2);
  const [innerShadowRadius, setInnerShadowRadius] = useState(10);
  // const colorStr = `rgb(${colorRed}, ${colorGreen}, ${colorBlue})`;

  return (
    <View style={[styles.main, { backgroundColor: colorStr }]}>
      <View style={{ height: 32 }} />
      <NeomorphBox
        shadowOpacity={opacity}
        shadowRadius={shadowRadius}
        innerShadowOpacity={innerOpacity}
        innerShadowRadius={innerShadowRadius}
        invert={invert}
        style={{
          backgroundColor: colorStr,
          borderRadius,
          ...styles.shadowStyle,
        }}
      >
        <Text style={styles.textShadow}>SHADOW</Text>
      </NeomorphBox>
      <View style={{ height: 32 }} />
      <View style={{ width: 300 }}>
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Invert:</Text>
          <Text style={styles.blockValueText2}>
            <Switch value={invert} onChange={() => setInvert(v => !v)} />
          </Text>
        </View>

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Environment Color:</Text>
          <Text style={styles.blockValueText2}>{colorStr}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={255}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setColor(val)}
          value={color}
          step={1}
        />

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Border radius:</Text>
          <Text style={styles.blockValueText2}>{Math.round(borderRadius)}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={200}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setBorderRadius(val)}
          value={borderRadius}
          step={1}
        />

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Shadow opacity:</Text>
          <Text style={styles.blockValueText2}>
            {Math.round(opacity * 100) / 100}
          </Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={1}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setOpacity(val)}
          value={opacity}
          step={0.01}
        />

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Shadow radius:</Text>
          <Text style={styles.blockValueText2}>{Math.round(shadowRadius)}</Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={50}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setShadowRadius(val)}
          value={shadowRadius}
        />

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Inner shadow opacity:</Text>
          <Text style={styles.blockValueText2}>
            {Math.round(innerOpacity * 100) / 100}
          </Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={1}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setInnerOpacity(val)}
          value={innerOpacity}
          step={0.01}
        />

        <View style={{ height: 16 }} />
        <View style={styles.blockValue}>
          <Text style={styles.blockValueText}>Inner shadow radius:</Text>
          <Text style={styles.blockValueText2}>
            {Math.round(innerShadowRadius)}
          </Text>
        </View>
        <Slider
          minimumTrackTintColor="black"
          maximumValue={50}
          minimumValue={0}
          style={{ width: '100%' }}
          onValueChange={val => setInnerShadowRadius(val)}
          value={innerShadowRadius}
        />
      </View>
    </View>
  );
};

export const Neomorph = () => (
  <ScrollView>
    <NeomorphControl />
    {/*<NeomorphBox useSvg darkShadowColor="black" lightShadowColor="white" style={{ width: 100, height: 100, shadowOpacity: 1, shadowRadius: 10 }} />*/}
  </ScrollView>
);

const styles = StyleSheet.create({
  main: {
    width: Dimensions.get('window').width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  textShadow: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  blockValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockValueText: {
    fontSize: 14,
  },
  blockValueText2: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'left',
  },
  shadowStyle: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
  },
});
