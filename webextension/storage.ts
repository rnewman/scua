import { DIDIdentity, fetchDID } from "../src/id";
import type { IPFS } from '@chris.troutner/ipfs-core-types';
import type { IPFSPath } from '@chris.troutner/ipfs-core-types/src/utils';
import type CID from 'cids';

import browser from 'webextension-polyfill';
import type { DIDResponse } from "../src/did";

const getOne = async (key: string): Promise<any | undefined> => {
  const records = await browser.storage.local.get(key);
  console.info('Got', records, 'for', key);
  const record = records && records[key];
  if (!record) {
    return;
  }
  return record;
}

// TODO: failure.
// TODO: DID cache.
// TODO: credential cache (with expiry, note problems with revocation).

export class IPFSClaimStorage {
  private ipfs: Promise<IPFS>;
  constructor() {
    /* @ts-ignore */
    this.ipfs = window.IpfsCore.create();
  }

  async add(claim: string): Promise<CID> {
    const ipfs = await this.ipfs;
    return ipfs.add({
      path: 'claim.json',
      content: new TextEncoder().encode(claim),
    }).then(added => added.cid);
  }

  async get(cid: IPFSPath): Promise<string> {
    const ipfs = await this.ipfs;
    const decoder = new TextDecoder()
    let content = ''
    for await (const chunk of ipfs.cat(cid)) {
      content += decoder.decode(chunk)
    }
    return content;
  }

  async stop(): Promise<void> {
    return this.ipfs.then(ipfs => ipfs.stop());
  }
}

// DIDResponses (that is, other people's DIDs) are stored as JSON objects.
// DIDIdentities (that is, our own rich identity class) are stored serialized as strings.
export class ExtensionDIDStorage {
  constructor(private prefix: string = 'scua.dids') {
  }

  private self(): string {
    return this.prefix + '.self';
  }

  private responseKey(didURI: string): string {
    return this.prefix + '.res.' + didURI;
  }

  private identityKey(didURI: string): string {
    return this.prefix + '.id.' + didURI;
  }

  async getSelf(): Promise<DIDIdentity> {
    const me = this.self();
    const id = await getOne(me);

    if (!id) {
      throw new Error('No me.');
    }

    const did = await getOne(this.identityKey(id)).then(payload => payload && DIDIdentity.deserialize(payload));
    if (did === undefined) {
      throw new Error('Invalid DID');
    }

    return did;
  }

  async setSelf(did: DIDIdentity): Promise<void> {
    const uri = await did.getURI();
    const id = this.identityKey(uri);
    const value = await did.serialize();
    const payload: Record<string, string> = {
      [id]: value,
      [this.self()]: uri,
    };
    console.info('Storing', payload);
    return browser.storage.local.set(payload);
  }

  async store(did: DIDResponse): Promise<void> {
    const key = this.responseKey(did.didDocument.id);
    return browser.storage.local.set({
      [key]: did,
    });
  }

  async retrieve(didURI: string): Promise<DIDResponse | undefined> {
    const id = this.responseKey(didURI);
    return getOne(id);
  }

  async lookup(didURI: string): Promise<DIDResponse | undefined> {
    const existing = await this.retrieve(didURI);
    if (existing) {
      return existing;
    }

    const fetched = await fetchDID(didURI);
    await this.store(fetched);
    return fetched;
  }
}
