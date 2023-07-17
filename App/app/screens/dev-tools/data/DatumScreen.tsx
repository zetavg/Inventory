import React, { useCallback, useRef } from 'react';
import { Alert, RefreshControl, ScrollView, Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import {
  DataTypeName,
  DataTypeWithAdditionalInfo,
  getHumanTypeName,
  getPropertyNames,
  getPropertyType,
  toTitleCase,
  useData,
  useRelated,
  useSave,
} from '@app/data';
import {
  DataRelationName,
  DataTypeWithRelationDefsName,
  relation_definitions,
} from '@app/data/relations';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DatumScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Datum'>) {
  const logger = useLogger('DatumScreen');
  const rootNavigation = useRootNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { type, id, preloadedTitle } = route.params;

  const { loading, data, rawData, refresh, refreshing } = useData(type, id);

  const save = useSave();
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are sure you want to DELETE the ${type.replace(/_/g, ' ')} "${
        data?.name
      }" (${id})?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await save({
                __type: type,
                __id: id,
                __deleted: true,
              });
              navigation.goBack();
            } catch (e) {
              logger.error(e, { showAlert: true });
            }
          },
        },
      ],
    );
  }, [data?.name, id, logger, navigation, save, type]);

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={
        (typeof data?.name === 'string' && data?.name) ||
        preloadedTitle ||
        getHumanTypeName(type, { titleCase: true, plural: false })
      }
      action1Label="Edit"
      action1SFSymbolName="square.and.pencil"
      action1MaterialIconName="pencil"
      onAction1Press={() =>
        rootNavigation?.navigate('SaveData', {
          id,
          type,
        })
      }
      action2Label="Delete"
      action2SFSymbolName="trash"
      action2MaterialIconName="delete"
      onAction2Press={handleDelete}
    >
      <ScreenContent.ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <UIGroup.FirstGroupSpacing iosLargeTitle />

        {!!data && (
          <UIGroup>
            <UIGroup.ListItem
              label="Type"
              detail={data.__type}
              verticalArrangedLargeTextIOS
            />
            <UIGroup.ListItemSeparator />
            <UIGroup.ListItem
              label="ID"
              adjustsDetailFontSizeToFit
              // eslint-disable-next-line react/no-unstable-nested-components
              detail={({ textProps }) => (
                <Text
                  {...textProps}
                  style={[textProps.style, commonStyles.monospaced]}
                >
                  {data.__id}
                </Text>
              )}
              verticalArrangedLargeTextIOS
            />
          </UIGroup>
        )}

        <UIGroup
          loading={loading}
          placeholder={
            loading
              ? undefined
              : `Can't load ${getHumanTypeName(type, {
                  titleCase: false,
                  plural: false,
                })} with ID "${id}".`
          }
        >
          {!!data &&
            UIGroup.ListItemSeparator.insertBetween(
              getPropertyNames(type).map((propertyName: any) => {
                const [propertyType] = getPropertyType(type, propertyName);
                const humanPropertyName = toTitleCase(
                  propertyName.replace(/_/g, ' '),
                );
                const value: unknown = data[propertyName];
                switch (propertyType) {
                  case 'boolean': {
                    return (
                      <UIGroup.ListItem
                        key={propertyName}
                        label={humanPropertyName}
                        detail={
                          typeof value === 'undefined'
                            ? '(undefined)'
                            : typeof value !== 'boolean'
                            ? `(invalid type: ${typeof value})`
                            : value
                            ? 'true'
                            : 'false'
                        }
                        verticalArrangedLargeTextIOS
                      />
                    );
                  }
                  case 'string':
                  default: {
                    return (
                      <UIGroup.ListItem
                        key={propertyName}
                        label={humanPropertyName}
                        detail={
                          typeof value === 'undefined'
                            ? '(undefined)'
                            : typeof value !== 'string'
                            ? `(invalid type: ${typeof value})`
                            : value
                        }
                        verticalArrangedLargeTextIOS
                      />
                    );
                  }
                }
              }),
            )}
        </UIGroup>

        {!!data &&
          !!(relation_definitions as any)[type] &&
          !!(relation_definitions as any)[type].belongs_to && (
            <UIGroup header="Belongs To">
              {UIGroup.ListItemSeparator.insertBetween(
                Object.keys((relation_definitions as any)[type].belongs_to).map(
                  k => (
                    <BelongsToItem
                      key={k}
                      {...({
                        data,
                        relationName: k,
                      } as any)}
                      onPress={payload => navigation.push('Datum', payload)}
                    />
                  ),
                ),
              )}
            </UIGroup>
          )}

        {!!data &&
          !!(relation_definitions as any)[type] &&
          !!(relation_definitions as any)[type].has_many &&
          Object.keys((relation_definitions as any)[type].has_many).map(k => (
            <HasManyGroup
              key={k}
              {...({
                data,
                relationName: k,
              } as any)}
              onPress={payload => navigation.push('Datum', payload)}
              onAddPress={payload => rootNavigation?.push('SaveData', payload)}
            />
          ))}

        {!!data && (
          <UIGroup>
            <UIGroup.ListItem
              verticalArrangedLargeTextIOS
              label="Created At"
              detail={
                typeof data.__created_at === 'number'
                  ? data.__created_at
                  : '(unknown)'
              }
            />
            <UIGroup.ListItemSeparator />
            <UIGroup.ListItem
              verticalArrangedLargeTextIOS
              label="Updated At"
              detail={
                typeof data.__updated_at === 'number'
                  ? data.__updated_at
                  : '(unknown)'
              }
            />
          </UIGroup>
        )}

        {!!data && (
          <UIGroup header="Advanced">
            <UIGroup.ListTextInputItem
              label="Data JSON"
              monospaced
              multiline
              small
              showSoftInputOnFocus={false}
              value={JSON.stringify(data, null, 2)}
            />
            {/*
            <UIGroup.ListItemSeparator />
            <UIGroup.ListTextInputItem
              label="Data JSON (Spread)"
              monospaced
              multiline
              small
              showSoftInputOnFocus={false}
              value={JSON.stringify({ ...data }, null, 2)}
            />
            */}
            <UIGroup.ListItemSeparator />
            <UIGroup.ListTextInputItem
              label="Raw"
              monospaced
              multiline
              small
              showSoftInputOnFocus={false}
              value={JSON.stringify(data.__raw, null, 2)}
            />
            {!!data.__errors && (
              <>
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Errors"
                  monospaced
                  multiline
                  small
                  showSoftInputOnFocus={false}
                  value={JSON.stringify(data.__errors, null, 2)}
                />
              </>
            )}
            {!!data.__error_details && (
              <>
                <UIGroup.ListItemSeparator />
                <UIGroup.ListTextInputItem
                  label="Errors"
                  monospaced
                  multiline
                  small
                  showSoftInputOnFocus={false}
                  value={JSON.stringify(data.__error_details, null, 2)}
                />
              </>
            )}
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

function BelongsToItem<T extends DataTypeWithRelationDefsName>({
  data,
  relationName,
  onPress,
}: {
  data: DataTypeWithAdditionalInfo<T>;
  relationName: DataRelationName<T>;
  onPress: (payload: { type: DataTypeName; id: string }) => void;
}): JSX.Element {
  const { loading, data: d } = useRelated(data, relationName);
  return (
    <UIGroup.ListItem
      verticalArrangedLargeTextIOS
      label={toTitleCase(String(relationName).replace(/_/g, ' '))}
      detail={
        loading
          ? 'Loading...'
          : Array.isArray(d)
          ? 'Invalid'
          : typeof d?.name === 'string'
          ? d?.name
          : d?.__id || '-'
      }
      navigable={!!d && !Array.isArray(d)}
      onPress={
        d && !Array.isArray(d)
          ? () => {
              onPress({ type: d.__type, id: d.__id || '' });
            }
          : undefined
      }
    />
  );
}

function HasManyGroup<T extends DataTypeWithRelationDefsName>({
  data,
  relationName,
  onPress,
  onAddPress,
}: {
  data: DataTypeWithAdditionalInfo<T>;
  relationName: DataRelationName<T>;
  onPress: (payload: { type: DataTypeName; id: string }) => void;
  onAddPress: (payload: { type: DataTypeName; initialData: any }) => void;
}): JSX.Element {
  const {
    loading,
    data: d,
    relatedTypeName,
    foreignKey,
  } = useRelated(data, relationName);
  return (
    <UIGroup
      header={toTitleCase(String(relationName).replace(/_/g, ' '))}
      loading={loading}
    >
      {UIGroup.ListItemSeparator.insertBetween([
        ...(Array.isArray(d)
          ? d.map(dd => (
              <UIGroup.ListItem
                key={dd.__id}
                label={typeof dd?.name === 'string' ? dd?.name : '-'}
                detail={`ID: ${dd.__id}`}
                verticalArrangedIOS
                navigable
                onPress={() => onPress({ type: dd.__type, id: dd.__id || '' })}
              />
            ))
          : []),
        ...(relatedTypeName
          ? [
              <UIGroup.ListItem
                key="__add"
                button
                label={`Add ${relatedTypeName.replace(/_/g, ' ')}...`}
                onPress={() =>
                  onAddPress({
                    type: relatedTypeName,
                    initialData: { [foreignKey || '']: data.__id },
                  })
                }
              />,
            ]
          : []),
      ])}
    </UIGroup>
  );
}

export default DatumScreen;
