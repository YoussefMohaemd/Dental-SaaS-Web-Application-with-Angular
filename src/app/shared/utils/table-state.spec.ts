import {
  filterTableRows,
  paginateTableRows,
  sortTableRows,
  tableTotalPages,
  visibleTablePages,
} from './table-state';

describe('table-state helpers', () => {
  it('sorts rows with the existing string comparison semantics', () => {
    const rows = [{ name: 'Zoe' }, { name: 'Alice' }, { name: 'Mia' }];

    expect(sortTableRows(rows, 'name', 'asc').map(row => row.name)).toEqual(['Alice', 'Mia', 'Zoe']);
    expect(sortTableRows(rows, 'name', 'desc').map(row => row.name)).toEqual(['Zoe', 'Mia', 'Alice']);
  });

  it('filters rows across configured fields case-insensitively', () => {
    const rows = [
      { name: 'Alice', clinic: 'Bright Smile' },
      { name: 'Mia', clinic: 'Harbor Dental' },
    ];

    expect(filterTableRows(rows, 'BRIGHT', [row => row.name, row => row.clinic])).toEqual([rows[0]]);
    expect(filterTableRows(rows, '', [row => row.name])).toEqual(rows);
  });

  it('returns a shallow copy when filtering with an empty query', () => {
    const rows = [{ name: 'Alice' }];

    const filtered = filterTableRows(rows, '   ', [row => row.name]);

    expect(filtered).toEqual(rows);
    expect(filtered).not.toBe(rows);
  });

  it('paginates rows using one-based page numbers', () => {
    expect(paginateTableRows([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginateTableRows([1, 2, 3, 4, 5], 4, 2)).toEqual([]);
  });

  it('preserves zero pages for empty datasets', () => {
    expect(tableTotalPages(0, 10)).toBe(0);
    expect(visibleTablePages(0, 1)).toEqual([]);
  });

  it('limits visible page numbers to five around the current page', () => {
    expect(visibleTablePages(10, 6)).toEqual([4, 5, 6, 7, 8]);
    expect(visibleTablePages(3, 2)).toEqual([1, 2, 3]);
  });
});
