export default function randomHex(length = 5) {
  return new Array(length).join().replace(/(.|$)/g, function () {
    // eslint-disable-next-line no-bitwise
    return ((Math.random() * 36) | 0).toString(36);
  });
}
