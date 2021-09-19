import { CredentialWithProof } from './credential';
import { SignatureNotValid } from "./errors";
import {
  DIDIdentity, verifyCredential,
} from './id';

console.info('Hello, bluesky!');

import * as ION from '@decentralized-identity/ion-tools';

// This is our build hack so we can use the web version or the Node version of ION.
((globalThis as unknown) as any).ION = ION;

export async function createAndSign(): Promise<{ credential: CredentialWithProof, identity: DIDIdentity }> {
  const identity = await DIDIdentity.create();
  const credential = await identity.claimOwnership('https://twitter.com/scuasky');

  return { credential, identity };
}

export async function verify({ credential, identity }: { credential: CredentialWithProof, identity: DIDIdentity }): Promise<void> {
  console.info('Verifying', credential, identity);
  return verifyCredential(credential, identity).then(() => undefined);
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