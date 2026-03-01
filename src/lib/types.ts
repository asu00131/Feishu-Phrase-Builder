export interface TableData {
  id: string;
  projectName: string;
  status: '进行中' | '已完成' | '未开始' | '延迟';
  owner: string;
  startDate: string;
  endDate: string;
  priority: '高' | '中' | '低';
  progress: number;
}

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig = {
  key: keyof TableData | null;
  direction: SortDirection;
};