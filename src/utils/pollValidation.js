import { i18n } from '../i18n/index.js';

/**
 * Poll Validation Utility
 * Client-side validation for poll creation
 */

/**
 * Validate poll data before submission
 * @param {Object} pollData - The poll data to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validatePoll(pollData) {
  const errors = {};

  // Question is required
  if (!pollData.question || pollData.question.trim() === '') {
    errors.question = i18n.t('createPoll.validation.questionRequired');
  }

  // Validate based on poll type
  switch (pollData.kind) {
    case 'single_choice':
    case 'multiple_choice':
      errors.options = validateOptions(pollData.options);
      break;

    case 'numeric':
      errors.numeric = validateNumeric(pollData.minValue, pollData.maxValue);
      break;

    case 'rating':
      // Rating polls auto-generate options, no validation needed
      break;

    default:
      errors.kind = 'Invalid poll type';
  }

  // Remove undefined/null error entries
  Object.keys(errors).forEach(key => {
    if (!errors[key]) {
      delete errors[key];
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate options for choice-based polls
 * @param {Array} options - Array of option strings
 * @returns {string|null} Error message or null if valid
 */
function validateOptions(options) {
  if (!options || !Array.isArray(options)) {
    return i18n.t('createPoll.validation.minTwoOptions');
  }

  // Filter out empty options — only non-empty ones count
  const nonEmptyOptions = options.filter(opt => opt && opt.trim() !== '');

  // Must have at least 2 non-empty options
  if (nonEmptyOptions.length < 2) {
    return i18n.t('createPoll.validation.minTwoOptions');
  }

  return null;
}

/**
 * Validate numeric min/max values
 * @param {number|null} min - Minimum value
 * @param {number|null} max - Maximum value
 * @returns {string|null} Error message or null if valid
 */
function validateNumeric(min, max) {
  // Both can be null (no constraints)
  if (min === null && max === null) {
    return null;
  }

  // If both are set, min must be less than max
  if (min !== null && max !== null) {
    if (min >= max) {
      return i18n.t('createPoll.validation.minLessThanMax');
    }
  }

  return null;
}

/**
 * Validate a single field in real-time
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @param {Object} context - Additional context for validation
 * @returns {string|null} Error message or null if valid
 */
export function validateField(fieldName, value, context = {}) {
  switch (fieldName) {
    case 'question':
      if (!value || value.trim() === '') {
        return i18n.t('createPoll.validation.questionRequired');
      }
      break;

    case 'options':
      return validateOptions(value);

    case 'numeric':
      return validateNumeric(context.min, context.max);

    default:
      return null;
  }

  return null;
}

/**
 * Check if poll can be published (stricter than draft validation)
 * @param {Object} pollData - The poll data to validate
 * @returns {Object} { canPublish: boolean, errors: Object, warnings: Array }
 */
export function validateForPublish(pollData) {
  const baseValidation = validatePoll(pollData);
  const warnings = [];

  // Additional publish-specific checks
  if (!pollData.description || pollData.description.trim() === '') {
    warnings.push('Consider adding a description to provide context');
  }

  if (pollData.kind === 'numeric') {
    if (pollData.minValue === null && pollData.maxValue === null) {
      warnings.push(i18n.t('createPoll.validation.maxRequired'));
    }
  }

  if (!pollData.endDate) {
    warnings.push('Consider setting an end date for your poll');
  }

  return {
    canPublish: baseValidation.isValid,
    errors: baseValidation.errors,
    warnings
  };
}

/**
 * Sanitize poll data before submission
 * @param {Object} pollData - The poll data to sanitize
 * @returns {Object} Sanitized poll data
 */
export function sanitizePollData(pollData) {
  const mapResultsVisibilityToDb = (value) => {
    if (value === 'owner_only') return 'creator_only';
    if (value === 'after_close') return 'always';
    return value || 'after_vote';
  };

  const sanitized = {
    question: pollData.question?.trim() || '',
    description: pollData.description?.trim() || null,
    kind: pollData.kind,
    visibility: pollData.visibility || 'public',
    results_visibility: mapResultsVisibilityToDb(pollData.resultsVisibility),
    theme: pollData.theme || 'default',
    ends_at: pollData.endDate || null
  };

  // Handle options based on poll type
  switch (pollData.kind) {
    case 'single_choice':
    case 'multiple_choice':
      sanitized.options = pollData.options
        .filter(opt => opt && opt.trim() !== '')
        .map(opt => opt.trim());
      break;

    case 'rating':
      // Auto-generate 5 options
      sanitized.options = ['1', '2', '3', '4', '5'];
      break;

    case 'numeric':
      sanitized.minValue = pollData.minValue;
      sanitized.maxValue = pollData.maxValue;
      sanitized.options = []; // Numeric polls don't have options
      break;
  }

  return sanitized;
}
