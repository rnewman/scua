/**
 * Much of this file is fleshing out the types for the plain JS ION DID library.
 */

export interface PublicJWK {
  kty: 'EC';
  crv: 'secp256k1';
  x: string;
  y: string;
};

export interface PrivateJWK {
  kty: 'EC';
  crv: 'secp256k1';
  d: string;
  x: string;
  y: string;
};

export interface KeyPair {
  privateJwk: PrivateJWK;
  publicJwk: PublicJWK;
}

export interface DID {
  getURI(kind?: 'long' | 'short'): Promise<string>;
}

type KeyID = string;

interface VerificationMethod {
  id: KeyID;
  controller: string;
  type: string;
  publicKeyJwk: PublicJWK;
}

export interface DIDResponse {
  didDocument: {
    id: string,
    verificationMethod: VerificationMethod[],
    authentication: KeyID[],
  };

  // TODO: document metadata.
}
