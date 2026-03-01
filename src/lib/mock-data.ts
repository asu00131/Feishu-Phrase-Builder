import { TableData } from './types';

/**
 * 核心 CSV 解析逻辑，支持从字符串直接解析
 */
export function parseCSVContent(text: string): TableData[] {
  // 简单的 CSV 解析器，处理引号中的逗号
  const parseCSVLine = (line: string) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  
  return lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const obj: TableData = { id: idx.toString() };
    headers.forEach((header, i) => {
      if (header) {
        obj[header] = values[i] || '';
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
