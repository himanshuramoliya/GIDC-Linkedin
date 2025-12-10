import DOMPurify from 'dompurify';

const sanitizeOptions = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

export const sanitizeText = (value = '') => {
  if (!value) return '';
  return DOMPurify.sanitize(String(value), sanitizeOptions).trim();
};

export const sanitizeRichText = (value = '') => {
  if (!value) return '';
  return DOMPurify.sanitize(String(value));
};

export const sanitizeFormFields = (fields = {}) => {
  return Object.entries(fields).reduce((acc, [key, val]) => {
    if (val === null || val === undefined) {
      acc[key] = val;
      return acc;
    }

    if (typeof val === 'string') {
      acc[key] = sanitizeText(val);
    } else {
      acc[key] = val;
    }
    return acc;
  }, {});
};

export const isValidEmail = (email = '') => {
  const sanitizedEmail = sanitizeText(email).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail);
};

export const sanitizeUserProfile = (user = {}) => {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const sanitized = {
    id: sanitizeText(user.id),
    name: sanitizeText(user.name),
    email: sanitizeText(user.email),
    phone: sanitizeText(user.phone),
    photo: sanitizeText(user.photo),
    role: sanitizeText(user.role) || 'employee',
  };

  // Add role-specific fields
  if (user.role === 'employer') {
    sanitized.companyName = sanitizeText(user.companyName);
    sanitized.companyLocation = sanitizeText(user.companyLocation);
    sanitized.companyDescription = sanitizeText(user.companyDescription);
  } else if (user.role === 'employee') {
    sanitized.experiences = Array.isArray(user.experiences) 
      ? user.experiences.map(exp => ({
          company: sanitizeText(exp.company),
          position: sanitizeText(exp.position),
          years: typeof exp.years === 'number' ? exp.years : parseFloat(exp.years) || 0
        }))
      : [];
  }

  return sanitized;
};

export const categorizeError = (err) => {
  if (!err) {
    return { type: 'unknown', message: 'Something went wrong.' };
  }

  if (err.isAxiosError) {
    if (err.response) {
      const status = err.response.status;
      const serverMessage =
        err.response.data?.error ||
        err.response.data?.message ||
        'Server returned an error.';
      if (status >= 500) {
        return { type: 'server', message: serverMessage };
      }
      if (status === 400 || status === 422) {
        return { type: 'validation', message: serverMessage };
      }
      if (status === 401 || status === 403) {
        return { type: 'auth', message: 'Please log in again.' };
      }
      return { type: 'client', message: serverMessage };
    }

    if (err.request) {
      return {
        type: 'network',
        message: 'Network error. Check your connection and try again.',
      };
    }
  }

  return {
    type: 'unknown',
    message: err.message || 'Unexpected error occurred.',
  };
};

