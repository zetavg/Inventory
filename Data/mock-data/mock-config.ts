import { ConfigType } from 'schema';
import { GetConfig } from 'types';

export const CONFIG: ConfigType = {
  uuid: 'mock-config-uuid',
  rfid_tag_company_prefix: '0000000',
  rfid_tag_individual_asset_reference_prefix: '100',
  rfid_tag_access_password: '12345678',
  default_use_mixed_rfid_tag_access_password: false,
  rfid_tag_access_password_encoding: '082a4c6e',
  collections_order: [],
};

export const getConfig: GetConfig = async () => CONFIG;
