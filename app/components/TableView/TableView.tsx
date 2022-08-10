import React, { useRef, useCallback } from 'react';
import { Platform, ScrollView } from 'react-native';
import TableViewIOS from 'react-native-tableview';

type Insets = {
  bottom: number;
};

type Props = {
  children: React.ReactNode;
  contentInsets?: Insets;
  scrollIndicatorInsets?: Insets;
  style?: React.ComponentProps<typeof ScrollView>['style'];
  scrollViewRef?: any;
  iosStyle?: 'plain' | 'grouped' | 'inset-grouped';
};

function TableView({
  children,
  contentInsets,
  scrollIndicatorInsets,
  style,
  iosStyle,
  scrollViewRef,
}: Props) {
  // eslint-disable-next-line no-spaced-func
  const switchChangeValueHandlers = useRef<{
    [tag: number]: ((v: boolean) => void) | undefined;
  }>({});
  const handleSwitchChange = useCallback((event: any) => {
    const tag = event?.nativeEvent?.tag;
    if (!tag) {
      return;
    }

    const fn = switchChangeValueHandlers.current[tag];

    fn && fn(event.nativeEvent.isOn);
  }, []);

  if (Platform.OS === 'ios') {
    // Dirty mapping to iOS native TableView

    let tableChildren = children;

    if (!Array.isArray(tableChildren)) {
      tableChildren = [tableChildren];
    }
    if (!Array.isArray(tableChildren)) {
      throw new Error('TableView: Impossible');
    }

    let cellCount = 0;
    let switchCount = 0;
    const iosChildren = tableChildren.map((section: any) => {
      if (section.type.n !== 'TableViewSection') {
        throw new Error(
          `TableView: children should be type of TableViewSection. Got: ${section.type}.`,
        );
      }

      const { label, footerLabel }: TableViewSectionProps = section.props;
      let { children: sectionChildren }: TableViewSectionProps = section.props;

      if (!Array.isArray(sectionChildren)) {
        sectionChildren = [sectionChildren];
      }
      if (!Array.isArray(sectionChildren)) {
        throw new Error('TableView: Impossible');
      }

      return (
        <TableViewIOS.Section
          key={section.key}
          label={label}
          footerLabel={footerLabel}
        >
          {sectionChildren.map(item => {
            if (item.type.n !== 'TableViewItem') {
              throw new Error(
                `TableView.Section: children should be type of TableViewItem. Got: ${section.type}.`,
              );
            }

            const {
              children: c,
              label: l,
              detail,
              arrow,
              selected,
              switch: sw,
              switchValue,
              onSwitchChangeValue,
              iosImage,
              onPress,
            }: TableViewItemProps = item.props;

            if (sw) {
              switchCount += 1;
            }

            const switchTag = sw ? switchCount : 0;

            if (sw) {
              switchChangeValueHandlers.current[switchTag] =
                onSwitchChangeValue;
            }

            let cellKey = '';
            cellCount += 1;

            if (section.key && item.key) {
              cellKey = `${section.key}-${item.key}`;
            }

            if (!cellKey && sw) {
              cellKey = `switch-${switchTag}`;
            }

            if (!cellKey) {
              cellKey = `s${cellCount}`;
            }

            return (
              <TableViewIOS.Item
                key={item.key}
                cellKey={cellKey}
                detail={detail}
                arrow={arrow}
                selected={selected}
                switch={sw}
                switchTag={switchTag}
                switchValue={switchValue}
                image={iosImage}
                onPress={onPress}
                selectionStyle={
                  onPress
                    ? TableViewIOS.Consts.CellSelectionStyle.Default
                    : TableViewIOS.Consts.CellSelectionStyle.None
                }
              >
                {l || c}
              </TableViewIOS.Item>
            );
          })}
        </TableViewIOS.Section>
      );
    });

    return (
      <TableViewIOS
        ref={scrollViewRef}
        style={style as any}
        contentInset={contentInsets}
        scrollIndicatorInsets={scrollIndicatorInsets}
        onSwitchChange={handleSwitchChange}
        tableViewStyle={(() => {
          switch (iosStyle) {
            case 'plain':
              return TableViewIOS.Consts.Style.Plain;

            case 'grouped':
              return TableViewIOS.Consts.Style.Grouped;

            default:
            case 'inset-grouped':
              return TableViewIOS.Consts.Style.InsetGrouped;
          }
        })()}
        tableViewCellStyle={TableViewIOS.Consts.CellStyle.Value1}
      >
        {iosChildren}
      </TableViewIOS>
    );
  }

  return <ScrollView />;
}

type TableViewSectionProps = {
  label?: string;
  footerLabel?: string;
  children: React.ReactNode;
};

function TableViewSection(props: TableViewSectionProps) {
  return null;
}

TableViewSection.n = 'TableViewSection';

TableView.Section = TableViewSection;

type TableViewItemProps = {
  children?: string;
  label?: string;
  detail?: string;
  arrow?: boolean;
  selected?: boolean;
  switch?: boolean;
  switchValue?: boolean;
  onSwitchChangeValue?: (v: boolean) => void;
  iosImage?: any;
  onPress?: () => void;
  // accessoryType?: typeof TableView.Consts.DisclosureIndicator;
};

function TableViewItem(props: TableViewItemProps) {
  return null;
}

TableViewItem.n = 'TableViewItem';

TableView.Item = TableViewItem;

export default TableView;
