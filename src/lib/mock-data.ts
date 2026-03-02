import { TableData } from './types';

/**
 * 健壮的 CSV 解析器
 * 支持处理单元格内的换行符、逗号以及被双引号包裹的特殊内容
 */
export function parseCSVContent(text: string): TableData[] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  // 逐字符遍历，确保正确处理引号内的内容
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 处理 CSV 中的转义双引号 ""
        cell += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 单元格结束
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // 真正的行结束（非引号内换行）
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      // 过滤空行
      if (row.length > 0 && row.some(c => c !== '')) {
        result.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  // 处理最后剩余的内容
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 0 && row.some(c => c !== '')) {
      result.push(row);
    }
  }

  if (result.length < 2) return [];

  const headers = result[0];
  
  return result.slice(1).map((values, idx) => {
    const obj: TableData = { id: idx.toString() };
    headers.forEach((header, i) => {
      if (header) {
        // 移除多余的引号包裹并处理转义
        let val = values[i] || '';
        val = val.replace(/^"|"$/g, '').replace(/""/g, '"');
        obj[header] = val;
      }
    });
    return obj;
  });
}

/**
 * 远程获取 CSV 数据
 */
export async function fetchFeishuData(url?: string): Promise<TableData[]> {
  const targetUrl = url || 'https://raw.githubusercontent.com/asu00131/Feishu-Phrase-Builder/refs/heads/main/src/app/%E7%9B%B4%E6%92%AD%E8%AF%9D%E6%9C%AF_%E6%95%B0%E6%8D%AE%E8%A1%A8.csv';
  
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error('Failed to fetch CSV');
    const text = await response.text();
    return parseCSVContent(text);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return [];
  }
}
