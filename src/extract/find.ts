import { TwitterFinderFactory } from '../resources/twitter';
import type { ExtensionDIDStorage, IPFSClaimStorage } from '../../webextension/storage';
import type { CredentialFinder, CredentialReport, FinderFactory } from './extractcredential';

const defaultFinders: {[key: string]: FinderFactory[]} = {
};

export function initializeFinders(claimStorage: IPFSClaimStorage) {
  defaultFinders['https://twitter.com'] = [new TwitterFinderFactory(claimStorage)];
}

async function finderForURL(url: string): Promise<CredentialFinder | undefined> {
  // Match by origin, then by asking the factory itself.
  const origin = new URL(url).origin;
  const potentials = defaultFinders[origin];
  if (potentials) {
    for (const finder of potentials) {
      const f = finder.forURL(url);
      if (f) {
        return f;
      }
    }
  }
  return undefined;
}

export async function findCredentialForURL(url: string, storage: ExtensionDIDStorage): Promise<CredentialReport | undefined> {
  return (await finderForURL(url))?.findCredentials(storage);
}