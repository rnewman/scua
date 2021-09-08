/**
 * This file is the most rudimentary typed wrapper around ION's tools library.
 * Interfaces are not complete: they are fleshed out only as much as needed to
 * get to working functionality.
 */

import * as ION from '@decentralized-identity/ion-tools';

interface PublicJWK {
  kty: 'EC';
  crv: 'secp256k1';
  x: string;
  y: string;
};

interface PrivateJWK {
  kty: 'EC';
  crv: 'secp256k1';
  d: string;
  x: string;
  y: string;
};

interface KeyPair {
  privateJwk: PrivateJWK;
  publicJwk: PublicJWK;
}

interface DID {
  getURI(kind?: 'long' | 'short'): Promise<string>;
}

type KeyID = string;

interface VerificationMethod {
  id: KeyID;
  controller: string;
  type: string;
  publicKeyJwk: PublicJWK;
}

interface DIDResponse {
  didDocument: {
    id: string,
    verificationMethod: VerificationMethod[],
    authentication: KeyID[],
  };

  // TODO: document metadata.
}

class Identity {
  constructor(private keyPair: KeyPair, private did: DID) {
    this.debug();
  }

  async debug(): Promise<void> {
    const uri = await this.did.getURI();
    console.log('Using DID', uri);
  }

  async getURI(): Promise<string> {
    return this.did.getURI();
  }

  async signJws(payload: string, options?: { detached?: boolean, header?: object }): Promise<string> {
    return ION.signJws({ payload, privateJwk: this.keyPair.privateJwk, header: options?.header, detached: !!options?.detached });
  }
}

const DEFAULT_TYPE = 'EcdsaSecp256k1VerificationKey2019';
export async function createIdentity(): Promise<Identity> {
  const keyPair = await ION.generateKeyPair();

  const did = new ION.DID({
    content: {
      publicKeys: [{
        id: 'key-1',
        type: DEFAULT_TYPE,
        publicKeyJwk: keyPair.publicJwk,
        purposes: [ 'authentication' ]
      }],
      services: [],
    }
  });

  return new Identity(keyPair, did);
}

export async function fetchDID(uri: string, options?: { endpoint?: string }): Promise<DIDResponse> {
  return ION.resolve(uri, options);
}

export class SignatureNotValid extends Error {
  constructor(public jws: string) {
    super('Signature not valid: ' + jws);
  }
}

export async function validateJWS(uri: string, jws: string): Promise<void> {
  const didDocument = await (await fetchDID(uri)).didDocument;
  const keyIDs = new Set(didDocument.authentication);
  const publicKeys = didDocument.verificationMethod.filter(({ id }) => keyIDs.has(id));
  const validateWithKey = ({ publicKeyJwk }: { publicKeyJwk: PublicJWK }) => ION.verifyJws({ jws, publicJwk: publicKeyJwk });

  return Promise.any(publicKeys.map(validateWithKey))
                .catch(e => Promise.reject(new SignatureNotValid(jws)));
}
