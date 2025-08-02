
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";


function B58(input) {
  // Convert string to bytes if needed
  const bytes = (typeof input === 'string')
    ? new TextEncoder().encode(input)
    : input; // already Uint8Array

  // Convert bytes to BigInt
  let intVal = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    intVal = (intVal << BigInt(8)) + BigInt(bytes[i]);
  }

  const base = BigInt(58);
  let result = '';

  while (intVal > 0) {
    const remainder = intVal % base;
    intVal = intVal / base;
    result = BASE58_ALPHABET[Number(remainder)] + result;
  }

  // Leading zero bytes → leading '1's
  for (let byte of bytes) {
    if (byte === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }

  return result;
}

module.exports = {
  B58,
};

