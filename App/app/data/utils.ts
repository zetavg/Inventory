import { plurals } from './schema';

export function getHumanTypeName(
  type: string,
  { plural, titleCase }: { plural?: boolean; titleCase?: boolean } = {
    plural: false,
    titleCase: false,
  },
) {
  let name = type;

  if (plural) {
    name = (plurals as any)[name] || name;
  }

  name = name.replace(/_/g, ' ');

  if (titleCase) {
    name = toTitleCase(name);
  }

  return name;
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
