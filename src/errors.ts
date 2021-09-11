export class SignatureNotValid extends Error {
  constructor(public jws: string) {
    super('Signature not valid: ' + jws);
  }
}

export class VerificationFailed extends Error {}