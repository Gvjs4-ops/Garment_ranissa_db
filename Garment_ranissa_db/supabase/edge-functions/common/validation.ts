export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequired(
  value: unknown,
  field: string
): string | null {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return `${field} is required.`;
  }

  return null;
}

export function validateUUID(
  value: string,
  field: string
): string | null {

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return `${field} must be a valid UUID.`;
  }

  return null;
}

export function validatePositiveNumber(
  value: number,
  field: string
): string | null {

  if (typeof value !== "number" || value <= 0) {
    return `${field} must be greater than zero.`;
  }

  return null;
}

export function validateNonNegativeNumber(
  value: number,
  field: string
): string | null {

  if (typeof value !== "number" || value < 0) {
    return `${field} cannot be negative.`;
  }

  return null;
}

export function validateDate(
  value: string,
  field: string
): string | null {

  if (isNaN(Date.parse(value))) {
    return `${field} is not a valid date.`;
  }

  return null;
}

export function validateLength(
  value: string,
  field: string,
  min: number,
  max: number
): string | null {

  if (value.length < min || value.length > max) {
    return `${field} must be between ${min} and ${max} characters.`;
  }

  return null;
}

export function validateEmail(
  value: string,
  field = "Email"
): string | null {

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(value)) {
    return `${field} is invalid.`;
  }

  return null;
}

export function validateArrayNotEmpty<T>(
  value: T[],
  field: string
): string | null {

  if (!Array.isArray(value) || value.length === 0) {
    return `${field} cannot be empty.`;
  }

  return null;
}

export function validateRequest(
  validations: Array<string | null>
): ValidationResult {

  const errors = validations.filter(
    (v): v is string => v !== null
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}