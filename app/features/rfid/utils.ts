export function getTagAccessPassword(
  globalPassword: string,
  tagPassword: string,
  passwordEncoding: string,
) {
  const paddedPasswordEncoding = Array.from(new Array(8)).map((_, i) => {
    const n = parseInt(passwordEncoding[i], 16);
    if (isNaN(n)) return i;
    if (n < 0) return i;
    if (n >= 16) return i;

    return n;
  });

  const passwordStr =
    globalPassword.slice(0, 8).padEnd(8, '0') +
    tagPassword.slice(0, 8).padEnd(8, '0');

  return Array.from(new Array(8))
    .map((_, i) => passwordStr[paddedPasswordEncoding[i]])
    .join('');
}
