# Notes on problem statement

> "Link them in a way that anyone can verify you are the author/owner of all"

Who is "you"? What is "are"? And what precisely do we mean by “verify”? This sounds like an epistemological coffee break, but these questions define the shape of a solution.

I will rephrase this prompt in slightly more formal terms:

> Formulate and distribute a set of machine-verifiable assertions that establish links between your *identities*, *resources*, and *credentials* via *documents* and *identifiers* such that a third party can determine that a holder of your credential, associated with your explicit or implicit identity, had recent access to each mutable resource, or was the creator of an immutable resource. Attackers should not be able to formulate verifiable assertions for an identity/resource pair without control of both the associated credential and the resource. Identities do not necessarily represent individuals (or even humans), nor is there a 1:1 relationship between entities and identities.

There are many kinds of resource — a domain, a page located via a URL, decentralized data identified by a hash, or a self-identifying public key — and so the mechanisms of proof of access (and indeed canonicalization steps) will be open and varied. Some kinds of identifier (e.g., an SSB identity) *are* a credential, some (e.g., a DID) *provide* credentials, and others (e.g., a Twitter account) do neither.

Access and ownership can change over time as passwords and money change hands.

## Ownership and authorship are not the same thing

Consider a Twitter account and an IPFS CID.

A Twitter account can change hands, can be accessed/owned by multiple individuals or by automated software, and is mediated by a corporation. The description of the account, and the ability to demonstrate effective ownership/access, is tied to authenticated HTTP requests. It is generally not possible to establish who created a Twitter account, only to prove ongoing access rights.

An IPFS CID has a 1:1 relationship with a blob of data. It is immutable, unattributed, and has no centralized point of control. It is not possible to prove ongoing ownership of an existing CID or blob — indeed, the concept is meaningless. It is possible to prove *authorship* of a *directory*, storing some metadata alongside the blob, and it is possible to uniquely link a blob to one such directory either strongly or weakly by encrypting the contents or appending a signature.

It is useful to establish both ownership and authorship, but it is worth remembering that they are different things.

## Ownership of a resource implies access

It is a simplifying assumption to declare that access to a resource is necessary but not sufficient to establish ownership or authorship.

Unfortunately, *access* does not necessarily imply *authorship*, *ownership*, or the human understanding of identity or representation: for example, Joe Biden very likely does not have the actual login credentials for @potus.

Access rights change over time. For the purposes of identity, the access to *all* resources either *overlaps* at the point of verification, or *continues* in order to support real-time verification challenges. Verifying *access* at a point in time has challenges around availability and abuse.

## Access implies ownership

For most or all resources we have little option but to make this assumption. This is an open area of research.

## Identity can be explicit or implicit

We could choose to define identity by extension: simply that *the same* entity owns [github.com/rnewman](http://github.com/rnewman) and [twitter.com/rnewman](http://twitter.com/rnewman), and that's enough. Or we could introduce some kind of canonical identifier (avoiding centralization — remember i-names? =rn…), perhaps privileging some identifier like a DID. However, a credential needs to be introduced at some point, and that credential acts as a proxy for an anonymous, implicit identifier: “the thing that owns this credential”. Furthermore, the credential needs to be retrieved for verification, which means it must be identified and locatable, which pushes it still further towards the role of an identifier/credential pair.

## Trust

This system rests on trust: only the entity associated with an identity has access to its credentials, revoked access is timely, etc.

It also rests on a real-world understanding of identity: that if User A controls Identity B and Credential C, and User A has access to Account D, and User A claims and proves that Identity B owns Account D, then in human terms “A is D”. Sometimes, as with corporate CEO and political accounts, the definition of “controls” and account access include a number of non-cryptographic relationships, which can lead to an incorrect conclusion.

## Problems and open questions (more discussion needed)

* Revocation
* Access by multiple parties — communal identity
* Validity/expiration
* Indirection (e.g., attestation of identity by third parties)
* DPKI (I use DID/ION to make someone else worry about this problem, but it warrants discussion)
* Attack vectors: DNS, Twitter staffers, tricking someone into posting a claim message, reverting to a previous identity that is now compromised…
* External referents for identity (how do I link to an email address?)

## See also

* [InterRep](https://jaygraber.medium.com/introducing-interrep-255d3f56682)
* [Well-known DID/Domain Linkage Credential](https://identity.foundation/.well-known/resources/did-configuration/)