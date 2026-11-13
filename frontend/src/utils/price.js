export const formatPrice = (publication) =>
  publication.priceCents == null
    ? 'Precio pendiente'
    : publication.priceCents === 0
      ? 'Gratuito'
      : new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
          publication.priceCents / 100,
        );
export const priceUnitLabel = () => 'por sesión';
export function parsePrice(value) {
  const normalized = value.trim().replace(',', '.').replace(/^\./, '0.');
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 1000000 ? cents : null;
}
