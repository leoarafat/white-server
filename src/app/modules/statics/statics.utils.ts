export const getMonthName = (monthNumber: string) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const index = parseInt(monthNumber) - 1;
  return months[index];
};
export type TotalCountsResponse = {
  totalSongs: number;
  totalPendingSongs: number;
  totalApprovedSongs: number;
};
export const getStartAndEndOfWeek = (year: number, week: number) => {
  const firstDayOfYear = new Date(year, 0, 1);
  const firstThursday = new Date(
    firstDayOfYear.setDate(
      firstDayOfYear.getDate() + (4 - firstDayOfYear.getDay()),
    ),
  );
  const startOfWeek = new Date(
    firstThursday.setDate(firstThursday.getDate() + (week - 1) * 7 - 3),
  );
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { startOfWeek, endOfWeek };
};
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

function getLastNMonths(year: any, month: any, n: any) {
  const months = [];
  for (let i = 1; i <= n; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    months.push(`${y}/${m.toString().padStart(2, '0')}`);
  }
  return months;
}

export const lastFiveMonths = getLastNMonths(currentYear, currentMonth, 12);
