import React from 'react';

import UIGroup from '@app/components/UIGroup';

type Props = {
  perPage: number;
  page: number;
  numberOfPages: number;
  setPerPage: React.Dispatch<React.SetStateAction<number>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  perPageOptions?: ReadonlyArray<number>;
  textInputProps?: React.ComponentProps<typeof UIGroup.ListTextInputItem>;
  footer?: string;
};

const DEFAULT_PER_PAGE_OPTIONS = [20, 50, 100, 500];

export default function UIGroupPaginator({
  perPage,
  page,
  numberOfPages,
  setPerPage,
  setPage,
  perPageOptions,
  textInputProps,
  footer,
}: Props) {
  return (
    <UIGroup footer={footer}>
      <UIGroup.ListTextInputItem
        label="Page"
        horizontalLabel
        keyboardType="number-pad"
        returnKeyType="done"
        value={page.toString()}
        unit={`/ ${numberOfPages}`}
        onChangeText={t => {
          const n = parseInt(t, 10);
          if (isNaN(n)) return;
          if (n <= 0) return;

          setPage(n);
        }}
        selectTextOnFocus
        controlElement={
          <>
            <UIGroup.ListTextInputItem.Button
              onPress={() =>
                setPage(i => {
                  if (i <= 1) return i;
                  if (i > numberOfPages) return numberOfPages;
                  return i - 1;
                })
              }
              disabled={page <= 1}
            >
              ‹ Prev
            </UIGroup.ListTextInputItem.Button>
            <UIGroup.ListTextInputItem.Button
              onPress={() => setPage(i => i + 1)}
              disabled={page >= numberOfPages}
            >
              Next ›
            </UIGroup.ListTextInputItem.Button>
          </>
        }
        {...textInputProps}
      />
      <UIGroup.ListItemSeparator />
      <UIGroup.ListTextInputItem
        label="Per Page"
        horizontalLabel
        keyboardType="number-pad"
        returnKeyType="done"
        value={perPage.toString()}
        onChangeText={t => {
          const n = parseInt(t, 10);
          if (isNaN(n)) return;
          if (n <= 0) return;

          setPerPage(n);
        }}
        selectTextOnFocus
        controlElement={
          <>
            {(perPageOptions || DEFAULT_PER_PAGE_OPTIONS).map((n, i) => (
              <UIGroup.ListTextInputItem.Button
                key={i}
                onPress={() => setPerPage(n)}
              >
                {n.toString()}
              </UIGroup.ListTextInputItem.Button>
            ))}
          </>
        }
        {...textInputProps}
      />
    </UIGroup>
  );
}
