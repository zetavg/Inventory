import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { selectors, useAppSelector } from '@app/redux';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function LabelPrintersScreen({
  navigation,
}: StackScreenProps<StackParamList, 'LabelPrinters'>) {
  const rootNavigation = useRootNavigation();

  const printers = useAppSelector(selectors.labelPrinters.printers);

  return (
    <ScreenContent navigation={navigation} title="Label Printers">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />

        <UIGroup placeholder="No printers">
          {Object.keys(printers).length > 0 &&
            UIGroup.ListItemSeparator.insertBetween(
              Object.entries(printers)
                .sort(([_, printer1], [__, printer2]) =>
                  (printer1?.name || '').localeCompare(printer2?.name || ''),
                )
                .map(([id, printer]) => (
                  <UIGroup.ListItem
                    key={id}
                    label={printer?.name || ''}
                    navigable
                    onPress={() =>
                      rootNavigation?.push('NewOrEditLabelPrinterModal', { id })
                    }
                  />
                )),
            )}
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Add Label Printer..."
            button
            onPress={() => {
              rootNavigation?.push('NewOrEditLabelPrinterModal', {});
            }}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default LabelPrintersScreen;
