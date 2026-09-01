export interface LateFeeResult {
  daysLate: number;
  lateFee: number;
}

export function calculateLateFee(
  dueDate: string | Date,
  dailyPenalty: number,
  currentDate: Date = new Date(),
): LateFeeResult {
  const due = new Date(dueDate);

  due.setHours(0, 0, 0, 0);

  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  if (today <= due) {
    return {
      daysLate: 0,
      lateFee: 0,
    };
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const daysLate = Math.floor(
    (today.getTime() - due.getTime()) / millisecondsPerDay,
  );

  return {
    daysLate,
    lateFee: daysLate * dailyPenalty,
  };
}