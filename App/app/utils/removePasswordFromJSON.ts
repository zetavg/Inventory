export default function removePasswordFromJSON(str: string) {
  return str.replace(
    /([Pp]assword": ?").*(",?)$/gim,
    (...[, a, b]) => `${a}********${b}`,
  );
}
