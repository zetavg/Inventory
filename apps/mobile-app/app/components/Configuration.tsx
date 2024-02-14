import React, { useState } from 'react';

import { useConfig } from '@app/data';

import UIGroup from '@app/components/UIGroup';

export default function Configuration(props: {
  uiGroupStyle?: React.ComponentProps<typeof UIGroup>['style'];
  listItemSeparatorColor?: string;
}) {
  const { config } = useConfig();

  const [showPassword, setShowPassword] = useState(false);

  if (!config) {
    return <UIGroup loading />;
  }

  return (
    <>
      <UIGroup style={props.uiGroupStyle}>
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Company Prefix"
          monospaceDetail
          detail={config?.rfid_tag_company_prefix}
        />
        <UIGroup.ListItemSeparator color={props.listItemSeparatorColor} />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Individual Asset Reference Prefix"
          monospaceDetail
          detail={config?.rfid_tag_individual_asset_reference_prefix}
        />
      </UIGroup>

      <UIGroup style={props.uiGroupStyle}>
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="RFID Tag Access Password"
          monospaceDetail
          detail={showPassword ? config?.rfid_tag_access_password : '********'}
          rightElement={
            <UIGroup.ListTextInputItem.Button
              onPress={() => setShowPassword(v => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </UIGroup.ListTextInputItem.Button>
          }
        />
        <UIGroup.ListItemSeparator color={props.listItemSeparatorColor} />
        <UIGroup.ListItem
          verticalArrangedLargeTextIOS
          label="Use Mixed RFID Tag Access Password"
          detail={
            config?.default_use_mixed_rfid_tag_access_password ? 'Yes' : 'No'
          }
        />
        {config?.default_use_mixed_rfid_tag_access_password && (
          <>
            <UIGroup.ListItemSeparator color={props.listItemSeparatorColor} />
            <UIGroup.ListItem
              verticalArrangedLargeTextIOS
              label="Password Encoding"
              monospaceDetail
              detail={config?.rfid_tag_access_password_encoding}
            />
          </>
        )}
      </UIGroup>
    </>
  );
}
