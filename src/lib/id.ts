/**
 * This file is the most rudimentary typed wrapper around ION's tools library.
 * Interfaces are not complete: they are fleshed out only as much as needed to
 * get to working functionality.
 */

import { constructCredential, CredentialWithProof, Proof } from './credential';
import type { DIDResponse, KeyPair, PublicJWK, PrivateJWK, DIDState, DIDOp } from './did';
import { SignatureNotValid, VerificationFailed } from './errors';

declare module ION {
  type KeyPairType = 'Ed25519' | 'EdDSA' | 'secp256k1' | 'ES256K';
  class DID {
    constructor({ ops, content }: { ops?: DIDOp[], content?: object });
    getURI(kind?: 'long' | 'short'): Promise<string>;
    getState(): Promise<DIDState>;
    getAllOperations(): Promise<DIDOp[]>;
  }
  function resolve(didUri: string, options?: { nodeEndpoint?: string }): Promise<DIDResponse>;
  function signJws({ payload, privateJwk }: { payload: string, privateJwk: PrivateJWK }): Promise<string>;
  function verifyJws({ jws, publicJwk, payload }: { jws: string, payload?: string, publicJwk: PublicJWK }): Promise<string>;
  function generateKeyPair(type?: KeyPairType): Promise<KeyPair>;
};

const DEFAULT_TYPE = 'EcdsaSecp256k1VerificationKey2019';

interface PublicKeySource {
  getPublicKey(uri: string): Promise<PublicJWK>;
}

interface DereferenceableKeyMatter {
  keyPair: KeyPair;
  getKeyURI(): Promise<string>;
}

export class DIDIdentity implements DereferenceableKeyMatter, PublicKeySource {
  constructor(readonly keyPair: KeyPair, private did: ION.DID) {
    this.debug();
  }

  /*
   * DereferenceableKeyMatter
   */
  async getKeyURI(): Promise<string> {
    return (await this.did.getURI()) + '#key-1';     // TODO
  }

  /*
   * PublicKeySource
   */
  async getPublicKey(uri: string): Promise<PublicJWK> {
    if (uri === await this.getKeyURI()) {
      return this.keyPair.publicJwk;
    }

    throw new Error('Unknown key');
  }

  async debug(): Promise<void> {
    const uri = await this.did.getURI();
    console.log('Using DID', uri);
  }

  async getURI(): Promise<string> {
    return this.did.getURI();
  }

  async claimOwnership(resource: string, additionalKey?: DereferenceableKeyMatter): Promise<CredentialWithProof> {
    const created = new Date().toISOString();
    const proofPurpose = 'assertionMethod';
    const type = 'RsaSignature2018';

    const credential = constructCredential(resource, await this.getURI());

    // ES6 JSON.stringify normalizes appropriately for JWS.
    const credentialString = JSON.stringify(credential);

    // If we got a second key, we'll produce two proofs. Otherwise, just one, which
    // for clarity we'll omit without the containing set/array.
    let proof: Proof | Proof[];

    const didProof: Proof = {
      created,
      type,
      proofPurpose,
      verificationMethod: await this.getKeyURI(),
      jws: await ION.signJws({ payload: credentialString, privateJwk: this.keyPair.privateJwk }),
    };

    if (additionalKey) {
      const additionalProof: Proof = {
        created,
        type,
        proofPurpose,
        verificationMethod: await additionalKey.getKeyURI(),
        jws: await ION.signJws({ payload: credentialString, privateJwk: additionalKey.keyPair.privateJwk }),
      };
      proof = [ didProof, additionalProof ];
    } else {
      proof = didProof;
    }

    return {
      ...credential,
      proof,
    };
  }

  static async deserialize(didState: string): Promise<DIDIdentity> {
    const state = JSON.parse(didState);
    return new DIDIdentity(state.keyPair, new ION.DID(state.did));
  }

  async serialize(): Promise<string> {
    return JSON.stringify({ did: await this.did.getState(), keyPair: this.keyPair });
  }

  static async create(): Promise<DIDIdentity> {
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

    return new DIDIdentity(keyPair, did);
  }
}

export async function fetchDID(uri: string, options?: { nodeEndpoint?: string }): Promise<DIDResponse> {
  return ION.resolve(uri, options);
}

export async function verifyJWSWithDIDResponse(didResponse: DIDResponse, jws: string): Promise<void> {
  const didDocument = didResponse.didDocument;
  const keyIDs = new Set(didDocument.authentication);
  const publicKeys = didDocument.verificationMethod.filter(({ id }) => keyIDs.has(id));

  // Attempt to validate every key at once. If all fail, turn the promise race failure
  // into a SignatureNotValid.
  return Promise.any(publicKeys.map(({ publicKeyJwk }) => ION.verifyJws({ jws, publicJwk: publicKeyJwk })))
                .then(() => {})
                .catch(e => Promise.reject(new SignatureNotValid(jws)));
}
/**
 * Verify the provided JWS by fetching and examining the provided DID URI.
 * If the JWS was not signed by one of the keys in the DID, rejects with `SignatureNotValid`.
 */
export async function verifyJWSWithDID(didURI: string, jws: string): Promise<void> {
  // TODO: checking.
  const didResponse = await (await fetchDID(didURI)) as DIDResponse;
  return verifyJWSWithDIDResponse(didResponse, jws);
}

export class DIDResponsePublicKeySource implements PublicKeySource {
  constructor(private did: DIDResponse) {
  }

  getPublicKey(uri: string): Promise<PublicJWK> {
    if (!uri.startsWith(this.did.didDocument.id)) {
      throw new Error('Public key does not belong to this DID.');
    }
    const suffix = uri.substring(this.did.didDocument.id.length);
    const matchingMethod = this.did.didDocument.verificationMethod.find(method => method.id === suffix);
    if (!matchingMethod) {
      throw new Error('No matching verification method.');
    }
    return Promise.resolve(matchingMethod.publicKeyJwk);
  }
}

export function verifyCredentialWithDIDResponse(credential: CredentialWithProof, did: DIDResponse): Promise<void> {
  return verifyCredential(credential, new DIDResponsePublicKeySource(did));
}

/**
 * Verify all of the proofs in the provided credential, using the providing
 * source of keys to retrieve public keys by URI.
 *
 * If the credentials proofs were not signed by retrievable keys, rejects with
 * `VerificationFailed`.
 *
 * TODO: how do we make sure that this credential is actually linked to the embedded proof?!
 */
export async function verifyCredential(credential: CredentialWithProof, keySource: PublicKeySource): Promise<void> {
  async function verify(proofs: Proof[]): Promise<void> {
    const promises = [];
    for (const proof of proofs) {
      const key = await keySource.getPublicKey(proof.verificationMethod);
      promises.push(ION.verifyJws({ jws: proof.jws, publicJwk: key }));
    }

    return Promise.any(promises)
                  .then(() => {})
                  .catch(_ => Promise.reject(new VerificationFailed()));
  }

  if ('proofPurpose' in credential.proof) {
    // Just one.
    return verify([credential.proof]);
  }

  return verify(credential.proof);
}
