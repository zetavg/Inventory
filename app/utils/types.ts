/**
 * `Optional` takes two arguments, `T` is the type we want to base our optional
 * type, and `K` represents a set of keys that are available on the type `T`.
 *
 * https://stackoverflow.com/a/61108377/3416647
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
