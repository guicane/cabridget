// Amounts arrive here as JS numbers already rounded to at most 2 decimal
// places (Prisma's Decimal(12,2) columns, serialized via Number() at the
// server boundary). A single such value round-trips through float exactly,
// but summing several with plain `+` can drift by a fraction of a cent
// (e.g. 0.1 + 0.2 !== 0.3) because binary floats can't represent every
// decimal fraction. Summing as integer cents avoids that: each value is
// exact, and integer addition never drifts.
export function sumAmounts(amounts: number[]): number {
  const cents = amounts.reduce((total, amount) => total + Math.round(amount * 100), 0)
  return cents / 100
}
