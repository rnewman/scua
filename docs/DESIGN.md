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

1. Establishing a proof of access/ownership by writing to the resource (e.g., posting a tweet). This is a common pattern used by services like Keybase. The value written serves two purposes: to allow discovery of the credential, and transitively the identity of the owner; and to complete the pair of assertions `"A owns B" confirmed_by controller_of(B)`.
2. Establishing proof of ownership of both the identity and the resource via mutual or combined signatures. This only applies where the resource itself is inextricably linked to key material, but it is neat and tidy. If both the DID and resource keys are available at the same time (e.g., [GPG keys](https://gpg.jsld.org/contexts/)), two separate proofs can be encoded in the same Verifiable Credential.
3. Reducing proof to equality by reusing keys. For example, one could publish a DID that uses your SSB public key; the existence of _anything_ signed by the corresponding private key is a kind of existence proof that the DID _is_ the SSB identity.
4. Establishing a proof of authorship by encoding the proof as part of the work (e.g., alongside the file in an IPFS directory listing). It is difficult to see how this can be done rigorously.

Validation could further be supported by trusting the host of a resource (e.g., Twitter Corporation) as part of the chain of trust. I won't discuss this here for time reasons.

Finally, we need a decentralized way of distributing these credentials to stakeholders. I outline below several ways to do so:

1. By embedding the entire credential in the resource, e.g., in HTML metadata, in a tweet, in an SSB message, or using a well-known location à la [Well Known DID Configuration](https://identity.foundation/.well-known/resources/did-configuration/).
2. By using indirection via a _compact credential_ instead, which gives some inline metadata and a reference to another location that can supply the entire credential (e.g., an IPFS CID).
3. By implied indirection: defining a function to derive a location from the resource: e.g., using a distributed hash table with a key derived from the resource and identity. This is tricky to get right, so I do not do so in this experiment.

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

We can now produce a compact claim: `scua:QmaTN32if4oQHWgYMyeSqnxfe9dgYuvk6tLBmZL2ZLh6gd/did:example:ebfeb1f712ebc6f1c276e12ec21` or `scua:QmaTN32if4oQHWgYMyeSqnxfe9dgYuvk6tLBmZL2ZLh6gd` (and we could achieve a more compact representation by using high-density encodings using emoji). These 91 or 51 characters can be posted in a tweet or in a bio, or even as a QR code. Software encountering this string is able to (a) determine whether this Twitter account is owned by a given DID (with the longer form, it doesn't even need to hit IPFS to short-circuit on non-ownership!), and (b) can determine which DID owns this Twitter account.

This same mechanism can apply to non-DID identifiers that are associated with key material, such as SSB identities: the credential can refer to the identifier by `ssb:` URI, and we need only decide on a dereferenceable URI to put in the `verificationMethod` field.

## Why this approach?

Most users won't already have a strong identity and keys, so constructing one makes sense. DIDs are perfect for this, and are adequately decentralized. Users with an existing keypair that they wish to use, or an existing DID, would be able to import one.

Social network accounts and websites with some user-editable section are widely used, so that was my first target. They also demonstrate how access can be used in conjunction with a signed credential to form a demonstration of ownership.

The approach is easily extended to other accounts by defining matches by origin and functions to extract data from a page. Further, it is easily extended to *non-account* resources that have their own access control mechanism: for example, wiki pages or GitHub projects, and the latter is included in the repo.

This design can be extended to more sophisticated resource types, even beyond the web: as an application platform, the extension is able to share data and work with other protocols, so any resource from which a credential document can be discovered, and some proof-of-access determined, can be claimed.

By using IPFS and DIDs, along with offline storage, the extension is relatively resilient: the loss of a particular DID provider does not impact the service as a whole. It is also strictly decentralized: other than the use of IPFS to allow for storing credentials larger than some resources can accommodate, it is dependent only on the claimed resource sites. As a webextension, a number of modern browsers are able to load and run the code, avoiding centralized gatekeeping. And by running in the end user's browser, with no remote storage at all other than the DID and public claims, the user is placed in full control.

## What about NFTs?

NFTs are tokens that can be uniquely assigned to a wallet. That's insufficient for claiming ownership of anything other than a purely synthetic token itself: there is nothing that actually ties a given NFT to the resource it claims ownership of, so it solves the problem of multiple people making a claim, but doesn't actually address validation of the claim. You can prove ownership of the NFT itself — "I have a receipt saying I paid for this receipt" — but that proof is not transitive to anything written on the receipt (the *resource*), and the unique ID doesn't correspond to anything useful. Self-minting an NFT for an external resource, or a third-party minting an NFT without corresponding access control, is no different to you or a friend issuing you a certificate of ownership for the Mona Lisa.

## What about existing IPFS content?

IPFS content is content-addressed: it doesn't have a name, an owner, or associated key material. You can *claim* ownership of it, but so can anyone else.

There is some work that attempts to [use signatures with the IPFS DAG](https://blog.ceramic.network/how-to-store-signed-and-encrypted-data-on-ipfs/) to sign content, but that is not the same thing as proof of ownership: one is reduced to comparing dates and having a very weak level of trust that the signer is the owner.

One can use blockchains to assert ownership at a point in time, but again, that is not proof of unique ownership so much as *proof of having a copy of those bytes*.

In situations where this definition of ownership as "having had the bytes" is useful, the private key associated with the user's DID can be used for signing [much like this experiment](https://github.com/mustafarefaey/private-stamp).

One can conceive of mechanisms to bake ownership declarations into a resource at the moment of creation, but this is only useful to the extent that there is some structural incentive why that precise resource must be used over another equivalent-but-unannotated version — e.g., an Apple-signed installer is a more compelling resource than a JPEG.

## What about {system with associated private keys}?

GPG, SSB, and other systems with associated key material have a shortcut process to demonstrating ownership: using the private key for a signature. It would be straightforward for a DID `A` to claim ownership of a GPG keypair `K` by simply attaching K's public key and two proofs to the Verifiable Credential: one signed with `A`'s key, and one signed with `K`. Of course, the problem of how to distribute the credential remains.

## What about ENS?

ENS makes the identifier itself useful for resolution — one can prove that a particular ETH wallet owns a particular ENS name. However, that only solves the problem for ENS names; even if Twitter launched on ENS, you would have a hard time proving that you 'owned' `twitter.eth/username`, and there is no straightforward way to replicate other kinds of identifiers into ETH in a way that preserves their properties from the original system.

## Comparison to existing mechanisms

This approach is reminiscent of Keybase, particularly the use of claiming tweets. However, the use of DIDs provides both decentralization and anonymity that Keybase does not: Keybase relies on a centralized server and has control over interoperability via protocols.
