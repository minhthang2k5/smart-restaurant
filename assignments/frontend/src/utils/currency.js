/**
 * Format a number as Vietnamese Dong (VND)
 * @param {number|string} value - The value to format
 * @param {boolean} showSymbol - Whether to show the currency symbol (default: true)
 * @returns {string} Formatted currency string
 * 
 * Examples:
 * formatVND(100000) => "100.000 ₫"
 * formatVND(1500000) => "1.500.000 ₫"
 * formatVND(1500000, false) => "1.500.000"
 */
export const formatVND = (value, showSymbol = true) => {
  const num = Number(value || 0);
  
  // Format with dot as thousand separator
  const formatted = num.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return showSymbol ? `${formatted} VNĐ` : formatted;
};

/**
 * Short alias for formatVND
 */
export const formatMoney = formatVND;

/**
 * Format price for display in cards/lists
 */
export const formatPrice = (price) => formatVND(price);
