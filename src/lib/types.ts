export type TableData = {
  id: string;
  [key: string]: any;
};

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig = {
  key: string | null;
  direction: SortDirection;
};
