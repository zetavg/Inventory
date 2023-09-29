import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import useColors from '@app/hooks/useColors';

import FullWidthImage from '@app/components/FullWidthImage';
import UIGroup from '@app/components/UIGroup';

import { labelPreviewPlaceholder } from '@app/images';

import { PrinterConfigT } from '../types';

type Props = {
  printerConfig: PrinterConfigT;
  options: Record<string, any>;
  label: Record<string, any>;
  header?: string;
  loading?: boolean;
};

function PrintingPreview({
  printerConfig,
  options,
  label,
  header,
  loading,
}: Props): JSX.Element | null {
  const { gray } = useColors();
  const [previewSource, previewSourceError] = useMemo(() => {
    if (!printerConfig.getPreview) return [null, null] as const;

    try {
      const ps = printerConfig.getPreview({
        printerConfig,
        options,
        label,
      });

      if (!ps) {
        throw new Error('getPreview should return a object.');
      }

      if (typeof ps !== 'object') {
        throw new Error(`getPreview should return a object, got ${typeof ps}`);
      }

      if (typeof (ps as any).uri !== 'string') {
        throw new Error(
          `getPreview should return a object with uri as string, got ${typeof (
            ps as any
          ).uri}`,
        );
      }

      if (typeof (ps as any).width !== 'number') {
        throw new Error(
          `getPreview should return a object with width as number, got ${typeof (
            ps as any
          ).width}`,
        );
      }

      if (typeof (ps as any).height !== 'number') {
        throw new Error(
          `getPreview should return a object with height as number, got ${typeof (
            ps as any
          ).height}`,
        );
      }

      return [ps, null] as const;
    } catch (e) {
      return [null, e instanceof Error ? e.message : 'unknown error'] as const;
    }
  }, [label, options, printerConfig]);

  const [error, setError] = useState<null | string>(null);
  useEffect(() => {
    setError(null);
  }, [previewSource]);

  return (
    <UIGroup
      placeholder={previewSourceError || error || undefined}
      style={styles.container}
      header={header}
      loading={loading}
    >
      {!!previewSource && !error && (
        <FullWidthImage
          key={JSON.stringify(previewSource)}
          style={[styles.image, { backgroundColor: gray, borderColor: gray }]}
          source={previewSource}
          defaultSource={labelPreviewPlaceholder}
          onError={() =>
            setError(
              `Failed to load image from "${(previewSource as any)?.uri}".`,
            )
          }
        />
      )}
    </UIGroup>
  );
}

export default PrintingPreview;

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  image: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
});
