import type { ExtensionDIDStorage } from '../../webextension/storage';
import type { CredentialWithProof } from '../credential';
import type { PublicJWK } from '../did';
import { CredentialFinder, CredentialReport, FinderFactory } from '../extract/extractcredential';
import type { DIDIdentity } from '../id';
import type { Claimable } from './claim';

export class TwitterFinderFactory implements FinderFactory {
  async forURL(url: string): Promise<CredentialFinder | undefined> {
    const matches = /^(https:\/\/twitter\.com\/[^\/?#]+)(\?.*)?(#.*)?$/.exec(url);
    if (!matches) {
      return;
    }

    const canonical = matches[1];
    return new TwitterCredentialFinder(url, canonical);
  }
}

class TwitterCredentialFinder extends CredentialFinder {
  constructor(private url: string, private canonicalURL: string) {
    super();
  }

  async findCredentials(storage: ExtensionDIDStorage): Promise<CredentialReport | undefined> {
    console.info('TODO', this.url, this.canonicalURL);

    const did = await storage.getSelf();
    const credential = await new TwitterClaim('rnewman').claim(did);
    const verified = true;
    const validated = true;
    return {
      url: this.url,
      canonicalURL: this.canonicalURL,
      kind: 'https://twitter.com#profile',
      indirect: 'ipns://',
      resolved: 'ipfs://',
      credential,
      verified,
      validated,
    };
    // return undefined;
  }
}

export class TwitterClaim implements Claimable {
  constructor(private username: string) {
    // TODO: validate username.
  }

  async claim(did: DIDIdentity, _additionalKey?: PublicJWK): Promise<CredentialWithProof> {
    // TODO: we either need to compact this or publish it to IPFS,
    // then apply the claim to Twitter.
    return did.claimOwnership('https://twitter.com/' + this.username);
  }

  verify(didURI?: string): Promise<string> {
    // TODO: fetch from Twitter, construct the credential, then verify it
    // against the DID (first short, then by fetching and verifying).
    // We need to do a further step to validate, which is to compare the claim
    // inside the credential to the username.
    throw new Error('Method not implemented.');
  }

}