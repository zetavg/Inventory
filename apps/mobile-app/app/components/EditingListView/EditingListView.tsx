import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';

import commonStyles from '@app/utils/commonStyles';

import Text from '@app/components/Text';

import TableViewIOS from './TableViewIOS';

type Insets = {
  top?: number;
  bottom?: number;
};

type Props = {
  children: React.ReactNode;
  editing?: boolean;
  canMove?: boolean;
  canDelete?: boolean;
  contentInsets?: Insets;
  contentInset?: Insets;
  scrollIndicatorInsets?: Insets;
  style?: React.ComponentProps<typeof ScrollView>['style'];
  onItemMove?: (d: { from: number; to: number }) => void;
  onItemDelete?: (index: number) => void;
  scrollToTopOnLoad?: boolean;
  withIOSLargeTitle?: boolean;
};

function EditingListView({
  children,
  editing,
  canMove,
  canDelete,
  onItemMove,
  onItemDelete,
  contentInsets,
  contentInset,
  scrollIndicatorInsets,
  style,
  scrollToTopOnLoad,
  withIOSLargeTitle,
}: Props) {
  const [key, setKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (scrollToTopOnLoad === false) return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo(0, -100, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [scrollToTopOnLoad]);

  if (Platform.OS === 'ios') {
    // Dirty mapping to iOS native EditingListView

    let tableChildren = children;

    if (!Array.isArray(tableChildren)) {
      tableChildren = [tableChildren];
    }
    if (!Array.isArray(tableChildren)) {
      throw new Error('EditingListView: Impossible');
    }

    const iosChildren = tableChildren.map((item: any) => {
      if (item.type.n !== 'EditingListViewItem') {
        throw new Error(
          `EditingListView: children should be type of EditingListViewItem. Got: ${item.type}.`,
        );
      }

      const { label }: EditingListViewItemProps = item.props;

      return <TableViewIOS.Item key={item.key} label={label} canEdit />;
    });

    return (
      <TableViewIOS
        key={key}
        ref={scrollViewRef}
        style={[commonStyles.flex1, style as any]}
        contentInset={{
          ...(contentInsets || contentInset),
          top: withIOSLargeTitle
            ? 8
            : ((contentInsets || contentInset || {}).top || 0) + 16,
        }}
        scrollIndicatorInsets={scrollIndicatorInsets}
        tableViewStyle={TableViewIOS.Consts.Style.InsetGrouped}
        tableViewCellEditingStyle={
          canDelete
            ? TableViewIOS.Consts.CellEditingStyle.Delete
            : TableViewIOS.Consts.CellEditingStyle.None
        }
        tableViewCellStyle={TableViewIOS.Consts.CellStyle.Value1}
        editing={typeof editing === 'boolean' ? editing : true}
        onChange={(d: any) => {
          if (d.mode === 'move')
            onItemMove &&
              onItemMove({ from: d.sourceIndex, to: d.destinationIndex });
          else if (d.mode === 'delete')
            onItemDelete && onItemDelete(d.selectedIndex);

          // setKey(k => k + 1);
        }}
      >
        <TableViewIOS.Section canMove={canMove} canEdit>
          {iosChildren}
        </TableViewIOS.Section>
      </TableViewIOS>
    );
  }

  // Currently not supported on Android
  return (
    <Text>This UI (EditingListView) is not yet implemented on Android.</Text>
  );
}

type EditingListViewItemProps = {
  label?: string;
};

function EditingListViewItem({}: EditingListViewItemProps) {
  return null;
}

EditingListViewItem.n = 'EditingListViewItem';

EditingListView.Item = EditingListViewItem;

export default EditingListView;
