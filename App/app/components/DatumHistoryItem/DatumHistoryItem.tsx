import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DataHistory, DataTypeName } from '@deps/data/types';

import { getHumanName, useData } from '@app/data';

import useColors from '@app/hooks/useColors';

import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

function DatumHistoryItem({
  history,
  ...restProps
}: { history: DataHistory<DataTypeName> } & React.ComponentProps<
  typeof UIGroup.ListItem
>) {
  const { data } = useData(history.data_type, history.data_id);
  const dataName = useMemo(() => {
    if (typeof data?.name === 'string') {
      return data?.name;
    }

    if (typeof history.original_data?.name === 'string') {
      return history.original_data?.name;
    }

    if (typeof history.new_data?.name === 'string') {
      return history.new_data?.name;
    }
  }, [data?.name, history]);

  const type = useMemo(() => {
    if (history.original_data.__deleted && !history.new_data.__deleted) {
      return 'CREATED';
    }
    if (!history.original_data.__deleted && history.new_data.__deleted) {
      return 'DELETED';
    }

    return 'UPDATED';
  }, [history.new_data.__deleted, history.original_data.__deleted]);

  const { backgroundColor, contentSecondaryTextColor, contentTextColor } =
    useColors();

  return (
    <UIGroup.ListItem {...restProps}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.dataTypeText,
              { backgroundColor, color: contentSecondaryTextColor },
            ]}
          >
            {getHumanName(history.data_type)}
          </Text>
          {!!dataName && (
            <Text style={[styles.dataNameText, { color: contentTextColor }]}>
              {dataName}
            </Text>
          )}
          <Text
            style={[
              styles.typeText,
              { backgroundColor, color: contentSecondaryTextColor },
            ]}
          >
            {type}
          </Text>
        </View>
        {type === 'UPDATED' && (
          <View style={styles.updateDetailsContainer}>
            {Array.from(
              new Set([
                ...Object.keys(history.original_data),
                ...Object.keys(history.new_data),
              ]),
            )
              .filter(k => !k.match(/password/))
              .map(k => (
                <View style={styles.updateDetailItemContainer} key={k}>
                  <Text>
                    <Text
                      style={[
                        styles.updatedKeyText,
                        { color: contentSecondaryTextColor },
                      ]}
                      selectable
                    >
                      {getHumanName(k, { titleCase: true })}
                    </Text>
                    <Text> </Text>
                    <Text
                      style={[
                        styles.updatedValueText,
                        { color: contentTextColor },
                      ]}
                      selectable
                    >
                      {`${history.original_data[k]} → ${history.new_data[k]}`}
                    </Text>
                  </Text>
                </View>
              ))}
          </View>
        )}
      </View>
    </UIGroup.ListItem>
  );
}

export default DatumHistoryItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dataTypeText: {
    textTransform: 'uppercase',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 16,
  },
  dataNameText: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 16,
    fontWeight: '500',
  },
  typeText: {
    textTransform: 'uppercase',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 14,
  },
  updateDetailsContainer: {
    marginTop: 2,
  },
  updateDetailItemContainer: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 4,
  },
  updatedKeyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  updatedValueText: {
    fontSize: 16,
  },
});
