const CURRENCY = "ARS";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value));
}
