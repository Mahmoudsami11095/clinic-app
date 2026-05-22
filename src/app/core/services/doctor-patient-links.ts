const storageKey = (doctorId: string) => `doctor_${doctorId}_linked_patients`;

export function getDoctorLinkedPatientIds(doctorId: string): Set<string> {
  const raw = localStorage.getItem(storageKey(doctorId));
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function addDoctorLinkedPatientId(doctorId: string, patientId: string): void {
  const linked = getDoctorLinkedPatientIds(doctorId);
  linked.add(patientId);
  localStorage.setItem(storageKey(doctorId), JSON.stringify([...linked]));
}
