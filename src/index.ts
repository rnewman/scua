import {
  createIdentity,
  SignatureNotValid,
  validateJWS,
} from './id';

console.info('Hello, bluesky!');

export async function createAndSign(): Promise<{ jws: string, did: string }> {
  const identity = await createIdentity();
  const did = await identity.getURI();
  const jws = await identity.signJws('Hello, bluesky!');

  return { jws, did };
}

export async function verify({ jws, did }: { jws: string, did: string }): Promise<void> {
  console.info('Verifying', jws, did);
  return validateJWS(did, jws).then(() => undefined);
}

export async function roundtrip(): Promise<void> {
  const creation = await createAndSign();
  try {
    await verify(creation);
    console.info('Validation succeeded.');
  } catch (e) {
    if (e instanceof SignatureNotValid) {
      console.error('Invalid signature.');
    } else {
      console.warn('Unable to validate signature.');
    }
  }
}

roundtrip();