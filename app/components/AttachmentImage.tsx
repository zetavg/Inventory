import React, { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import ImageView from 'react-native-image-viewing';

type Props = {
  doc: unknown;
  aspectRatio?: number;
  viewable?: boolean;
  containerStyle?: React.ComponentProps<typeof TouchableOpacity>['style'];
} & Omit<React.ComponentProps<typeof ImageBackground>, 'source'>;

const BLANK_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAQSURBVHgBAQUA+v8AAAAAAAAFAAFkeJU4AAAAAElFTkSuQmCC';

function AttachmentImage({
  doc,
  aspectRatio: aspectRatioFromProp,
  viewable,
  style,
  containerStyle,
  onLayout,
  ...props
}: Props) {
  const [width, setWidth] = useState(0);
  const lastWidth = useRef(width);

  const handleLayout = useCallback<
    Exclude<React.ComponentProps<typeof ImageBackground>['onLayout'], undefined>
  >(
    event => {
      const { width: w } = event.nativeEvent.layout;
      if (w !== lastWidth.current) {
        setWidth(w);
        lastWidth.current = w;
      }

      if (typeof onLayout === 'function') onLayout(event);
    },
    [onLayout],
  );

  const imageSourceUri = (() => {
    if (!doc) return BLANK_IMAGE;
    if (typeof doc !== 'object') return BLANK_IMAGE;

    const { content_type, data } = doc as { [k: string]: unknown };
    if (typeof content_type !== 'string' || typeof data !== 'string')
      return BLANK_IMAGE;

    return `data:${content_type};base64,${data}`;
  })();

  const aspectRatio =
    aspectRatioFromProp ||
    (() => {
      if (!doc) return 1;
      if (typeof doc !== 'object') return 1;

      const { dimensions } = doc as { [k: string]: unknown };
      if (!dimensions) return 1;
      if (typeof dimensions !== 'object') return 1;

      const { width: w, height: h } = dimensions as { [k: string]: unknown };
      if (typeof w !== 'number') return 1;
      if (typeof h !== 'number') return 1;

      return w / h;
    })();

  const heightStyle = useMemo(() => {
    return { height: width / aspectRatio };
  }, [aspectRatio, width]);

  const imageViewImages = useMemo(() => {
    if (!viewable) return [];

    if (imageSourceUri === BLANK_IMAGE) return [];

    return [{ uri: imageSourceUri }];
  }, [imageSourceUri, viewable]);

  const [imageViewVisiable, setImageViewVisiable] = useState(false);
  const openImageView = useCallback(() => setImageViewVisiable(true), []);
  const closeImageView = useCallback(() => setImageViewVisiable(false), []);

  const element = (
    <>
      <ImageBackground
        source={imageSourceUri ? { uri: imageSourceUri } : { uri: BLANK_IMAGE }}
        resizeMode="cover"
        {...props}
        style={[
          styles.imageBackground,
          heightStyle,
          ...(Array.isArray(style) ? style : [style]),
        ]}
        onLayout={handleLayout}
      />
      {viewable && (
        <ImageView
          images={imageViewImages}
          imageIndex={0}
          visible={imageViewVisiable}
          onRequestClose={closeImageView}
        />
      )}
    </>
  );

  if (!viewable || imageSourceUri === BLANK_IMAGE) return element;

  return (
    <TouchableOpacity
      onPress={openImageView}
      style={[
        styles.container,
        ...(Array.isArray(containerStyle) ? containerStyle : [containerStyle]),
      ]}
    >
      {element}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    backgroundColor: '#8E8E93',
    width: '100%',
  },
  container: {
    width: '100%',
  },
});

export default AttachmentImage;
