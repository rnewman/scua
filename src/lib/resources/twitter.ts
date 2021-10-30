import type { ExtensionDIDStorage } from '../../storage/dids';
import type { IPFSClaimStorage } from '../../storage/credentials';
import type { CredentialWithProof } from '../credential';
import { VerificationFailed } from '../errors';
import { CredentialFinder, CredentialReport, FinderFactory } from '../../extract/extractcredential';
import { DIDIdentity, verifyCredentialWithDIDResponse } from '../id';

import * as browser from 'webextension-polyfill';

export class TwitterFinderFactory implements FinderFactory {
  constructor(private claimStorage: IPFSClaimStorage) {}

  async forURL(url: string): Promise<CredentialFinder | undefined> {
    const matches = /^(https:\/\/twitter\.com\/[^\/?#]+)(\?.*)?(#.*)?$/.exec(url);
    if (!matches) {
      return;
    }

    const canonical = matches[1];
    if (['home', 'explore', 'notifications', 'messages', 'i/bookmarks'].includes(canonical)) {
      return;
    }
    return new TwitterCredentialFinder(url, canonical, this.claimStorage);
  }
}

class TwitterCredentialFinder extends CredentialFinder {
  constructor(private url: string, private canonicalURL: string, private claimStorage: IPFSClaimStorage) {
    super();
  }

  getTwitterName(): string | undefined {
    const match = /^https\:\/\/twitter\.com\/([^\/?#]+)/.exec(this.canonicalURL);
    return match && match[1] || undefined;
  }

  getTwitterBio(): Promise<string> {
    return browser.tabs.executeScript({
      code: `document.querySelectorAll('[data-testid="UserDescription"]')[0].innerText`
    }).then(results => results[0]).catch(console.error);
  }

  getClaimFromBio(bio: string): string | undefined {
    const match = /scua:(Qm\w+)/.exec(bio);
    return match && match[1] || undefined;
  }

  async findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined> {
    const bio = await this.getTwitterBio();
    console.info('Twitter bio is', bio);
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
        kind: 'https://twitter.com#profile',
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
