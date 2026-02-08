export function parseCurrency(value) {
  if (value == null) return 0;
  const s = String(value);
  const cleaned = s.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function formatCurrency(number) {
  if (number == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
}
