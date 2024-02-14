import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { FormatStyleName } from 'javascript-time-ago';

import timeAgo from '@app/utils/timeAgo';

type Props = {
  date: Date | number;
  style?: FormatStyleName;
  interval?: number;
  textProps?: React.ComponentProps<typeof Text>;
};

export default function TimeAgo({
  date,
  style = 'round',
  interval = 5000,
  textProps,
}: Props) {
  const [_, setState] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setState(v => !v);
    }, interval);
    return () => {
      clearInterval(timer);
    };
  }, [interval]);

  const t = timeAgo.format(date, style);
  return <Text {...textProps}>{t}</Text>;
}
