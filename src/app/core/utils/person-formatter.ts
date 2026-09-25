export interface PersonLike {
  firstName?: string;
  lastName?: string;
  name?: string;
}

export function formatPersonName(person?: PersonLike | null, prefix = ''): string {
  if (!person) return '';
  const fullName = person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim();
  if (!fullName) return '';
  return prefix ? `${prefix} ${fullName}`.trim() : fullName;
}
