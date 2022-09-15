import Color from 'color';
import React, { useRef, useCallback, useEffect } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import {
  RadioButton,
  Divider,
  List,
  Switch,
  useTheme,
} from 'react-native-paper';
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
  onItemMove: (d: { from: number; to: number }) => void;
  onItemDelete: (index: number) => void;
  scrollToTopOnLoad?: boolean;
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
}: Props) {
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!scrollToTopOnLoad) return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo(0, -999, false);
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

      return <TableViewIOS.Item key={item.key} label={label} />;
    });

    return (
      <TableViewIOS
        ref={scrollViewRef}
        style={style as any}
        contentInset={contentInsets || contentInset}
        scrollIndicatorInsets={scrollIndicatorInsets}
        tableViewStyle={TableViewIOS.Consts.Style.InsetGrouped}
        tableViewCellStyle={TableViewIOS.Consts.CellStyle.Value1}
        editing={typeof editing === 'boolean' ? editing : true}
        onChange={(d: any) => {
          if (d.mode === 'move')
            onItemMove({ from: d.sourceIndex, to: d.destinationIndex });
          else if (d.mode === 'delete') onItemDelete(d.selectedIndex);
        }}
      >
        <TableViewIOS.Section
          canMove={typeof canMove === 'boolean' ? canMove : true}
          canEdit={typeof canDelete === 'boolean' ? canDelete : true}
        >
          {iosChildren}
        </TableViewIOS.Section>
      </TableViewIOS>
    );
  }

  // Currently not supported on Android
  return null;
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
