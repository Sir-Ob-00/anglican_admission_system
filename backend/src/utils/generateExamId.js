export function generateExamId() {
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `EX-${rnd}`;
}

