import { CredentialWithProof } from '../credential';
import { PublicJWK } from '../did';
import { DIDIdentity } from '../id';

export interface Claimable {
  // TODO: sometimes we need to take action!
  claim(did: DIDIdentity, additionalKey?: PublicJWK): Promise<CredentialWithProof>;
  verify(didURI?: string): Promise<string>;
}

// TODO
export class FollowOnAction {
  constructor(public credential: CredentialWithProof) {}
}