import browser from 'webextension-polyfill';

import { DIDIdentity, fetchDID } from "../lib/id";
import type { DIDResponse } from "../lib/did";

const getOne = async (key: string): Promise<any | undefined> => {
  console.info('Loading key', key);
  const records = await browser.storage.local.get(key);
  console.info('Got', records, 'for', key);
  const record = records && records[key];
  if (!record) {
    return;
  }
  return record;
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

    const did = await getOne(this.identityKey(id)).then(payload => (payload && DIDIdentity.deserialize(payload)));
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

