import PLURALS from '../plurals';
import capitalizeAcronyms from './capitalizeAcronyms';
import toTitleCase from './toTitleCase';

export default function getHumanName(
  type: string,
  { plural, titleCase }: { plural?: boolean; titleCase?: boolean } = {
    plural: false,
    titleCase: false,
  },
) {
  let name = type;

  if (plural) {
    name = PLURALS[name] || name + 's';
  }

  name = name.replace(/_/g, ' ');

  if (titleCase) {
    name = toTitleCase(name);
  }

  return capitalizeAcronyms(name);
}
