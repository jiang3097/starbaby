import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取本周日期列表（周一到周日）
export function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; // 将周日的0转为7
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}
