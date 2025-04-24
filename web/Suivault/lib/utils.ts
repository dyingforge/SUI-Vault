import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 创建一个灵活的时间格式化函数
export const formatTimestamp = (timestamp: number | string): string => {
  // 如果输入是无效值，返回默认文本
  if (timestamp === undefined || timestamp === null) {
    return '未知时间';
  }

  // 将时间戳转换为数字
  const timeNum = Number(timestamp);
  
  // 检查是否为有效数字
  if (isNaN(timeNum)) {
    console.error('无效的时间戳值:', timestamp);
    return '无效时间';
  }
  
  // 检查时间戳范围来确定合适的转换方式
  try {
    if (timeNum > 10000000000000) { // 微秒级 (非常大的数字)
      return new Date(timeNum / 1000).toLocaleDateString();
    } else if (timeNum > 10000000000) { // 毫秒级 (13位数字)
      return new Date(timeNum).toLocaleDateString();
    } else if (timeNum > 10000000) { // 秒级 (10位数字)
      return new Date(timeNum * 1000).toLocaleDateString();
    } else {
      // 可能是天数或者其他单位，尝试合理转换
      // 假设是从2000年开始的天数
      const baseDate = new Date('2000-01-01').getTime();
      return new Date(baseDate + (timeNum * 86400000)).toLocaleDateString();
    }
  } catch (error) {
    console.error('时间戳转换错误:', error, timestamp);
    return '时间错误';
  }
};

// 金额格式化函数
export const formatAmount = (amount: string | number, decimals: number = 2): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (value / 1000000000).toFixed(decimals);
};