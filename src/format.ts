export const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
export const plural = (n: number, a: string, b: string, c: string) => {
  const m = n % 10, h = n % 100;
  return h > 10 && h < 20 ? c : m === 1 ? a : m > 1 && m < 5 ? b : c;
};
