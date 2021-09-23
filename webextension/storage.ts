import { DIDIdentity } from "../src/id";

import browser from 'webextension-polyfill';

export class ExtensionDIDStorage {
  constructor(private prefix: string = 'scua.dids') {
  }

  private async payloadForDID(did: DIDIdentity, payload: Record<string, string> = {}): Promise<Record<string, string>> {
    const id = this.prefix + '.' + await did.getURI();
    const value = await did.serialize();
    payload[id] = value;
    return payload;
  }

  private me(): string {
    return this.prefix + '.' + 'me';
  }

  async getSelf(): Promise<DIDIdentity> {
    const me = this.me();
    const id = (await browser.storage.local.get(me))[me];

    if (!id) {
      throw new Error('No me.');
    }

    const did = await this.retrieve(id);
    if (did === undefined) {
      throw new Error('Invalid DID');
    }

    return did;
  }

  async setSelf(did: DIDIdentity): Promise<void> {
    const payload = {[this.me()]: await did.getURI()};
    return browser.storage.local.set(await this.payloadForDID(did, payload));
  }

  async store(did: DIDIdentity): Promise<void> {
    return browser.storage.local.set(await this.payloadForDID(did));
  }

  async retrieve(didURI: string): Promise<DIDIdentity | undefined> {
    const id = this.prefix + '.' + didURI;
    const records = await browser.storage.local.get(id);
    return DIDIdentity.deserialize(records[id]);
  }
}
