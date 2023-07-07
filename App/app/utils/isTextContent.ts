export default function isTextContent(v: unknown) {
  const type = typeof v;
  if (type === 'string' || type === 'number') return true;

  return false;
}
