const usedCodes = new Set();
export function generateArtistId() {
  let code;

  do {
    code = Math.floor(1000 + Math.random() * 9000);
  } while (usedCodes.has(code));

  usedCodes.add(code);

  return code;
}
export function generateLabelId() {
  let code;

  do {
    code = Math.floor(1000 + Math.random() * 9000);
  } while (usedCodes.has(code));

  usedCodes.add(code);

  return code;
}
//! Transaction id
export function generateTransactionId() {
  const timestamp = new Date().getTime().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5);

  return `${timestamp}${randomString}`.toUpperCase();
}
export function generateExternalId() {
  const timestamp = new Date().getTime().toString(36);
  const randomString = Math.random().toString(36).substr(2, 8);

  return `${timestamp}${randomString}`.toUpperCase();
}
