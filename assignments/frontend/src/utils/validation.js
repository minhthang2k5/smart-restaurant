/**
 * Validation utilities for forms
 */

/**
 * Validate table number format
 * @param {string} tableNumber
 * @returns {boolean}
 */
export const isValidTableNumber = (tableNumber) => {
  if (!tableNumber) return false;

  // Allow: T-01, VIP-A, TABLE-001, etc.
  const pattern = /^[A-Z0-9-]+$/i;
  return (
    pattern.test(tableNumber) &&
    tableNumber.length >= 2 &&
    tableNumber.length <= 20
  );
};

/**
 * Validate capacity
 * @param {number} capacity
 * @returns {boolean}
 */
export const isValidCapacity = (capacity) => {
  return Number.isInteger(capacity) && capacity >= 1 && capacity <= 20;
};

/**
 * Validate location
 * @param {string} location
 * @returns {boolean}
 */
export const isValidLocation = (location) => {
  if (!location) return false;
  return location.length >= 2 && location.length <= 100;
};

/**
 * Form validation rules for Ant Design
 */
export const tableFormRules = {
  tableNumber: [
    { required: true, message: "Please input table number!" },
    {
      pattern: /^[A-Z0-9-]+$/i,
      message: "Only letters, numbers and hyphens allowed",
    },
    {
      min: 2,
      max: 20,
      message: "Table number must be between 2 and 20 characters",
    },
  ],

  capacity: [
    { required: true, message: "Please input capacity!" },
    {
      type: "number",
      min: 1,
      max: 20,
      message: "Capacity must be between 1 and 20",
    },
  ],

  location: [
    { required: true, message: "Please select location!" },
    {
      min: 2,
      max: 100,
      message: "Location must be between 2 and 100 characters",
    },
  ],

  description: [
    {
      max: 500,
      message: "Description cannot exceed 500 characters",
    },
  ],
};

/**
 * Sanitize user input
 * @param {string} input
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * Check if string is empty or only whitespace
 * @param {string} str
 * @returns {boolean}
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};
