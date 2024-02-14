export default function humanFileSize(size: number) {
  let i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1000));
  return (
    Number((size / Math.pow(1000, i)).toFixed(2)) * 1 +
    ' ' +
    ['B', 'KB', 'MB', 'GB', 'TB'][i]
  );
}
