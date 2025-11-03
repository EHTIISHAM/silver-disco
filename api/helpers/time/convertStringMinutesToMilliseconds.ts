export default function convertStringMinutesToMilliseconds(
  timeString: string
): number {
  const match = timeString.match(/(\d+) (minutes?)/);

  if (!match) {
    throw new Error(`Invalid time string: ${timeString}`);
  }

  const [, value, unit] = match;
  const valueInMinutes = parseInt(value);

  if (unit === "minutes") {
    return valueInMinutes * 60 * 1000;
  } else {
    return valueInMinutes * 1000;
  }
}
