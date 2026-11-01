export function PartialType<T>(classRef: new () => T): new () => T {
  return classRef;
}
