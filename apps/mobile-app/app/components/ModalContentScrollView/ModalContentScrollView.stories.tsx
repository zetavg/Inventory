/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { Alert } from 'react-native';

import ModalContentScrollView from './ModalContentScrollView';

export default {
  title: '[L] ModalContentScrollView',
  component: ModalContentScrollView,
  // args: {
  // },
  // parameters: {
  //   notes: '...',
  // },
};

export const Basic = ({
  ...args
}: React.ComponentProps<typeof ModalContentScrollView>) => {
  return (
    <ModalContentScrollView {...args}>
      {new Array(10).fill(null).map((_, i) => (
        <View key={i} style={{ padding: 8, gap: 8 }}>
          <TextInput placeholder="Sample Text Input" />
          <Button
            title="Sample Button"
            onPress={() => Alert.alert('Button Pressed')}
          />
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </Text>
        </View>
      ))}
    </ModalContentScrollView>
  );
};

// function WithRefComponent(
//   args: React.ComponentProps<typeof ModalContentScrollView>,
// ) {
//   const scrollViewRef = React.useRef<ScrollView>(null);

//   return (
//     <ModalContentScrollView {...args} ref={scrollViewRef}>
//       {new Array(10).fill(null).map((_, i) => (
//         <View key={i} style={{ padding: 8, gap: 8 }}>
//           <TextInput
//             placeholder={`Sample Text Input ${i}`}
//             onFocus={
//               i === 0 ? ModalContentScrollView.stf(scrollViewRef) : undefined
//             }
//           />
//           <Button
//             title="Sample Button"
//             onPress={() => Alert.alert('Button Pressed')}
//           />
//           <Button
//             title="Scroll To End"
//             onPress={() => scrollViewRef.current?.scrollToEnd()}
//           />
//           <Text>
//             Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//             eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
//             ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//             aliquip ex ea commodo consequat. Duis aute irure dolor in
//             reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//             pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//             culpa qui officia deserunt mollit anim id est laborum.
//           </Text>
//         </View>
//       ))}
//     </ModalContentScrollView>
//   );
// }

// export const WithRef = ({
//   ...args
// }: React.ComponentProps<typeof ModalContentScrollView>) => {
//   return <WithRefComponent {...args} />;
// };

// function WithRefStComponent(
//   args: React.ComponentProps<typeof ModalContentScrollView>,
// ) {
//   const scrollViewRef = React.useRef<ScrollView>(null);

//   const textInputRef1 = React.useRef<TextInput>(null);

//   return (
//     <ModalContentScrollView {...args} ref={scrollViewRef}>
//       <View style={{ padding: 8, gap: 8 }}>
//         <TextInput
//           placeholder="Text Input with ModalContentScrollView.stf"
//           onFocus={ModalContentScrollView.stf(scrollViewRef)}
//         />
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//       <View style={{ padding: 8, gap: 8 }}>
//         <TextInput
//           placeholder="Text Input with ModalContentScrollView.stf 100"
//           onFocus={ModalContentScrollView.stf(scrollViewRef, 100)}
//         />
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//       <View style={{ padding: 8, gap: 8 }}>
//         <TextInput
//           placeholder="Text Input with ModalContentScrollView.strf"
//           ref={textInputRef1}
//           onFocus={ModalContentScrollView.strf(scrollViewRef, textInputRef1)}
//         />
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//       <View style={{ padding: 8, gap: 8 }}>
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//       <View style={{ padding: 8, gap: 8 }}>
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//       <View style={{ padding: 8, gap: 8 }}>
//         <Text>
//           Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
//           eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
//           minim veniam, quis nostrud exercitation ullamco laboris nisi ut
//           aliquip ex ea commodo consequat. Duis aute irure dolor in
//           reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
//           pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
//           culpa qui officia deserunt mollit anim id est laborum.
//         </Text>
//       </View>
//     </ModalContentScrollView>
//   );
// }

// export const WithRefSt = ({
//   ...args
// }: React.ComponentProps<typeof ModalContentScrollView>) => {
//   return <WithRefStComponent {...args} />;
// };
