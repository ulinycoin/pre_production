/**
 * Utility to format currency amounts
 */
export const formatPrice = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
};
