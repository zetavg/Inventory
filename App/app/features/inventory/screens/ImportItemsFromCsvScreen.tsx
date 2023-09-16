import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView, Text as RNText } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { jsonToCSV, readRemoteFile } from 'react-native-csv';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';

import { DataTypeWithAdditionalInfo, useSave } from '@app/data';
import { InvalidDataTypeWithAdditionalInfo } from '@app/data/types';
import {
  getValidationResultMessage,
  ValidationResults,
} from '@app/data/validation';

import titleCase from '@app/utils/titleCase';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';
import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';
import {
  classifyItems,
  getItemsFromCsv,
  processItems,
} from '../utils/csv-import';
import itemToCsvRow from '../utils/itemToCsvRow';

const MAX_DISPLAY_LIMIT = 12;

function ImportItemsFromCsvScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ImportItemsFromCsv'>) {
  const { showActionSheetWithOptions } = useActionSheet();
  const { iosTintColor } = useColors();
  const { db } = useDB();
  const logger = useLogger('ImportItemsFromCsvScreen');

  const handleGetSampleCsv = useCallback(async () => {
    if (!db) return;

    const items: DataTypeWithAdditionalInfo<'item'>[] = Array.from(
      new Array(100),
    ).map(() => ({
      __type: 'item',
      __valid: true,
      __raw: {},
      __id: uuidv4(),
      name: '',
      collection_id: '',
      icon_name: '',
      icon_color: '',
      config_uuid: '',
    }));
    items[0].name = 'IDs are auto-generated for new items.';
    items[1].name = 'Items with no name will be ignored.';
    const loadedCollectionsMap = new Map();
    const data = await Promise.all(
      items.map(it => itemToCsvRow(it, { db, loadedCollectionsMap })),
    );
    const sampleCsv = jsonToCSV(data);
    const sampleFilePath = `${RNFS.TemporaryDirectoryPath}/Inventory - Import Items Template.csv`;
    await RNFS.writeFile(sampleFilePath, sampleCsv, 'utf8');

    Share.open({
      url: sampleFilePath,
      failOnCancel: false,
    });
  }, [db]);

  const [loading, setLoading] = useState(false);
  const [csvFileName, setCsvFileName] = useState<null | string>(null);
  const [csvContents, setCsvContents] = useState<null | any>(null);
  const [loadedItems, setLoadedItems] = useState<Array<
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>
  > | null>(null);
  const [processedLoadedItems, setProcessedLoadedItems] = useState<Array<
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>
  > | null>(null);
  const [loadedItemsIssues, setLoadedItemsIssues] = useState<
    WeakMap<
      | DataTypeWithAdditionalInfo<'item'>
      | InvalidDataTypeWithAdditionalInfo<'item'>,
      ValidationResults
    >
  >(new WeakMap());
  const handleSelectCsvFile = useCallback(async () => {
    if (!db) return;

    setLoading(true);
    try {
      const { uri } = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.csv,
      });
      readRemoteFile(uri, {
        header: true,
        complete: async (results: any) => {
          setCsvContents(results);
          const items = await getItemsFromCsv(results.data, { db });
          if (!items || items.length < 1) {
            setCsvFileName(null);
            Alert.alert(
              'No items to import',
              'CSV file may be invalid or empty, please check.',
            );
          } else {
            const n = uri.split('/').pop();
            setCsvFileName(n ? decodeURIComponent(n) : null);
          }
          setLoadedItems(items);
          setProcessedLoadedItems(items);
          setLoadedItemsIssues(new WeakMap());
          // beforeSave and validate will be run with useEffect.
        },
        error: () => {
          setLoading(false);
        },
      });
    } catch (e) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (!db) return;
    if (!loadedItems) return;

    setLoading(true);
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const { processedItems, issuesMap } = await processItems(loadedItems, {
          db,
        });
        setProcessedLoadedItems(processedItems);
        setLoadedItemsIssues(issuesMap);
      } catch (e) {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, loadedItems]);

  const {
    validItems: loadedValidItems,
    invalidItems: loadedInvalidItems,
    itemsToCreate: itemsToCreate,
    itemsToUpdate: itemsToUpdate,
  } = useMemo(() => {
    return classifyItems(processedLoadedItems, {
      itemIssues: loadedItemsIssues,
    });
  }, [loadedItemsIssues, processedLoadedItems]);

  const hasValidItemsToCreate = itemsToCreate && itemsToCreate.length > 0;
  const hasValidItemsToUpdate = itemsToUpdate && itemsToUpdate.length > 0;

  const { save } = useSave();
  const [importing, setImporting] = useState(false);
  const handleImport = useCallback(async () => {
    if (!db) return;

    setImporting(true);
    const errorMessages = [];
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      for (const it of loadedValidItems) {
        try {
          await save(it, { showErrorAlert: false });
        } catch (e) {
          errorMessages.push(
            `${
              typeof it.name === 'string'
                ? `${it.name}${it.__id ? ` (${it.__id})` : ''}`
                : it.__id
            } - ${
              e instanceof ZodError
                ? e.issues
                    .map(issue => {
                      const path = issue.path.join('.');
                      const name = path.split('.').map(titleCase).join(' ');
                      return `${name}: ${issue.message}`;
                    })
                    .join(', ')
                : e instanceof Error
                ? e.message
                : 'Unknown error.'
            }`,
          );
        }
      }
    } catch (e) {
      Alert.alert(
        'Unexpected Error',
        e instanceof Error ? e.message : 'Unknown error.',
      );
    } finally {
      setImporting(false);
      if (errorMessages.length > 0) {
        Alert.alert(
          `Failed to save ${errorMessages.length} items`,
          errorMessages.join('\n'),
        );
        if (csvContents) {
          // Reload items to avoid document update conflict on retry.
          const items = await getItemsFromCsv(csvContents.data, { db });
          setLoadedItems(items);
          setProcessedLoadedItems(items);
          setLoadedItemsIssues(new WeakMap());
        }
      } else {
        Alert.alert('Success', `${loadedValidItems.length} items imported.`);
        setCsvFileName(null);
        setLoadedItems([]);
        setProcessedLoadedItems([]);
        setLoadedItemsIssues(new WeakMap());
      }
    }
  }, [csvContents, db, loadedValidItems, save]);

  const working = loading || importing;

  const summary = (() => {
    const lines = [];

    if (loadedInvalidItems && loadedInvalidItems.length > 0) {
      lines.push(
        `${loadedInvalidItems.length} item(s) with error will be ignored.`,
      );
    }

    if (hasValidItemsToUpdate) {
      lines.push(`${itemsToUpdate.length} item(s) will be updated.`);
    }

    if (hasValidItemsToCreate) {
      lines.push(`${itemsToCreate.length} item(s) will be created.`);
    }

    if (lines.length > 0) lines.push('');
    if (hasValidItemsToUpdate || hasValidItemsToCreate) {
      lines.push('Press "Import" on the top right to perform import.');
    } else {
      lines.push('No items to import.');
    }

    return lines.join('\n');
  })();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ModalContent
      navigation={navigation}
      title="CSV Import"
      backButtonLabel="Cancel"
      action1Label="Import"
      action1Variant="strong"
      onAction1Press={
        (hasValidItemsToUpdate || hasValidItemsToCreate) && !working
          ? handleImport
          : undefined
      }
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup
          header={
            loadedItems && loadedItems.length > 0
              ? undefined
              : 'Items to Import'
          }
          loading={working}
          footer={
            loadedItems && loadedItems.length > 0 ? (
              `${loadedItems.length} items loaded from CSV file.`
            ) : (
              <>
                Press "Select CSV File..." to open a CSV file.
                <RNText> </RNText>
                You can either start with a<RNText> </RNText>
                <RNText
                  onPress={handleGetSampleCsv}
                  style={{ color: iosTintColor }}
                >
                  template CSV file
                </RNText>
                , or{' '}
                <RNText
                  onPress={() => {
                    navigation.push('ExportItemsToCsv');
                  }}
                  style={{ color: iosTintColor }}
                >
                  export items to a CSV file
                </RNText>
                , edit it and import them back. Items with matching ID will be
                updated.
              </>
            )
          }
        >
          {!!csvFileName && (
            <>
              <UIGroup.ListItem
                key="file-name"
                label="Selected File"
                detail={csvFileName}
                adjustsDetailFontSizeToFit
              />
              <UIGroup.ListItemSeparator />
            </>
          )}
          <UIGroup.ListItem
            button
            label={
              csvFileName ? 'Select Another CSV File...' : 'Select CSV File...'
            }
            key="select-file"
            onPress={handleSelectCsvFile}
          />
        </UIGroup>
        {loadedInvalidItems && loadedInvalidItems.length > 0 && (
          <UIGroup
            header="Items with Error"
            footer={(() => {
              let message = `These ${loadedInvalidItems.length} items will be ignored.`;

              if (!hasValidItemsToCreate && !hasValidItemsToUpdate) {
                message += '\n\n';
                message += summary;
              }

              return message;
            })()}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              loadedInvalidItems.map((it, i) => {
                const title =
                  typeof it.name === 'string'
                    ? `${it.name}${it.__id ? ` (${it.__id})` : ''}`
                    : it.__id;
                const errorMessage = (() => {
                  const zodError = (it.__error_details as any)?.error;
                  if (zodError instanceof ZodError) {
                    return zodError.issues
                      .map(issue => {
                        const path = issue.path.join('.');
                        const name = path.split('.').map(titleCase).join(' ');
                        return `${name}: ${issue.message}`;
                      })
                      .join(', ');
                  }

                  if (loadedItemsIssues.has(it)) {
                    const issues = loadedItemsIssues.get(it);
                    if (issues) {
                      return getValidationResultMessage(issues, {
                        bullet: '',
                        joinWith: ', ',
                      });
                    }
                  }

                  return 'Unknown Error.';
                })();
                return (
                  <UIGroup.ListItem
                    key={i}
                    verticalArrangedIOS
                    label={title}
                    detail={errorMessage}
                    onPress={() => Alert.alert(title || 'Error', errorMessage)}
                  />
                );
              }),
              {
                forItemWithIcon: true,
              },
            )}
          </UIGroup>
        )}
        {hasValidItemsToUpdate && (
          <UIGroup
            header="Items to Update"
            loading={working}
            footer={(() => {
              let message = `${itemsToUpdate.length} item(s) will be updated.`;

              if (!hasValidItemsToCreate) {
                message += '\n\n';
                message += summary;
              }

              return message;
            })()}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              itemsToUpdate
                .slice(0, MAX_DISPLAY_LIMIT)
                .map((it, i) => (
                  <ItemListItem
                    key={i}
                    item={it}
                    hideContentDetails
                    navigable={false}
                    onPress={() => {}}
                  />
                )),
              {
                forItemWithIcon: true,
              },
            )}
            {itemsToUpdate.length > MAX_DISPLAY_LIMIT && (
              <>
                <UIGroup.ListItemSeparator forItemWithIcon />
                <UIGroup.ListItem
                  label={`+${
                    itemsToUpdate.length - MAX_DISPLAY_LIMIT
                  } other items`}
                  icon="cube-outline"
                  iconColor="transparent"
                />
              </>
            )}
          </UIGroup>
        )}
        {hasValidItemsToCreate && (
          <UIGroup
            header="Items to Create"
            loading={working}
            footer={(() => {
              let message = `${itemsToCreate.length} item(s) will be created.`;

              message += '\n\n';
              message += summary;

              return message;
            })()}
          >
            {UIGroup.ListItemSeparator.insertBetween(
              itemsToCreate
                .slice(0, MAX_DISPLAY_LIMIT)
                .map((it, i) => (
                  <ItemListItem
                    key={i}
                    item={it}
                    hideContentDetails
                    navigable={false}
                    onPress={() => {}}
                  />
                )),
              {
                forItemWithIcon: true,
              },
            )}
            {itemsToCreate.length > MAX_DISPLAY_LIMIT && (
              <>
                <UIGroup.ListItemSeparator forItemWithIcon />
                <UIGroup.ListItem
                  label={`+${
                    itemsToCreate.length - MAX_DISPLAY_LIMIT
                  } other items`}
                  icon="cube-outline"
                  iconColor="transparent"
                />
              </>
            )}
          </UIGroup>
        )}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default ImportItemsFromCsvScreen;
