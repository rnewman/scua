import type { CredentialWithProof } from './credential';
import './CredentialFinder';
import { SignatureNotValid } from "./errors";
import {
  DIDIdentity, verifyCredential,
} from './id';
import { deflate } from 'pako';
console.info('Hello, bluesky!');

import * as ION from '@decentralized-identity/ion-tools';

// This is our build hack so we can use the web version or the Node version of ION.
((globalThis as unknown) as any).ION = ION;

async function testIdentitySerialization() {
  const identity = await DIDIdentity.create();
  const serialized = await identity.serialize();
  const looped = await (await DIDIdentity.deserialize(serialized)).serialize();

  if (looped !== serialized) {
    throw new Error('Identity does not roundtrip!');
  }
}

export async function createAndSign(): Promise<{ credential: CredentialWithProof, identity: DIDIdentity }> {
  const identity = await DIDIdentity.create();
  const credential = await identity.claimOwnership('https://twitter.com/scuasky');

  return { identity, credential };
}

export async function verify({ credential, identity }: { credential: CredentialWithProof, identity: DIDIdentity }): Promise<void> {
  console.info('Verifying', credential, identity);
  return verifyCredential(credential, identity).then(() => undefined);
}

export async function testSignAndVerify(): Promise<void> {
  const creation = await createAndSign();
  try {
    await verify(creation);
    console.info('Validation succeeded.');

    const str = JSON.stringify(creation.credential);
    console.info('Got', str);
    const credentialSmall = deflate(JSON.stringify(creation.credential));
    console.info('Compressed:', str.length, credentialSmall.length);
  } catch (e) {
    if (e instanceof SignatureNotValid) {
      console.error('Invalid signature.');
    } else {
      console.warn('Unable to validate signature.');
    }
  }
}

testIdentitySerialization();
testSignAndVerify();