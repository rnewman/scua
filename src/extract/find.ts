import { RedditFinderFactory } from '../lib/resources/reddit';
import { TwitterFinderFactory } from '../lib/resources/twitter';
import { GitHubFinderFactory } from '../lib/resources/github';
import type { ExtensionDIDStorage } from '../storage/dids';
import type { IPFSClaimStorage } from '../storage/credentials';
import type { CredentialFinder, FinderFactory, FinderResult } from './extractcredential';

const defaultFinders: {[key: string]: FinderFactory[]} = {
};

export function initializeFinders(claimStorage: IPFSClaimStorage) {
  const reddit = new RedditFinderFactory(claimStorage);
  defaultFinders['https://reddit.com'] = [reddit];
  defaultFinders['https://www.reddit.com'] = [reddit];
  defaultFinders['https://twitter.com'] = [new TwitterFinderFactory(claimStorage)];
  defaultFinders['https://github.com'] = [new GitHubFinderFactory(claimStorage)];
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

export async function findCredentialForURL(url: string, storage: ExtensionDIDStorage): Promise<FinderResult | undefined> {
  const finder = await finderForURL(url);
  if (!finder) {
    return;
  }
  const report = await finder.findCredentials(storage);
  return { report, finder };
}