import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { ZodError } from 'zod';

import EPCUtils from '@deps/epc-utils';

import {
  verifyIconColor,
  verifyIconColorWithDefault,
  verifyIconName,
  verifyIconNameWithDefault,
} from '@app/consts/icons';

import {
  DataTypeWithAdditionalInfo,
  useConfig,
  useData,
  useRelated,
  useSave,
} from '@app/data';

import commonStyles from '@app/utils/commonStyles';
import randomInt from '@app/utils/randomInt';
import {
  applyWhitespaceFix,
  removeWhitespaceFix,
} from '@app/utils/text-input-whitespace-fix';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useAutoFocus from '@app/hooks/useAutoFocus';
import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';
import useDeepCompare from '@app/hooks/useDeepCompare';
import useLogger from '@app/hooks/useLogger';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ColorSelect, { ColorSelectColor } from '@app/components/ColorSelect';
import Icon, { IconColor, IconName } from '@app/components/Icon';
import ModalContent from '@app/components/ModalContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import IconColorSelectInput from '../components/IconColorSelectInput';
import IconInputUIGroup from '../components/IconInputUIGroup';
import IconSelectInput from '../components/IconSelectInput';

function SaveCollectionScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveCollection'>) {
  const { initialData: initialDataFromParams, afterDelete } = route.params;

  const logger = useLogger('SaveCollectionScreen');

  const { save, saving } = useSave();
  const { config } = useConfig();
  const collectionReferenceDigits = useMemo(
    () =>
      config
        ? EPCUtils.getCollectionReferenceDigits({
            companyPrefix: config.rfid_tag_company_prefix,
            iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
          })
        : null,
    [config],
  );

  const initialData = useMemo<
    Partial<DataTypeWithAdditionalInfo<'collection'>>
  >(
    () => ({
      __type: 'collection',
      icon_name: 'box',
      icon_color: 'gray',
      item_default_icon_name: 'cube-outline',
      ...initialDataFromParams,
    }),
    [initialDataFromParams],
  );
  const [data, setData] =
    useState<Partial<DataTypeWithAdditionalInfo<'collection'>>>(initialData);
  const hasChanges = !useDeepCompare(initialData, data);
  const isFromSharedDb = !config
    ? null
    : typeof data.config_uuid === 'string' && data.config_uuid !== config.uuid;
  const { data: someItems } = useData(
    'item',
    { collection_id: initialData.__id },
    { limit: 1, disable: !initialData.__id },
  );
  const hasItems = (someItems?.length || 0) > 0;

  const [
    referenceNumberIsRandomlyGenerated,
    setReferenceNumberIsRandomlyGenerated,
  ] = useState(false);
  const randomGenerateReferenceNumber = useCallback(() => {
    if (!collectionReferenceDigits) return;

    const number = randomInt(
      0,
      parseInt('9'.repeat(collectionReferenceDigits), 10),
    );
    setData(d => ({
      ...d,
      collection_reference_number: number
        .toString()
        .padStart(collectionReferenceDigits, '0'),
    }));
    setReferenceNumberIsRandomlyGenerated(true);
  }, [collectionReferenceDigits]);

  const handleOpenSelectIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: verifyIconName(data.icon_name),
        callback: icon_name => {
          setData(d => ({ ...d, icon_name }));
        },
      }),
    [data.icon_name, navigation],
  );

  const handleOpenSelectItemDefaultIcon = useCallback(
    () =>
      navigation.navigate('SelectIcon', {
        defaultValue: verifyIconName(data.item_default_icon_name),
        callback: item_default_icon_name => {
          setData(d => ({ ...d, item_default_icon_name }));
        },
      }),
    [data.item_default_icon_name, navigation],
  );

  // const handleOpenSelectDefaultItemIcon = useCallback(
  //   () =>
  //     navigation.navigate('SelectIcon', {
  //       defaultValue: verifyIconName(data.item_default_icon_name),
  //       callback: item_default_icon_name => {
  //         setData(d => ({ ...d, item_default_icon_name }));
  //       },
  //     }),
  //   [data.item_default_icon_name, navigation],
  // );

  const isDone = useRef(false);
  const handleSave = useCallback(async () => {
    try {
      await save(data);
      isDone.current = true;
      navigation.goBack();
    } catch (_e) {}
  }, [data, navigation, save]);

  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isDone.current) {
        confirm();
        return;
      }

      if (saving) return;

      Alert.alert(
        'Discard changes?',
        'The collection is not saved yet. Are you sure to discard the changes and leave?',
        [
          { text: "Don't leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: confirm,
          },
        ],
      );
    },
    [saving],
  );

  const doDelete = useCallback(async () => {
    try {
      await save(
        {
          ...initialData,
          __type: initialData.__type,
          __id: initialData.__id,
          __deleted: true,
        },
        { showErrorAlert: false },
      );
      navigation.goBack();
      if (typeof afterDelete === 'function') {
        afterDelete();
      }
    } catch (e) {
      if (e instanceof ZodError) {
        Alert.alert(
          'Cannot delete item',
          e.issues.map(i => i.message).join('\n'),
        );
      } else {
        logger.error(e, { showAlert: true });
      }
    }
  }, [afterDelete, initialData, logger, navigation, save]);
  const handleDeleteButtonPressed = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete the collection "${initialData.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ],
    );
  }, [doDelete, initialData.name]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ModalContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);
  const nameInputRef = useRef<TextInput>(null);
  const refNumberInputRef = useRef<TextInput>(null);
  useAutoFocus(nameInputRef, {
    scrollViewRef,
    disable: !!data.name,
  });

  return (
    <ModalContent
      navigation={navigation}
      preventClose={hasChanges}
      confirmCloseFn={handleLeave}
      title={`${initialData.__id ? 'Edit' : 'New'} Collection`}
      action1Label="Save"
      action1MaterialIconName="check"
      action1Variant="strong"
      onAction1Press={saving ? undefined : handleSave}
      action2Label="Cancel"
      onAction2Press={saving ? undefined : () => navigation.goBack()}
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListTextInputItem
            ref={nameInputRef}
            label="Name"
            placeholder="Enter Name"
            autoCapitalize="words"
            value={data.name}
            returnKeyType={!data.collection_reference_number ? 'next' : 'done'}
            onChangeText={text => {
              setData(d => ({
                ...d,
                name: text,
              }));
            }}
            // eslint-disable-next-line react/no-unstable-nested-components
            rightElement={({ iconProps }) => (
              <TouchableOpacity onPress={handleOpenSelectIcon}>
                <Icon
                  name={verifyIconNameWithDefault(data.icon_name)}
                  color={verifyIconColorWithDefault(data.icon_color)}
                  {...iconProps}
                />
              </TouchableOpacity>
            )}
            onSubmitEditing={
              !data.collection_reference_number
                ? () => refNumberInputRef?.current?.focus()
                : undefined
            }
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            ref={refNumberInputRef}
            label="Reference Number"
            disabled={isFromSharedDb === null || isFromSharedDb}
            horizontalLabel
            keyboardType="number-pad"
            monospaced
            readonly={!collectionReferenceDigits}
            placeholder={'0'.repeat(collectionReferenceDigits || 3)}
            maxLength={collectionReferenceDigits || 3}
            returnKeyType="done"
            clearButtonMode={
              referenceNumberIsRandomlyGenerated ? undefined : 'while-editing'
            }
            selectTextOnFocus={referenceNumberIsRandomlyGenerated}
            value={data.collection_reference_number}
            onChangeText={t => {
              setData(d => ({
                ...d,
                collection_reference_number: t,
              }));
              setReferenceNumberIsRandomlyGenerated(false);
            }}
            controlElement={
              (!data.collection_reference_number ||
                referenceNumberIsRandomlyGenerated) && (
                <UIGroup.ListTextInputItem.Button
                  onPress={randomGenerateReferenceNumber}
                >
                  Generate
                </UIGroup.ListTextInputItem.Button>
              )
            }
            {...kiaTextInputProps}
          />
        </UIGroup>

        <IconInputUIGroup
          navigation={navigation}
          iconName={data.icon_name}
          iconColor={data.icon_color}
          onChangeIconName={n => {
            setData(d => ({
              ...d,
              icon_name: n,
            }));
          }}
          onChangeIconColor={c => {
            setData(d => ({
              ...d,
              icon_color: c,
            }));
          }}
        />

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Default Icon for Items"
            inputElement={
              <IconSelectInput
                iconName={verifyIconName(data.item_default_icon_name)}
                iconColor="grey"
                onPress={handleOpenSelectItemDefaultIcon}
              />
            }
            controlElement={
              <UIGroup.ListTextInputItem.Button
                onPress={handleOpenSelectItemDefaultIcon}
              >
                Select
              </UIGroup.ListTextInputItem.Button>
            }
          />
        </UIGroup>

        {!!initialData.__id && (
          <UIGroup
            footer={
              hasItems
                ? 'Cannot delete a collection that contains items.'
                : undefined
            }
          >
            <UIGroup.ListItem
              button
              destructive
              disabled={hasItems}
              label={`Delete "${initialData?.name}"`}
              onPress={handleDeleteButtonPressed}
            />
          </UIGroup>
        )}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SaveCollectionScreen;
