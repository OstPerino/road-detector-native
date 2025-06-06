import { ColorLegend } from '../types';

export const COLOR_LEGENDS: ColorLegend[] = [
  {
    color: '#ff4444', // Красный
    minPercentage: 0,
    maxPercentage: 20,
    label: 'Очень плохое покрытие'
  },
  {
    color: '#ff8800', // Оранжевый
    minPercentage: 20,
    maxPercentage: 40,
    label: 'Плохое покрытие'
  },
  {
    color: '#ffff00', // Желтый
    minPercentage: 40,
    maxPercentage: 60,
    label: 'Среднее покрытие'
  },
  {
    color: '#88ff88', // Светло-зеленый
    minPercentage: 60,
    maxPercentage: 80,
    label: 'Хорошее покрытие'
  },
  {
    color: '#00aa00', // Зеленый
    minPercentage: 80,
    maxPercentage: 100,
    label: 'Отличное покрытие'
  }
];

export const getColorForCoverage = (coverage: number): string => {
  const legend = COLOR_LEGENDS.find(
    (item) => coverage >= item.minPercentage && coverage <= item.maxPercentage
  );
  return legend ? legend.color : '#888888'; // Серый по умолчанию
};

export const getColorLegendForCoverage = (coverage: number): ColorLegend | null => {
  return COLOR_LEGENDS.find(
    (item) => coverage >= item.minPercentage && coverage <= item.maxPercentage
  ) || null;
}; 