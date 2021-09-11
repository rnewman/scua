# Design

This system uses DIDs as stable identities/identifiers and sources of key material. This is not strictly necessary (one could just as easily pick any unique public key), but it will suffice for the purposes of this experiment.

The process of associating an identity with a resource (e.g., a Twitter account) involves the following steps:

* Constructing or finding an identifier for the identity. Here it is a DID URI. This will be the *subject* of an assertion.
* Constructing an identifier for the resource. This might be an HTTP URI including path, or it might be some other protocol scheme such as an [`ssb:` URI](https://github.com/ssb-ngi-pointer/ssb-uri-spec). This will be the *object* of an assertion.
* Formulating an assertion about the subject to claim ownership using some JSON-LD vocabulary.
* Encoding that assertion as the *claims* in a [Verifiable Credential](https://www.w3.org/TR/vc-data-model/).

Verifiable Credentials can be *verified* cryptographically: that is, a third party can determine that it was issued by the claimed issuer and has not been tampered with.

This is not the same thing as *validation*, which is the determination that the credential is meaningful and meets the needs of a stakeholder. For our purposes, validation requires an additional step that links the credential to the resource. With verification we can conclude that Person A claims to own Resource B. After validation we can conclude that (within some bounds) Person A *owns* Resource B.

Validation can be supported in one of four ways:

1. Establishing a proof of authorship by encoding the proof as part of e.g., an IPFS directory listing.
2. Establishing a proof of access/ownership by writing to the resource (e.g., posting a tweet). This is a common pattern used by services like Keybase. The value written serves two purposes: to allow discovery of the credential, and transitively the identity of the owner; and to complete the pair of assertions `"A owns B" confirmed_by controller_of(B)`.
3. Establishing proof of ownership of both the identity and the resource via mutual or combined signatures. This only applies where the resource itself is inextricably linked to key material, but it is neat and tidy.
4. Reducing proof to equality by reusing keys. For example, one could publish a DID that uses your SSB public key; the existence of _anything_ signed by the corresponding private key is a kind of existence proof that the DID _is_ the SSB identity.

Validation could further be supported by trusting the host of a resource (e.g., Twitter Corporation) as part of the chain of trust. I won't discuss this here for time reasons.

Finally, we need a decentralized way of distributing these credentials to stakeholders. I outline below several ways to do so:

1. By embedding the entire credential in the resource, e.g., in HTML metadata, in a tweet, in an SSB message, or using a well-known location à la [Well Known DID Configuration](https://identity.foundation/.well-known/resources/did-configuration/).
2. By using indirection via a _compact credential_ instead, which gives some inline metadata and a reference to another location that can supply the entire credential (e.g., an IPFS CID).
3. By implied indirection: defining a function to derive a location from the resource: e.g., using a distributed hash table with a key derived from the resource and identity. This is tricky to get right.

## Specific example: a Twitter account

An assertion is made about the Twitter profile URL, e.g., `https://twitter.com/scuasky`, in a Verifiable Credential, and signed with the DID's private key. Here we make the credential expire monthly, limiting the blast radius of losing access to the Twitter account.

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://example.org/scua/v1",
  ],
  "type": ["VerifiableCredential", "ScuaClaim"],
  "issuer": "did:example:ebfeb1f712ebc6f1c276e12ec21",
  "issuanceDate": "2021-09-09T00:00:00Z",
  "expirationDate": "2021-10-09T00:00:00Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "ownerOf": {
      "id": "https://twitter.com/scuasky",
      "name": [{
        "value": "Example Twitter Account",
        "lang": "en"
      }]
    }
  },
  "proof": {
    "type": "RsaSignature2018",
    "created": "2021-09-09T00:00:02Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:example:ebfeb1f712ebc6f1c276e12ec21#keys-1",
    "jws": "eyJhbGc…"
  }
}
```

This credential is stored in IPFS: `QmaTN32if4oQHWgYMyeSqnxfe9dgYuvk6tLBmZL2ZLh6gd`.

We can now produce a compact claim: `scua:QmaTN32if4oQHWgYMyeSqnxfe9dgYuvk6tLBmZL2ZLh6gd/did:example:ebfeb1f712ebc6f1c276e12ec21` (and we could achieve a more compact representation by using high-density encodings using emoji). These 91 characters (or even just the first 51) can be posted in a tweet or in a bio, or even as a QR code. Software encountering this string is able to (a) determine whether this Twitter account is owned by a given DID (with the longer form, it doesn't even need to hit IPFS to short-circuit on non-ownership!), and (b) can determine which DID owns this Twitter account.

This same mechanism can apply to non-DID identifiers that are associated with key material, such as SSB identities: the credential can refer to the identifier by `ssb:` URI, and we need only decide on a dereferenceable URI to put in the `verificationMethod` field.

## What about NFTs?

NFTs are tokens that can be uniquely assigned to a wallet. That's insufficient: there is nothing that actually ties a given NFT to the resource it claims ownership of, so it solves the problem of multiple people making a claim, but doesn't actually address validation of the claim. You can prove ownership of the NFT, but that proof is not transitive, and the unique ID doesn't correspond to anything useful.

## What about ENS?

ENS makes the identifier itself useful for resolution — one can prove that a particular ETH wallet owns a particular ENS name. However, that only solves the problem for ENS names; even if Twitter launched on ENS, you would have a hard time proving that you 'owned' `twitter.eth/username`, and there is no straightforward way to replicate other kinds of identifiers into ETH in a way that preserves their properties from the original system.

## Capabilities

* Extensible to new kinds of data.
* Works with non-account data.
* Works with some immutable data at point of creation.

## Why?

User agency. Resilience. Decentralization.

## Comparison to existing mechanisms

Keybase — _de facto_ centralized.
