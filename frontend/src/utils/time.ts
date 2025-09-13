export function timeAgo(date: Date | string | number): string {
  const now = new Date();
  const given = new Date(date);
  const seconds = Math.floor((now.getTime() - given.getTime()) / 1000);

  const intervals: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"], // approx weeks in a month
    [12, "month"],
    [Number.MAX_SAFE_INTEGER, "year"],
  ];

  let counter = seconds;
  for (let i = 0; i < intervals.length; i++) {
    const [interval, label] = intervals[i];
    if (counter < interval) {
      const value = Math.floor(counter);
      if (value <= 1) {
        if (label === "day" && value === 1) return "yesterday";
        return `1 ${label} ago`;
      }
      return `${value} ${label}${value > 1 ? "s" : ""} ago`;
    }
    counter /= interval;
  }
  return given.toLocaleDateString(); // fallback
}

export function timeUntil(date: Date | string | number): string {
  const now = new Date();
  const target = new Date(date);
  const seconds = Math.floor((target.getTime() - now.getTime()) / 1000);

  if (seconds <= 0) return "already passed";

  const intervals: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"], // approx weeks in a month
    [12, "month"],
    [Number.MAX_SAFE_INTEGER, "year"],
  ];

  let counter = seconds;
  for (let i = 0; i < intervals.length; i++) {
    const [interval, label] = intervals[i];
    if (counter < interval) {
      const value = Math.floor(counter);
      return value === 1
        ? `1 ${label}`
        : `${value} ${label}s`;
    }
    counter /= interval;
  }

  return target.toLocaleDateString(); // fallback
}
