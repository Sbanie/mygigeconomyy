export const formatZAR = (amount: number): string => {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const parseZAR = (value: string): number => {
  return parseFloat(value.replace(/[R\s,]/g, '')) || 0;
};

export const getCurrentTaxYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 3) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

export const getTaxYearStart = (taxYear: string): Date => {
  const startYear = parseInt(taxYear.split('/')[0]);
  return new Date(startYear, 2, 1);
};

export const getTaxYearEnd = (taxYear: string): Date => {
  const endYear = parseInt(taxYear.split('/')[1]);
  return new Date(endYear, 1, 28);
};

export const isInCurrentTaxYear = (date: string): boolean => {
  const d = new Date(date);
  const currentTaxYear = getCurrentTaxYear();
  const start = getTaxYearStart(currentTaxYear);
  const end = getTaxYearEnd(currentTaxYear);

  return d >= start && d <= end;
};

export const generateInvoiceNumber = (count: number): string => {
  const year = new Date().getFullYear();
  const number = String(count + 1).padStart(4, '0');
  return `INV-${year}-${number}`;
};

export const calculateVAT = (amount: number, isVATRegistered: boolean): number => {
  return isVATRegistered ? amount * 0.15 : 0;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
