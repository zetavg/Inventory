import React from 'react';

import { Button as PaperButton } from 'react-native-paper';

import type { Optional } from '@app/utils/types';

type Props = { title?: string } & Optional<
  React.ComponentProps<typeof PaperButton>,
  'children'
>;

function Button({ title, mode = 'text', ...props }: Props) {
  return (
    <PaperButton
      {...props}
      mode={mode}
      children={props.children || title || null}
    />
  );
}

export default Button;
