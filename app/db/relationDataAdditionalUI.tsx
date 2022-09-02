import React from 'react';
import { DataType } from './schema';
import InsetGroup from '@app/components/InsetGroup';
import { useRootBottomSheets } from '@app/navigation/RootBottomSheetsContext';

export const relationDataAdditionalUI: {
  [type: string]: (props: { data: DataType<any> }) => JSX.Element | null;
} = {
  item: ({ data }: any) => {
    const item: DataType<'item'> = data as any;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openRfidSheet } = useRootBottomSheets();
    const { calculatedRfidTagEpcMemoryBankContents } = item;
    if (!calculatedRfidTagEpcMemoryBankContents) return null;

    return (
      <InsetGroup>
        <InsetGroup.Item
          button
          label="Write RFID Tag"
          onPress={() =>
            openRfidSheet({
              functionality: 'write',
              epc: calculatedRfidTagEpcMemoryBankContents,
              tagAccessPassword: item.rfidTagAccessPassword,
            })
          }
        />
      </InsetGroup>
    );
  },
};

export default relationDataAdditionalUI;
