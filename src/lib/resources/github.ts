import type { ExtensionDIDStorage } from '../../storage/dids';
import type { IPFSClaimStorage } from '../../storage/credentials';
import type { CredentialWithProof } from '../credential';
import { VerificationFailed } from '../errors';
import { CredentialFinder, CredentialReport, FinderFactory } from '../../extract/extractcredential';
import { DIDIdentity, verifyCredentialWithDIDResponse } from '../id';

import * as browser from 'webextension-polyfill';

export class GitHubFinderFactory implements FinderFactory {
  constructor(private claimStorage: IPFSClaimStorage) {}

  async forURL(url: string): Promise<CredentialFinder | undefined> {
    const matches = /^(https:\/\/github\.com\/[^\/?#]+\/[^\/?#]+)(\?.*)?(#.*)?$/.exec(url);
    if (!matches) {
      return;
    }

    const canonical = matches[1];
    return new GitHubCredentialFinder(url, canonical, this.claimStorage);
  }
}

class GitHubCredentialFinder extends CredentialFinder {
  constructor(private url: string, private canonicalURL: string, private claimStorage: IPFSClaimStorage) {
    super();
  }

  getGitHubProject(): string | undefined {
    const match = /^https\:\/\/github\.com\/([^\/?#]+\/[^\/?#]+)/.exec(this.canonicalURL);
    return match && match[1] || undefined;
  }

  getGitHubAbout(): Promise<string> {
    return browser.tabs.executeScript({
      code: `document.querySelector('div[class="repository-content "]').innerText`
    }).then(results => {
      const s = results[0];
      console.info('Got', s);
      const about = s.indexOf('About');
      return s.substring(about);
    }).catch(console.error);
  }

  getClaimFromAbout(about: string): string | undefined {
    const match = /scua:(Qm\w+)/.exec(about);
    return match && match[1] || undefined;
  }

  async findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined> {
    const about = await this.getGitHubAbout();
    console.info('GitHub about is', about);
    const claimCID = this.getClaimFromAbout(about);
    console.info('Claim CID is', claimCID);

    if (!claimCID) {
      return {
        url: this.url,
        canonicalURL: this.canonicalURL,
        found: undefined,
      };
    }

    //const claimCID = 'scua:QmcyeE3iqrX5wR2p4Y6xKKVDXPCd2rjo4fYsSYETuDyMwq';
    console.info('TODO', this.url, this.canonicalURL, claimCID);

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
        kind: 'https://github.com#project',
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
