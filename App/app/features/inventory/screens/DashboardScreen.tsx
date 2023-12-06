import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import Color from 'color';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import { onlyValid, useData, useDataCount } from '@app/data';
import useView from '@app/data/hooks/useView';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useColors from '@app/hooks/useColors';

import Icon from '@app/components/Icon';
import ScreenContent from '@app/components/ScreenContent';
import { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import ItemListItem from '../components/ItemListItem';
import ItemListItemById from '../components/ItemListItemById';

function DashboardScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Dashboard'>) {
  const dispatch = useAppDispatch();
  const overallDBSyncStatus = useAppSelector(selectors.dbSync.overallStatus);

  const { count: itemsCount, reload: reloadItemsCount } = useDataCount(
    'item',
    {},
    {},
  );

  const { data: outOfStockItemsCount } = useView('out_of_stock_items_count');
  const { data: lowStockItemsCount } = useView('low_stock_items_count');

  const [nowDate, setNowDate] = useState(Date.now());
  const { data: expiredItemsData } = useView('expired_items', {
    descending: true,
    startKey: nowDate,
  });
  const expiredItemsCount = useMemo(() => {
    if (!expiredItemsData) return null;

    return expiredItemsData.length;
  }, [expiredItemsData]);
  const { data: expireSoonItemsData } = useView('expire_soon_items', {
    descending: true,
    startKey: nowDate,
  });
  const expireSoonItemsCount = useMemo(() => {
    if (!expiredItemsData) return null;
    if (!expireSoonItemsData) return null;

    return expireSoonItemsData.length - expiredItemsData.length;
  }, [expireSoonItemsData, expiredItemsData]);

  const { data: rfidUntaggedItemsCount } = useView('rfid_untagged_items_count');

  const { data: rfidTagOutdatedItemsCount } = useView(
    'rfid_tag_outdated_items_count',
  );

  const recentViewedItemIds = useAppSelector(
    selectors.inventory.recentViewedItemIds,
  );
  const { data: recentItems, refresh: refreshRecentItems } = useData(
    'item',
    {},
    { limit: 5, sort: [{ __updated_at: 'desc' }] },
  );
  const verifiedRecentItems = recentItems && onlyValid(recentItems);
  const hasItems = verifiedRecentItems && verifiedRecentItems.length > 0;

  useFocusEffect(
    useCallback(() => {
      setNowDate(Date.now());
    }, []),
  );

  const {
    contentBackgroundColor,
    contentTextColor,
    contentSecondaryTextColor,
  } = useColors();

  const dashboardGridItems = useMemo(() => {
    return [
      <TouchableHighlight
        key="items"
        onPress={() => navigation.push('Collections')}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        style={[
          styles.dashboardGridItem,
          { backgroundColor: contentBackgroundColor },
        ]}
      >
        <View style={commonStyles.flex1}>
          <View style={styles.dashboardGridItemIconAndNumber}>
            <Icon name="box" size={Platform.OS === 'ios' ? 24 : 24} />
            {typeof itemsCount === 'number' ? (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentTextColor },
                ]}
              >
                {itemsCount}
              </Text>
            ) : (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentSecondaryTextColor },
                ]}
              >
                Loading
              </Text>
            )}
          </View>
          <View style={styles.dashboardGridItemLabelContainer}>
            <Text
              style={[
                styles.dashboardGridItemLabel,
                { color: contentSecondaryTextColor },
              ]}
            >
              Items
            </Text>
          </View>
        </View>
      </TouchableHighlight>,
      <TouchableHighlight
        key="rfid"
        onPress={() => navigation.push('RFIDUntaggedItems')}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        style={[
          styles.dashboardGridItem,
          { backgroundColor: contentBackgroundColor },
        ]}
      >
        <View>
          <View style={styles.dashboardGridItemIconAndNumber}>
            <Icon
              name="app-untagged"
              color="teal"
              size={Platform.OS === 'ios' ? 20 : 24}
            />
            {typeof rfidUntaggedItemsCount === 'number' ? (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentTextColor },
                ]}
              >
                {rfidUntaggedItemsCount}
                {false && (rfidTagOutdatedItemsCount || 0) > 0 && (
                  <>
                    {' '}
                    <Text style={[{ color: contentSecondaryTextColor }]}>
                      / {rfidTagOutdatedItemsCount}
                    </Text>
                  </>
                )}
              </Text>
            ) : (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentSecondaryTextColor },
                ]}
              >
                Loading
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.dashboardGridItemLabel,
              { color: contentSecondaryTextColor },
            ]}
          >
            Untagged Items
          </Text>
        </View>
      </TouchableHighlight>,
      <TouchableHighlight
        key="stock"
        onPress={() => navigation.push('LowOrOutOfStockItems')}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        style={[
          styles.dashboardGridItem,
          { backgroundColor: contentBackgroundColor },
        ]}
      >
        <View>
          <View style={styles.dashboardGridItemIconAndNumber}>
            <Icon
              name="app-exclamation-circle"
              color="yellow"
              size={Platform.OS === 'ios' ? 28 : 24}
            />
            {typeof lowStockItemsCount === 'number' &&
            typeof outOfStockItemsCount === 'number' ? (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentTextColor },
                ]}
              >
                <Text style={[{ color: contentSecondaryTextColor }]}>
                  {lowStockItemsCount} /
                </Text>{' '}
                {outOfStockItemsCount}
              </Text>
            ) : (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentSecondaryTextColor },
                ]}
              >
                Loading
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.dashboardGridItemLabel,
              { color: contentSecondaryTextColor },
            ]}
          >
            Low/Out of Stock
          </Text>
        </View>
      </TouchableHighlight>,
      <TouchableHighlight
        key="expiry"
        onPress={() => navigation.push('ExpiredItems')}
        underlayColor={Color(contentTextColor).opaquer(-0.92).hexa()}
        style={[
          styles.dashboardGridItem,
          { backgroundColor: contentBackgroundColor },
        ]}
      >
        <View>
          <View style={styles.dashboardGridItemIconAndNumber}>
            <Icon
              name="app-calender"
              color="orange"
              size={Platform.OS === 'ios' ? 30 : 24}
            />
            {typeof expiredItemsCount === 'number' ? (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentTextColor },
                ]}
              >
                {expireSoonItemsCount && (
                  <Text style={[{ color: contentSecondaryTextColor }]}>
                    {expireSoonItemsCount}
                    {' / '}
                  </Text>
                )}
                {expiredItemsCount}
              </Text>
            ) : (
              <Text
                style={[
                  styles.dashboardGridItemNumber,
                  { color: contentSecondaryTextColor },
                ]}
              >
                Loading
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.dashboardGridItemLabel,
              { color: contentSecondaryTextColor },
            ]}
          >
            Expired Items
          </Text>
        </View>
      </TouchableHighlight>,
    ];
  }, [
    contentTextColor,
    contentBackgroundColor,
    itemsCount,
    contentSecondaryTextColor,
    rfidUntaggedItemsCount,
    rfidTagOutdatedItemsCount,
    lowStockItemsCount,
    outOfStockItemsCount,
    expiredItemsCount,
    expireSoonItemsCount,
    navigation,
  ]);

  const [dashboardGridWidth, setDashboardGridWidth] = useState<number | null>(
    null,
  );
  const handleDashboardGridLayout = useCallback((event: LayoutChangeEvent) => {
    setDashboardGridWidth(event.nativeEvent.layout.width);
  }, []);
  const dashboardGridItemPerRow = useMemo(
    () =>
      Math.max(
        1,
        Math.floor((dashboardGridWidth || 0) / DASHBOARD_GRID_ITEM_MIN_WIDTH),
      ),
    [dashboardGridWidth],
  );
  const dashboardGridLayoutReady = typeof dashboardGridWidth === 'number';

  return (
    <ScreenContent
      navigation={navigation}
      title="Dashboard"
      action1Label={
        overallDBSyncStatus !== 'Not Configured' ? 'Sync' : undefined
      }
      action1SFSymbolName={
        overallDBSyncStatus !== 'Not Configured' ? 'cloud.fill' : undefined
      }
      action1MaterialIconName={
        overallDBSyncStatus !== 'Not Configured' ? 'cloud' : undefined
      }
      onAction1Press={
        overallDBSyncStatus !== 'Not Configured'
          ? () => navigation.push('DBSync')
          : undefined
      }
      // headerRight={<IOSCloudSyncingIcon />}
    >
      <ScreenContent.ScrollView automaticallyAdjustKeyboardInsets={false}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup
          transparentBackground
          style={styles.dashboardGrid}
          onLayout={handleDashboardGridLayout}
          loading={!dashboardGridLayoutReady}
        >
          {dashboardGridLayoutReady &&
            dashboardGridItems
              .reduce((resultArray, item, index) => {
                // Check if current iteration needs a new subarray
                if (index % dashboardGridItemPerRow === 0)
                  resultArray.push([item]);
                else resultArray[resultArray.length - 1].push(item);

                return resultArray;
              }, [] as Array<Array<JSX.Element>>)
              .map((items, index) => (
                <View key={index} style={styles.dashboardGridRow}>
                  {items}
                </View>
              ))}
        </UIGroup>
        {hasItems ? (
          <>
            {recentViewedItemIds.length > 0 && (
              <UIGroup
                header="Recently Viewed"
                largeTitle
                headerRight={
                  <UIGroup.TitleButton
                    onPress={() =>
                      dispatch(actions.inventory.clearRecentViewedItemId())
                    }
                  >
                    Clear
                  </UIGroup.TitleButton>
                }
              >
                {UIGroup.ListItemSeparator.insertBetween(
                  recentViewedItemIds
                    .slice(0, 5)
                    .map(id => (
                      <ItemListItemById
                        key={id}
                        id={id}
                        onPress={() => navigation.push('Item', { id })}
                      />
                    )),
                  { forItemWithIcon: true },
                )}
              </UIGroup>
            )}
            {(verifiedRecentItems?.length || 0) > 0 && (
              <UIGroup header="Recently Changed" largeTitle>
                {UIGroup.ListItemSeparator.insertBetween(
                  verifiedRecentItems.map(it => (
                    <ItemListItem
                      key={it.__id}
                      item={it}
                      hideContentDetails
                      onPress={() =>
                        navigation.push('Item', { id: it.__id || '' })
                      }
                    />
                  )),
                  { forItemWithIcon: true },
                )}
                <UIGroup.ListItemSeparator />
                <UIGroup.ListItem
                  label="View More"
                  navigable
                  onPress={() =>
                    navigation.push('Items', {
                      conditions: {},
                      sortOptions: {
                        'Date Modified': [{ __updated_at: 'desc' }],
                      },
                    })
                  }
                />
              </UIGroup>
            )}
          </>
        ) : (
          <UIGroup style={styles.emptyGroup}>
            <Text
              style={[
                styles.emptyGroupText,
                { color: contentSecondaryTextColor },
              ]}
            >
              You don't have any items yet.
            </Text>
            <Text
              style={[
                styles.emptyGroupText,
                { color: contentSecondaryTextColor },
              ]}
            >
              Add your first item by creating an item in one of your{' '}
              <Link onPress={() => navigation.push('Collections')}>
                collections
              </Link>
              .
            </Text>
          </UIGroup>
        )}
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

const DASHBOARD_GRID_ITEM_MIN_WIDTH = 150;
const DASHBOARD_GRID_GAP = 16;

const styles = StyleSheet.create({
  dashboardGrid: {
    gap: DASHBOARD_GRID_GAP,
  },
  dashboardGridRow: {
    gap: DASHBOARD_GRID_GAP,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dashboardGridItem: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
  },
  dashboardGridItemIconAndNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardGridItemNumber: {
    flex: 1,
    textAlign: 'right',
    fontSize: 20,
    fontWeight: '500',
  },
  dashboardGridItemLabelContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dashboardGridItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyGroup: {
    padding: 16,
  },
  emptyGroupText: {
    flex: 1,
    marginVertical: 8,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default DashboardScreen;
