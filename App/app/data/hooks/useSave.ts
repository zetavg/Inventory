import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { getSaveDatum } from '../functions';
import { DataMeta, DataTypeName, SaveDatum } from '../types';
import { getHumanName } from '../utils';
import { ValidationError } from '../validation';

export type SaveFn = <T extends DataTypeName>(
  data: DataMeta<T> & { [key: string]: unknown },
  options?: Parameters<SaveDatum>[1],
) => Promise<(DataMeta<T> & { [key: string]: unknown }) | null>;

function useSave({
  showAlertOnError = true,
}: { showAlertOnError?: boolean } = {}): {
  save: SaveFn;
  saving: boolean;
} {
  const logger = useLogger('useSave');
  const { db } = useDB();

  const [saving, setSaving] = useState(false);

  const save = useCallback<SaveFn>(
    async (d, options) => {
      setSaving(true);

      try {
        if (!db) throw new Error('Database is not ready yet.');
        const saveDatum = getSaveDatum({ db, logger });
        return await saveDatum(d, options);
      } catch (e) {
        if (e instanceof ValidationError) {
          if (showAlertOnError !== false) {
            Alert.alert(
              !d.__deleted
                ? 'Please Fix The Following Errors'
                : `Cannot Delete ${getHumanName(d.__type, {
                    titleCase: true,
                  })}`,
              e.messages.map(msg => `• ${msg}`).join('\n'),
            );
          } else {
            logger.error(e, {
              details: JSON.stringify({ data: d }, null, 2),
            });
          }
        } else {
          logger.error(e, {
            showAlert: showAlertOnError,
            details: JSON.stringify({ data: d }, null, 2),
          });
          // if (e instanceof GetConfigError) {
          //   Alert.alert(
          //     'Database Error',
          //     'The config document could not be retrieved. Your database may be corrupted.',
          //     [
          //       {
          //         text: 'Ok',
          //         style: 'cancel',
          //       },
          //       {
          //         text: 'Get Help',
          //         onPress: () => {
          //           Linking.openURL(CONTACT_GET_HELP_URL);
          //         },
          //       },
          //     ],
          //   );
          // }
        }

        return null;
      } finally {
        setSaving(false);
      }
    },
    [db, logger, showAlertOnError],
  );

  return useMemo(() => ({ save, saving }), [save, saving]);
}

export default useSave;
