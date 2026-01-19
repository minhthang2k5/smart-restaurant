import { formatVND } from "./currency";

export const formatMoney = (value) => {
  return formatVND(value);
};

export const formatNumber = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? "0");
  return new Intl.NumberFormat().format(num);
};
