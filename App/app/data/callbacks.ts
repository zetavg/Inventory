import EPCUtils from '@app/modules/EPCUtils';

import { DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

export function beforeSave(d: DataTypeWithAdditionalInfo<DataTypeName>) {
  switch (d.__type) {
    case 'item': {
      const data = d as DataTypeWithAdditionalInfo<'item'>;
      if (!data.epc_manually_set) {
        // TODO: generate epc_tag_uri
      }

      if (!data.rfid_tag_epc_memory_bank_contents_manually_set) {
        if (data.epc_tag_uri) {
          try {
            const [epcHex] = EPCUtils.encodeHexEPC(data.epc_tag_uri);
            data.rfid_tag_epc_memory_bank_contents = epcHex;
          } catch (e) {}
        } else {
          data.rfid_tag_epc_memory_bank_contents = undefined;
        }
      }

      if (!data.item_reference_number) data.item_reference_number = undefined;
      if (!data.serial) data.serial = undefined;
      if (!data.epc_tag_uri) data.epc_tag_uri = undefined;
      if (!data.rfid_tag_epc_memory_bank_contents)
        data.rfid_tag_epc_memory_bank_contents = undefined;
      if (!data.actual_rfid_tag_epc_memory_bank_contents)
        data.actual_rfid_tag_epc_memory_bank_contents = undefined;
      if (!data.item_type) data.item_type = undefined;
      break;
    }
  }
}
