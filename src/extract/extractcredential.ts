import type { ExtensionDIDStorage } from '../../webextension/storage';
import type { CredentialWithProof } from '../credential';

export interface CredentialReport {
  url: string;            // https://twitter.com/skuasky#foobar
  canonicalURL: string;   // https://twitter.com/skuasky
  kind: string;           // https://twitter.com#profile
  indirect: string;       // ipns://…
  resolved: string;       // ipfs://…
  credential: CredentialWithProof;   // some credential object
  verified: boolean;
  validated: boolean;
}

export interface FinderFactory {
  forURL(url: string): Promise<CredentialFinder | undefined>;
}

export abstract class CredentialFinder {
  abstract findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined>;
}

