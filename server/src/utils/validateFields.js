/**
 * Validates if required fields exist in a given object.
 * @param {Object} data - The object to check (usually req.body)
 * @param {Array} requiredFields - List of keys that must exist and have values
 * @returns {Object} - { isValid: boolean, missingFields: Array }
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter((field) => {
    // Checks if the field is missing, null, or an empty string
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields,
  };
};

