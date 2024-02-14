import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { v4 as uuidv4 } from 'uuid';

import { useDB } from '@app/db';

import type { StackParamList } from '@app/navigation/MainStack';

import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

const DEFAULT_VALUES = {
  sourceDatabaseUri: '',
  sourceDatabaseUsername: '',
  sourceDatabasePassword: '',
  migrationName: '',
} as const;

function DevDataMigrationScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DevDataMigration'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  const logger = useLogger('DevDataMigrationScreen');
  const { db } = useDB();

  const [sourceDatabaseUri, setSourceDatabaseUri] = useState<string>(
    DEFAULT_VALUES.sourceDatabaseUri,
  );
  const [sourceDatabaseUsername, setSourceDatabaseUsername] = useState<string>(
    DEFAULT_VALUES.sourceDatabaseUsername,
  );
  const [sourceDatabasePassword, setSourceDatabasePassword] = useState<string>(
    DEFAULT_VALUES.sourceDatabasePassword,
  );
  const [testConnectionMessage, setTestConnectionMessage] = useState<
    string | undefined
  >(undefined);
  useEffect(() => {
    setTestConnectionMessage(undefined);
  }, [sourceDatabaseUri, sourceDatabaseUsername, sourceDatabasePassword]);
  const handleTestConnection = useCallback(async () => {
    setTestConnectionMessage('TESTING');
    try {
      var PouchDB = require('pouchdb');
      PouchDB.plugin(require('pouchdb-authentication'));
      const remoteDB = new PouchDB(sourceDatabaseUri, { skip_setup: true });
      await remoteDB.logIn(sourceDatabaseUsername, sourceDatabasePassword);
      await remoteDB.allDocs({ limit: 1, include_docs: false });
    } catch (e: any) {
      setTestConnectionMessage(
        `❌ Connection failed: ${e.message || 'Unable to connect to server'}`,
      );
      return;
    }

    setTestConnectionMessage('✅ Connection success');
  }, [sourceDatabasePassword, sourceDatabaseUri, sourceDatabaseUsername]);

  const [migrationName, setMigrationName] = useState<string>(
    DEFAULT_VALUES.migrationName,
  );

  const [output, setOutput] = useState('Output will be shown here.');

  const [working, setWorking] = useState(false);
  const workingRef = useRef(working);
  workingRef.current = working;
  const handleStart = useCallback(async () => {
    if (workingRef.current) return;

    setWorking(true);
    workingRef.current = true;

    if (!migrationName) {
      Alert.alert(
        'Migration name is required',
        'Please enter a valid migration name.',
      );
      setWorking(false);
      return;
    }

    const migrationFn = MIGRATION_DEFINITIONS[migrationName];

    if (!migrationFn) {
      Alert.alert(
        'Invalid migration name',
        `Please enter a valid migration name (one of ${Object.keys(
          MIGRATION_DEFINITIONS,
        ).join(', ')}).`,
      );
      setWorking(false);
      return;
    }

    let sourceDb;

    try {
      var PouchDB = require('pouchdb');
      PouchDB.plugin(require('pouchdb-authentication'));
      sourceDb = new PouchDB(sourceDatabaseUri, { skip_setup: true });
      await sourceDb.logIn(sourceDatabaseUsername, sourceDatabasePassword);
      await sourceDb.allDocs({ limit: 1, include_docs: false });
    } catch (e) {
      Alert.alert(
        'Connection failed',
        `Unable to connect to source database: ${e}`,
      );
      setWorking(false);
      return;
    }

    if (!sourceDb) {
      Alert.alert(
        'Source DB not ready',
        'Source DB is not ready. Please check your connection settings.',
      );
      setWorking(false);
      return;
    }

    if (!db) {
      Alert.alert(
        'Target DB not ready',
        'Target DB is not ready. Please wait a moment and try again.',
      );
      setWorking(false);
      return;
    }

    setOutput(`Starting migration "${migrationName}"...`);

    const log = (message: string) => {
      setOutput(o => `${o}\n${message}`);
      return new Promise<void>(resolve =>
        setTimeout(() => {
          resolve();
        }, 10),
      );
    };

    try {
      await migrationFn(sourceDb, db, { log });
    } catch (e) {
      Alert.alert('An Error Occurred', `${e}`);
    } finally {
      setWorking(false);
    }
  }, [
    db,
    migrationName,
    sourceDatabasePassword,
    sourceDatabaseUri,
    sourceDatabaseUsername,
  ]);

  return (
    <ScreenContent
      navigation={navigation}
      title="Developer's Data Migration"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup
          header="Source"
          footer={
            testConnectionMessage !== 'TESTING'
              ? testConnectionMessage
              : undefined
          }
          loading={working}
        >
          <UIGroup.ListTextInputItem
            label="URI"
            placeholder="https://0.0.0.0:5984/database_name"
            autoCapitalize="none"
            keyboardType="url"
            multiline
            blurOnSubmit
            value={sourceDatabaseUri}
            onChangeText={setSourceDatabaseUri}
            returnKeyType="done"
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Username"
            placeholder="username"
            autoCapitalize="none"
            value={sourceDatabaseUsername}
            onChangeText={setSourceDatabaseUsername}
            returnKeyType="done"
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Password"
            placeholder="********"
            secureTextEntry
            value={sourceDatabasePassword}
            onChangeText={setSourceDatabasePassword}
            returnKeyType="done"
            {...kiaTextInputProps}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            disabled={testConnectionMessage === 'TESTING'}
            onPress={handleTestConnection}
            label="Test Connection"
          />
        </UIGroup>

        <UIGroup header="Migration Name" loading={working}>
          <UIGroup.ListTextInputItem
            value={migrationName}
            onChangeText={setMigrationName}
            placeholder="Enter Migration Name..."
            autoCapitalize="none"
          />
        </UIGroup>

        <UIGroup loading={working}>
          <UIGroup.ListItem
            label="Start"
            button
            onPress={handleStart}
            disabled={working}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Output"
            monospaced
            multiline
            showSoftInputOnFocus={false}
            value={output}
            small
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

type MigrationFn = (
  sourceDb: PouchDB.Database,
  targetDb: PouchDB.Database,
  options: { log: (message: string) => Promise<void> },
) => Promise<void>;

const MIGRATION_DEFINITIONS: { [name: string]: MigrationFn } = {
  'm-2023': async (sourceDb, targetDb, { log }) => {
    const allDocs = await sourceDb.allDocs();
    await log(`Total rows: ${allDocs.total_rows}.`);
    let count = 0;

    function updateDoc(id: string, updater: (doc: any) => any): Promise<any> {
      return targetDb
        .get(id)
        .catch(function (err) {
          if (err.name === 'not_found') {
            return {
              _id: id,
            };
          } else {
            throw err;
          }
        })
        .then(function (doc) {
          return targetDb.put({
            ...doc,
            ...updater(doc),
          });
        })
        .catch(function (err) {
          throw err;
        });
    }

    const collectionItemOrders: any = {};
    const itemContentOrders: any = {};

    for (const row of allDocs.rows) {
      if (row.id === '0000-config') {
        const doc: any = await sourceDb.get(row.id);
        await updateDoc('0000-config', ({ uuid, collections_order }) => ({
          uuid: uuid || uuidv4(),
          rfid_tag_company_prefix: doc.epcCompanyPrefix,
          rfid_tag_individual_asset_reference_prefix: doc.epcPrefix,
          rfid_tag_access_password: doc.rfidTagAccessPassword,
          default_use_mixed_rfid_tag_access_password: true,
          rfid_tag_access_password_encoding: doc.rfidTagAccessPasswordEncoding,
          collections_order: collections_order || [],
        }));
      } else if (row.id === '0100-settings/collections-order') {
        const doc: any = await sourceDb.get(row.id);
        await updateDoc('0000-config', () => ({
          collections_order: doc.data,
        }));
      } else if (row.id.match(/^0110-settings\/collection-(.+)-items-order$/)) {
        const doc: any = await sourceDb.get(row.id);
        const [, id] =
          row.id.match(/^0110-settings\/collection-(.+)-items-order$/) || [];
        collectionItemOrders[id] = doc.data;
      } else if (
        row.id.match(/^0112-settings\/item-(.+)-dedicatedContents-order$/)
      ) {
        const doc: any = await sourceDb.get(row.id);
        const [, id] =
          row.id.match(/^0112-settings\/item-(.+)-dedicatedContents-order$/) ||
          [];
        itemContentOrders[id] = doc.data;
      } else if (row.id.startsWith('collection-2-')) {
        const doc: any = await sourceDb.get(row.id);
        const id = row.id.slice('collection-2-'.length);
        await updateDoc(`collection-${id}`, od => ({
          type: 'collection',
          data: {
            ...od.data,
            name: doc?.data?.name,
            icon_name: doc?.data?.iconName,
            icon_color: doc?.data?.iconColor,
            collection_reference_number: doc?.data?.collectionReferenceNumber,
            item_default_icon_name: doc?.data?.itemDefaultIconName,
            items_order: collectionItemOrders[id] || [],
          },
          created_at: 0,
          updated_at: 0,
        }));
      } else if (row.id.startsWith('item-2-')) {
        const doc: any = await sourceDb.get(row.id);
        const id = row.id.slice('item-2-'.length);
        await updateDoc(`item-${id}`, od => ({
          type: 'item',
          data: {
            ...od.data,
            name: doc?.data?.name,
            icon_name: doc?.data?.iconName,
            icon_color: doc?.data?.iconColor,
            collection_id: doc?.data?.collection,
            item_reference_number: doc?.data?.itemReferenceNumber,
            serial: doc?.data?.serial,
            individual_asset_reference: undefined,
            epc_tag_uri: undefined,
            epc_tag_uri_manually_set: undefined,
            rfid_tag_epc_memory_bank_contents: undefined,
            rfid_tag_epc_memory_bank_contents_manually_set: undefined,
            actual_rfid_tag_epc_memory_bank_contents:
              doc?.data?.actualRfidTagEpcMemoryBankContents,
            use_mixed_rfid_tag_access_password: true,
            rfid_tag_access_password: doc?.data?.rfidTagAccessPassword,
            item_type: doc?.data?.isContainer
              ? (() => {
                  switch (doc?.data?.isContainerType) {
                    case 'generic-container':
                      return 'generic_container';
                    case 'item-with-parts':
                      return 'item_with_parts';

                    default:
                      return 'container';
                  }
                })()
              : undefined,
            _can_contain_items: undefined,
            container_id: doc?.data?.dedicatedContainer,
            always_show_in_collection:
              doc?.data?.alwaysShowOutsideOfDedicatedContainer,
            _show_in_collection: undefined,
            notes: doc?.data?.notes,
            model_name: doc?.data?.modelName,
            purchase_price_x1000: doc?.data?.purchasePriceX1000,
            purchase_price_currency: doc?.data?.purchasePriceCurrency,
            purchased_from: doc?.data?.purchasedFrom,
            purchase_date: undefined,
            expiry_date: undefined,
            contents_order: itemContentOrders[id],
          },
          created_at: doc?.data?.createdAt * 1000,
          updated_at: doc?.data?.updatedAt * 1000,
        }));
      }

      count += 1;
    }

    // await log(`collectionItemOrders: ${JSON.stringify(collectionItemOrders)}`);
    // await log(`itemContentOrders: ${JSON.stringify(itemContentOrders)}`);
    await log('Done.');
  },
};

export default DevDataMigrationScreen;
