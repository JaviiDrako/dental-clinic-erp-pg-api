export const ITEMS_PER_PAGE = 50;

export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] {
  const delta = Math.floor(maxVisible / 2);
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  let l: number;
  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
}
