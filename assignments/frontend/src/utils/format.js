export const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return `$${value ?? "0.00"}`;
  return `$${num.toFixed(2)}`;
};

export const formatNumber = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? "0");
  return new Intl.NumberFormat().format(num);
};
