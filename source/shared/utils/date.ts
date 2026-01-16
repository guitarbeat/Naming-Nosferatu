export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "Invalid Date";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}
