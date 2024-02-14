export default function titleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}
