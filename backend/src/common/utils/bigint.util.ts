export function toNumber(value: bigint | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'bigint' ? Number(value) : value;
}
