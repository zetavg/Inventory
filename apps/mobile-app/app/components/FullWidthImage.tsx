import React, { useState } from 'react';
import { Image } from 'react-native';

export default function FullWidthImage(
  props: React.ComponentProps<typeof Image>,
) {
  // Initially set the width to 100%
  const [viewDimensions, setViewDimensions] = useState<{
    width?: number | string;
    height?: number | string;
  }>({
    width: '100%',
    height: undefined,
  });

  const [imageDimensions, setImageDimensions] = useState<{
    width?: number;
    height?: number;
  }>(() => {
    if (typeof props.source === 'number') {
      // handle case where the source is an asset in which case onLoad won't get triggered
      const { width, height } = Image.resolveAssetSource(props.source);
      return { width, height };
    } else if (
      !!props.source &&
      typeof props.source === 'object' &&
      !Array.isArray(props.source) &&
      typeof props.source.width === 'number' &&
      typeof props.source.height === 'number'
    ) {
      return {
        width: props.source.width,
        height: props.source.height,
      };
    } else {
      return {
        width: undefined,
        height: undefined,
      };
    }
  });
  return (
    <Image
      onLayout={e => {
        // this is triggered when the "view" layout is provided
        if (imageDimensions.width && imageDimensions.height) {
          setViewDimensions({
            width: e.nativeEvent.layout.width,
            height:
              (e.nativeEvent.layout.width * imageDimensions.height) /
              imageDimensions.width,
          });
        }
      }}
      onLoad={e => {
        // this is triggered when the image is loaded and we have actual dimensions.
        // But only if loading via URI
        setImageDimensions({
          width: e.nativeEvent.source.width,
          height: e.nativeEvent.source.height,
        });
      }}
      {...props}
      style={[
        props.style,
        {
          width: viewDimensions.width,
          height: viewDimensions.height,
        },
      ]}
    />
  );
}
