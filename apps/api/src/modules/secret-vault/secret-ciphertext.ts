/**
 * Persisted secret form (V3-S03-b).
 * Ciphertext at rest. Wrapping key is never a field on this object.
 */

export const SECRET_CIPHER_VERSION = 1 as const;

export type SecretCiphertext = Readonly<{
  version: typeof SECRET_CIPHER_VERSION;
  wrappingSalt: string;
  wrappedDataKey: string;
  dataKeyNonce: string;
  dataKeyTag: string;
  payload: string;
  payloadNonce: string;
  payloadTag: string;
}>;

const CIPHERTEXT_KEYS: readonly (keyof SecretCiphertext)[] = [
  'version',
  'wrappingSalt',
  'wrappedDataKey',
  'dataKeyNonce',
  'dataKeyTag',
  'payload',
  'payloadNonce',
  'payloadTag',
];

export function isSecretCiphertext(value: unknown): value is SecretCiphertext {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== SECRET_CIPHER_VERSION) {
    return false;
  }
  return CIPHERTEXT_KEYS.every((key) => {
    if (key === 'version') return true;
    return typeof record[key] === 'string' && (record[key] as string).length > 0;
  });
}

export function cloneSecretCiphertext(ciphertext: SecretCiphertext): SecretCiphertext {
  return Object.freeze({
    version: SECRET_CIPHER_VERSION,
    wrappingSalt: ciphertext.wrappingSalt,
    wrappedDataKey: ciphertext.wrappedDataKey,
    dataKeyNonce: ciphertext.dataKeyNonce,
    dataKeyTag: ciphertext.dataKeyTag,
    payload: ciphertext.payload,
    payloadNonce: ciphertext.payloadNonce,
    payloadTag: ciphertext.payloadTag,
  });
}

export function ciphertextContainsWrappingKey(
  ciphertext: SecretCiphertext,
  wrappingKeyRaw: string,
): boolean {
  if (wrappingKeyRaw.length === 0) {
    return false;
  }
  return JSON.stringify(ciphertext).includes(wrappingKeyRaw);
}

export function withTamperedPayload(ciphertext: SecretCiphertext): SecretCiphertext {
  return withTamperedBase64Field(ciphertext, 'payload');
}

export function withTamperedPayloadTag(ciphertext: SecretCiphertext): SecretCiphertext {
  return withTamperedBase64Field(ciphertext, 'payloadTag');
}

function withTamperedBase64Field(
  ciphertext: SecretCiphertext,
  field: 'payload' | 'payloadTag',
): SecretCiphertext {
  const raw = Buffer.from(ciphertext[field], 'base64');
  if (raw.length === 0) {
    return cloneSecretCiphertext(ciphertext);
  }
  raw[0] = raw[0]! ^ 0xff;
  return Object.freeze({
    ...cloneSecretCiphertext(ciphertext),
    [field]: raw.toString('base64'),
  });
}
