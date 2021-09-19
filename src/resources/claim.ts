import type { CredentialWithProof } from '../credential';
import type { PublicJWK } from '../did';
import type { DIDIdentity } from '../id';

export interface Claimable {
  // TODO: sometimes we need to take action!
  claim(did: DIDIdentity, additionalKey?: PublicJWK): Promise<CredentialWithProof>;
  verify(didURI?: string): Promise<string>;
}

// TODO
export class FollowOnAction {
  constructor(public credential: CredentialWithProof) {}
}