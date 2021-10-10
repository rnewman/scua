import type { ExtensionDIDStorage } from '../storage/dids';
import type { CredentialWithProof } from '../lib/credential';
import type { DIDIdentity } from '../lib/id';

export interface FoundCredential {
  kind: string;           // https://twitter.com#profile
  indirect: string;       // ipns://…
  resolved: string;       // ipfs://…
  credential: CredentialWithProof;   // some credential object
  verified: boolean;
  validated: boolean;
}

export interface CredentialReport {
  url: string;            // https://twitter.com/skuasky#foobar
  canonicalURL: string;   // https://twitter.com/skuasky
  found: FoundCredential | undefined;
}

export interface FinderFactory {
  forURL(url: string): Promise<CredentialFinder | undefined>;
}

export abstract class CredentialFinder {
  abstract findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined>;
  abstract claim(did: DIDIdentity): Promise<CredentialWithProof>;
}

export interface FinderResult {
  finder: CredentialFinder;
  report: CredentialReport | undefined;
}
