import React, { useState, useCallback, useMemo } from 'react';
import {
  Image,
  TouchableOpacity,
  ImageURISource,
  ImageRequireSource,
} from 'react-native';
import ImageView from 'react-native-image-viewing';

type Props = {
  source: ImageURISource | ImageRequireSource;
  containerStyle?: React.ComponentProps<typeof TouchableOpacity>['style'];
} & Omit<React.ComponentProps<typeof Image>, 'source'>;

function ViewableImage({ containerStyle, source, ...props }: Props) {
  const imageViewImages = useMemo(() => {
    return [source];
  }, [source]);

  const [imageViewVisible, setImageViewVisible] = useState(false);
  const openImageView = useCallback(() => setImageViewVisible(true), []);
  const closeImageView = useCallback(() => setImageViewVisible(false), []);

  return (
    <>
      <TouchableOpacity onPress={openImageView} style={containerStyle}>
        <Image source={source} {...props} />
      </TouchableOpacity>
      <ImageView
        images={imageViewImages}
        imageIndex={0}
        visible={imageViewVisible}
        onRequestClose={closeImageView}
      />
    </>
  );
}

export default ViewableImage;
