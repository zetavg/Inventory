import React from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import schema from '@app/db/schema';
import titleCase from '@app/utils/titleCase';
import objectEntries from '@app/utils/objectEntries';

function RelationalPouchDBScreen({
  navigation,
}: StackScreenProps<StackParamList, 'RelationalPouchDB'>) {
  return (
    <ScreenContent navigation={navigation} title="Relational PouchDB">
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup label="Types">
          {objectEntries(schema)
            .flatMap(([type, typeDef]) => [
              <InsetGroup.Item
                key={type}
                label={titleCase(typeDef.plural)}
                arrow
                onPress={() =>
                  navigation.push('RelationalPouchDBType', { type })
                }
              />,
              <InsetGroup.ItemSeperator key={`s-${type}`} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Fix Data Consistency"
            arrow
            onPress={() =>
              navigation.push('RelationalPouchDBFixDataConsistency')
            }
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default RelationalPouchDBScreen;
