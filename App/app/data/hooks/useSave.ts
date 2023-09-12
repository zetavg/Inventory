import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { ZodError } from 'zod';

import { CONTACT_GET_HELP_URL } from '@app/consts/info';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { GetConfigError } from '../functions/config';
import saveDatum from '../functions/saveDatum';
import { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';
import { toTitleCase } from '../utils';

type SaveFn = <T extends DataTypeName>(
  d: Partial<DataTypeWithAdditionalInfo<T>>,
  options?: { showErrorAlert?: boolean },
) => Promise<DataTypeWithAdditionalInfo<T>>;

function useSave(): { save: SaveFn; saving: boolean } {
  const logger = useLogger('useSave');
  const { db } = useDB();

  const [saving, setSaving] = useState(false);

  const save = useCallback<SaveFn>(
    async (d, options) => {
      setSaving(true);
      try {
        if (!db) throw new Error('Database is not ready yet.');
        return await saveDatum(d, { db, logger });
      } catch (e) {
        if (e instanceof ZodError) {
          if (options?.showErrorAlert !== false) {
            Alert.alert(
              'Please Fix The Following Errors',
              e.issues
                .map(
                  i =>
                    `• ${toTitleCase(
                      i.path.join('_').replace(/_/g, ' '),
                    )} - ${i.message.toLowerCase()}`,
                )
                .join('\n'),
            );
          }
        } else {
          logger.error(e, {
            showAlert: options?.showErrorAlert,
            details: JSON.stringify({ data: d }, null, 2),
          });
          if (e instanceof GetConfigError) {
            Alert.alert(
              'Database Error',
              'The config document could not be retrieved. Your database may be corrupted.',
              [
                {
                  text: 'Ok',
                  style: 'cancel',
                },
                {
                  text: 'Get Help',
                  onPress: () => {
                    Linking.openURL(CONTACT_GET_HELP_URL);
                  },
                },
              ],
            );
          }
        }

        throw e;
      } finally {
        setSaving(false);
      }
    },
    [db, logger],
  );

  return useMemo(() => ({ save, saving }), [save, saving]);
}

export default useSave;
