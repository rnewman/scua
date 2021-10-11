# scua

An exploration into distributed identity, addressing the Bluesky 'Satellite' challenge.

*scua* is the Old English word for cloud, which ended up as today's word *sky*. I couldn't pass up a word containing <abbr title="User Agent">UA</abbr> (User-Agent).

See [DISCUSSION.md](docs/DISCUSSION.md) for a response to the Satellite prompt and some discussion of the approach taken.

See [DESIGN.md](docs/DESIGN.md) for an overview of the solution implemented in this repo and some brief analysis of other systems.

## Caveats

This project is an experiment. It has not been vetted by experts, it cuts corners in implementation, and is likely to be cryptographically unsound. Be warned.

Note particularly that this system generates private key material for DIDs and stores it in the browser's storage layer. Additionally, those private keys can be trivially exported, and must be stored in plaintext for later re-import. Do not use valuable private keys when evaluating this system.

## Tooling

This project uses:

* [DID](https://w3c-ccg.github.io/did-primer/)s as stable service- and resource-independent identifiers.
* [ION](https://blog.ipfs.io/2021-03-24-own-your-identity-with-ion/) as an identity network that uses DIDs and Sidetree to provide DPKI.
* Verifiable Credentials as a document format to make and verify assertions.

## Dependencies

### macOS

For development you should install [HomeBrew](https://brew.sh/), then the following:

#### NodeJS

NodeJS is at v16 now. Some systems (e.g., ION) are only tested with NodeJS 14. Use [nvm](https://github.com/nvm-sh/nvm) to manage your NodeJS versions:

```sh
brew install nvm
nvm install 14
nvm install 16
nvm use 16
```

## Getting started

```sh
npm install
cd webextension
npm install
npm run build
```

Now add the WebExtension to Chrome via [chrome://extensions/](chrome://extensions/): choose "Load unpacked" and pick the `webextension` directory. You can test similarly in Firefox via `about:debugging`

You can also package the extension to load via the Add-ons UI:

```sh
npm install --global web-ext
web-ext build
```

On a Twitter profile page, click the icon in the toolbar.

## Critique of tooling

### IPFS packages

A number of the IFPS packages have broken dependencies, missing dependencies, or other issues; for example, `@chris.troutner/ipfs-core-types` depends on `ipld-dag-pb` which is deprecated (replaced by `@ipld/dag-pb`) and broken:

```
node_modules/ipld-dag-pb/dist/src/genCid.d.ts:15:37 - error TS2307: Cannot find module 'multihashes/dist/src/constants' or its corresponding type declarations.

15 export const defaultHashAlg: import("multihashes/dist/src/constants").HashCode;
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

This makes it difficult to keep a client working, and indeed the non-browser part of this repo is currently broken by this IPFS code.

### Content Security Policy

Additionally, IPFS and ION both require connections to various nodes, and that set is not guaranteed to remain unchanged. This is in tension with the need for WebExtensions to specify an exhaustive and tight Content Security Policy; a client that connects to the ION network and IPFS essentially needs to allow for arbitrary websockets, which I did not do in this experiment for security reasons. Changing this assumption is necessary to achieve true decentralization, but requires a great deal more scrutiny around security.

### Pinning

Storage in IPFS is not persistent unless a node pins content on your behalf. Control over pinning from a fully decentralized, client-only piece of software is a challenge to say the least. This could be partly addressed by re-adding credentials each time the client connects to IPFS, and allowing credentials to be unavailable for some period of time while client nodes are absent. This problem is a challenge for IPFS as a whole.
