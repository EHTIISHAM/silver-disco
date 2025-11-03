export function buildTimeFilter(time?: string, customFrom?: string, customTo?: string) {
  if (!time || time === "all") return {};

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  switch (time) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "90days":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
    if (customFrom && customTo) {
      startDate = new Date(customFrom);
      endDate = new Date(customTo);

      // 👇 end date ko din ke end pe set kar do (23:59:59.999)
      endDate.setHours(23, 59, 59, 999);
    }
    break;

  }

  if (startDate && endDate) {
    return { datePlayed: { $gte: startDate, $lt: endDate } };
  } else if (startDate) {
    return { datePlayed: { $gte: startDate } };
  }

  return {};
}
