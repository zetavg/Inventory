import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import UIGroup from '@app/components/UIGroup';

import UIGroupPaginator from './UIGroupPaginator';

export function Basic() {
  const uiGroupStyles = UIGroup.useStyles();

  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const itemsCount = 300;
  const numberOfPages = Math.ceil(itemsCount / perPage);

  const offset = perPage * (page - 1);
  const limit = perPage;

  return (
    <ScrollView
      style={uiGroupStyles.container}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <UIGroup.FirstGroupSpacing />

      <UIGroup>
        <UIGroup.ListItem label="Items Count" detail={itemsCount} />
        <UIGroup.ListItemSeparator />
        <UIGroup.ListItem label="Page" detail={page} />
      </UIGroup>

      <UIGroupPaginator
        perPage={perPage}
        page={page}
        numberOfPages={numberOfPages}
        setPerPage={setPerPage}
        setPage={setPage}
        footer={`Offset: ${offset}, limit: ${limit}.`}
      />
    </ScrollView>
  );
}
