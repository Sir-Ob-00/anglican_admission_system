export function generateAdmissionNumber() {
  const year = new Date().getFullYear();
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `AAS-${year}-${rnd}`;
}

