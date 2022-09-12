export default function moveItemInArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const arrayWithoutMovedItem = array.filter((_, i) => i !== fromIndex);
  return [
    ...arrayWithoutMovedItem.slice(0, toIndex),
    array[fromIndex],
    ...arrayWithoutMovedItem.slice(toIndex),
  ];
}
