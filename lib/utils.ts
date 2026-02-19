export const formatPrice = (value: number, currency: string) => {
  const rounded = Math.round(value);
  const withSeparator = rounded.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
  });
  return currency === 'COP' ? `$ ${withSeparator}` : `${currency} ${withSeparator}`;
};
