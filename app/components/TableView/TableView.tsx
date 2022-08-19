import Color from 'color';
import React, { useRef, useCallback } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Checkbox, RadioButton, Divider, List, Switch, useTheme } from 'react-native-paper';
import TableViewIOS from './TableViewIOS';

type Insets = {
  bottom: number;
};

type Props = {
  children: React.ReactNode;
  contentInsets?: Insets;
  contentInset?: Insets;
  scrollIndicatorInsets?: Insets;
  style?: React.ComponentProps<typeof ScrollView>['style'];
  scrollViewRef?: any;
  iosStyle?: 'plain' | 'grouped' | 'inset-grouped';
};

function TableView({
  children,
  contentInsets,
  contentInset,
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
        contentInset={contentInsets || contentInset}
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

  return (
    <ScrollView
      children={children}
      automaticallyAdjustContentInsets
      automaticallyAdjustsScrollIndicatorInsets
      contentInset={contentInsets || contentInset}
      scrollIndicatorInsets={scrollIndicatorInsets}
      style={style}
    />
  );
}

type TableViewSectionProps = {
  label?: string;
  footerLabel?: string;
  children: React.ReactNode;
};

const SECTION_PADDING = 0;

function TableViewSection({
  label,
  footerLabel,
  children,
}: TableViewSectionProps) {
  return (
    <View style={{ paddingTop: SECTION_PADDING }}>
      {label && (
        <List.Subheader
          style={{
            textTransform: 'uppercase',
            opacity: 0.6,
            fontSize: 12,
            fontWeight: '700',
            marginTop: 8 - SECTION_PADDING,
            marginBottom: -4,
          }}
        >
          {label}
        </List.Subheader>
      )}
      {children}
      {footerLabel && (
        <List.Subheader
          style={{
            opacity: 0.6,
            fontSize: 12,
            marginTop: -2,
          }}
        >
          {footerLabel}
        </List.Subheader>
      )}
      <Divider style={{ marginTop: SECTION_PADDING }} />
    </View>
  );
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
  icon?: React.ComponentProps<typeof List.Icon>['icon'];
  iosImage?: any;
  onPress?: () => void;
  // accessoryType?: typeof TableView.Consts.DisclosureIndicator;
};

const ITEM_PADDING = 10;

function TableViewItem({
  children,
  label,
  detail,
  arrow,
  selected,
  switch: sw,
  switchValue,
  onSwitchChangeValue,
  icon,
  onPress,
}: TableViewItemProps) {
  const theme = useTheme();

  if (typeof selected === 'boolean') {
    return (
      <RadioButton.Item
        style={[
          { paddingVertical: ITEM_PADDING },
          onPress ? {} : { opacity: 0.6 },
        ]}
        label={label || children || ''}
        onPress={onPress}
        status={selected ? 'checked' : 'unchecked'}
      />
    );
  }

  return (
    <List.Item
      style={[
        { paddingVertical: ITEM_PADDING },
        onPress || sw ? {} : { opacity: 0.7 },
      ]}
      title={label || children}
      description={
        detail && (
          <Text
            style={{
              color: Color(theme.colors.onSurface).alpha(0.5).rgb().string(),
            }}
          >
            {detail}
            {}
          </Text>
        )
      }
      onPress={
        onPress ||
        (sw
          ? () => onSwitchChangeValue && onSwitchChangeValue(!switchValue)
          : undefined)
      }
      left={icon ? props => <List.Icon {...props} icon={icon} /> : undefined}
      right={(() => {
        if (sw) {
          return () => (
            <Switch
              value={switchValue}
              onChange={() =>
                onSwitchChangeValue && onSwitchChangeValue(!switchValue)
              }
            />
          );
        }
        return undefined;
      })()}
    />
  );
}

TableViewItem.n = 'TableViewItem';

TableView.Item = TableViewItem;

export default TableView;
