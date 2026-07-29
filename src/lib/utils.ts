export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatVersion(version: string): string {
  return `v${version}`;
}
