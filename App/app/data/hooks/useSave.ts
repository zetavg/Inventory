import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { getSaveDatum } from '../functions';
import { DataType } from '../schema';
import { DataMeta, DataTypeName, SaveDatum } from '../types';
import { getHumanName } from '../utils';
import { ValidationError } from '../validation';

/**
 * Create, update or delete a datum.
 *
 * It will return the saved datum if success, or null if anything fails.
 */
export type SaveFn = <T extends DataTypeName>(
  /**
   * The data to create, update or delete.
   *
   * * For creation, if `__id` is omitted, a random one will be assigned automatically.
   * * For updating, data can be provided partially, just make sure that `__type` and `__id` is valid.
   *     * A updater function can also be used by providing a tuple of the data type, ID and the updater function. In such case, `ignoreConflict` will be assumed as `true`.
   * * For deletion, set `__deleted` to `true` while making sure that `__type` and `__id` is valid. Other fields are not necessary for deletion.
   */
  data:
    | (DataMeta<T> &
        (
          | { [key: string]: unknown } // Since the data will be validated, we can accept unknown user input.
          // Adding this just for editor auto-complete
          | DataType<T>
        ))
    | [
        T,
        string,
        (d: DataMeta<T> & { [key: string]: unknown }) => Partial<DataType<T>>,
      ],
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
