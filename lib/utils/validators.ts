export interface ScholarshipFormData {
  title: string;
  description: string;
  purpose: string;
  eligibilityCriteria: string;
  sponsorName: string;
  sponsorDetails: string;
  amount: string | number;
  academicYear: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateScholarshipForm(data: ScholarshipFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title.trim()) {
    errors.title = 'Scholarship title is required';
  } else if (data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  }

  if (!data.purpose.trim()) {
    errors.purpose = 'Purpose is required';
  }

  if (!data.eligibilityCriteria.trim()) {
    errors.eligibilityCriteria = 'Eligibility criteria is required';
  }

  if (!data.sponsorName.trim()) {
    errors.sponsorName = 'Sponsor name is required';
  }

  const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number';
  }

  if (!data.academicYear.trim()) {
    errors.academicYear = 'Academic year is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateRating(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 10;
}
