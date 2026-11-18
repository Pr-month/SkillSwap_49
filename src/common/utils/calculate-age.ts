export function calculateAge(birthdate: Date | string | null): number | null {
  if (!birthdate) return null;

  const date = new Date(birthdate);

  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();

  let age = today.getUTCFullYear() - date.getUTCFullYear();

  const monthDiff = today.getUTCMonth() - date.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getUTCDate() < date.getUTCDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}
