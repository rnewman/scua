// This is actually an open set of JSON-LD.
export interface CredentialSubject {
  id: string;
  ownerOf: {
    id: string,
  };
}

export interface CredentialWithoutProof {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: CredentialSubject;
}

export interface Proof {
  type: 'RsaSignature2018';
  created: string;
  proofPurpose: 'assertionMethod';
  verificationMethod: string;
  jws: string;
}

export interface CredentialWithProof extends CredentialWithoutProof {
  // The VC spec only shows multiple proofs in the Presentation form, not
  // Credentials themselves. However, this is a common feature of LD proofs, and
  // it allows us to combine the proofs of a key-bearing resource with the
  // identity itself.
  proof: Proof | Proof[];
}

const MSEC_PER_THIRTY_DAYS = 30 * 24 * 60 * 60 * 1_000;

export function constructCredential(
  resource: string,
  identity: string,
  expirationMsec: number = MSEC_PER_THIRTY_DAYS,
  now: number = Date.now()
): CredentialWithoutProof {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://example.org/scua/v1',
    ],
    'type': ['VerifiableCredential', 'ScuaClaim'],
    'issuer': identity,
    'issuanceDate': new Date(now).toISOString(),
    'expirationDate': new Date(now + expirationMsec).toISOString(),
    'credentialSubject': {
      'id': identity,
      'ownerOf': {
        'id': resource,
      }
    },
  };
}
