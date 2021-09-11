import { CredentialWithProof } from '../credential';
import { PublicJWK } from '../did';
import { DIDIdentity } from '../id';
import { Claimable } from './claim';

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