import type { ExtensionDIDStorage } from '../../storage/dids';
import type { IPFSClaimStorage } from '../../storage/credentials';
import type { CredentialWithProof } from '../credential';
import { VerificationFailed } from '../errors';
import { CredentialFinder, CredentialReport, FinderFactory } from '../../extract/extractcredential';
import { DIDIdentity, verifyCredentialWithDIDResponse } from '../id';

import * as browser from 'webextension-polyfill';

export class RedditFinderFactory implements FinderFactory {
  constructor(private claimStorage: IPFSClaimStorage) {}

  async forURL(url: string): Promise<CredentialFinder | undefined> {
    const matches = /^(https:\/\/(?:www\.)reddit\.com\/user\/[^\/?#]+)(\?.*)?(#.*)?$/.exec(url);
    if (!matches) {
      return;
    }

    const canonical = matches[1];
    return new RedditCredentialFinder(url, canonical, this.claimStorage);
  }
}

class RedditCredentialFinder extends CredentialFinder {
  constructor(private url: string, private canonicalURL: string, private claimStorage: IPFSClaimStorage) {
    super();
  }

  getRedditName(): string | undefined {
    const match = /^https\:\/\/(?:www\.)reddit\.com\/user\/([^\/?#]+)/.exec(this.canonicalURL);
    return match && match[1] || undefined;
  }

  getRedditBio(): Promise<string> {
    return browser.tabs.executeScript({
      // This is very fragile.
      code: `document.querySelectorAll('[class="bVfceI5F_twrnRcVO1328"]')[0].innerText`
    }).then(results => results[0]).catch(console.error);
  }

  getClaimFromBio(bio: string): string | undefined {
    const match = /scua:(Qm\w+)/.exec(bio);
    return match && match[1] || undefined;
  }

  async findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined> {
    const bio = await this.getRedditBio();
    console.info('Reddit bio is', bio);
    const claimCID = this.getClaimFromBio(bio);
    console.info('Claim CID is', claimCID);

    if (!claimCID) {
      return {
        url: this.url,
        canonicalURL: this.canonicalURL,
        found: undefined,
      };
    }

    const claimString = await this.claimStorage.get(claimCID);

    console.info('Claim string:', claimString);

    // TODO: safer parsing.
    const credential = JSON.parse(claimString) as CredentialWithProof;

    const claimant = credential.credentialSubject.id;
    const claimed = credential.credentialSubject.ownerOf;

    console.info('Claim of', claimed.id, 'looking at', this.canonicalURL);

    const did = await storage.lookup(claimant);

    console.info('Found claimant', did);

    if (!did) {
      return {
        url: this.url,
        canonicalURL: this.canonicalURL,
        found: undefined,
      };
    }

    let verified: boolean;
    try {
      await verifyCredentialWithDIDResponse(credential, did);
      verified = true;
    } catch (e) {
      if (e instanceof VerificationFailed) {
        verified = false;
      }
      throw e;
    }

    console.info('Verified?', verified);

    // And we just got the credential URL from the page, so we're done.
    const retrievedFromPage = true;
    const validated = (claimed.id === this.canonicalURL) && retrievedFromPage;

    return {
      url: this.url,
      canonicalURL: this.canonicalURL,
      found: {
        kind: 'https://reddit.com#profile',
        indirect: '',
        resolved: `ipfs://${claimCID.toString()}`,
        credential,
        verified,
        validated,
      }
    };
  }

  claim(did: DIDIdentity): Promise<CredentialWithProof> {
    return did.claimOwnership(this.canonicalURL);
  }
}
