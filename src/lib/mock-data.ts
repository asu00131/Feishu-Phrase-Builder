import { TableData } from './types';

export async function fetchFeishuData(): Promise<TableData[]> {
  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      id: '1',
      projectName: '企业官网 2.0 升级',
      status: '进行中',
      owner: '张伟',
      startDate: '2024-03-01',
      endDate: '2024-05-15',
      priority: '高',
      progress: 45,
    },
    {
      id: '2',
      projectName: 'CRM 系统数据迁移',
      status: '已完成',
      owner: '李芳',
      startDate: '2024-01-10',
      endDate: '2024-02-28',
      priority: '中',
      progress: 100,
    },
    {
      id: '3',
      projectName: '市场营销季度分析报告',
      status: '未开始',
      owner: '王明',
      startDate: '2024-04-01',
      endDate: '2024-04-10',
      priority: '低',
      progress: 0,
    },
    {
      id: '4',
      projectName: '移动端应用性能优化',
      status: '延迟',
      owner: '赵雷',
      startDate: '2024-02-15',
      endDate: '2024-03-20',
      priority: '高',
      progress: 75,
    },
    {
      id: '5',
      projectName: '新员工入职培训手册',
      status: '进行中',
      owner: '孙悦',
      startDate: '2024-03-10',
      endDate: '2024-03-30',
      priority: '中',
      progress: 60,
    },
    {
      id: '6',
      projectName: '供应链管理系统研发',
      status: '进行中',
      owner: '周洋',
      startDate: '2024-02-01',
      endDate: '2024-08-30',
      priority: '高',
      progress: 30,
    },
    {
      id: '7',
      projectName: '年度财务审计',
      status: '未开始',
      owner: '吴梅',
      startDate: '2024-05-01',
      endDate: '2024-06-15',
      priority: '高',
      progress: 0,
    },
    {
      id: '8',
      projectName: '客户满意度调查',
      status: '已完成',
      owner: '郑洁',
      startDate: '2024-01-01',
      endDate: '2024-01-20',
      priority: '中',
      progress: 100,
    },
  ];
}