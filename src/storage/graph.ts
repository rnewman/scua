import type { CredentialReport } from "../extract/extractcredential";

// I would love to use Level or a similar store here, but getting it
// to actually build for the web with the mess of module translation
// and Node polyfills in Rollup wasted enough hours that I'd rather
// build my own trivial graph store.
// Until then, just use IndexedDB.

import { IDBPDatabase, openDB } from 'idb/with-async-ittr';

interface DataType {};

export class GraphStore {
  // public _db: Quadstore;
  public db: Promise<IDBPDatabase<DataType>>;
  constructor(name = 'scua') {
    this.db = openDB<DataType>(name, 1, {
      upgrade: (db: IDBPDatabase<DataType>, oldVersion: number, newVersion: number, transaction) => {
        const store = db.createObjectStore('credentials', {
          keyPath: 'resolved',
        });

        store.createIndex('owner', 'credential.credentialSubject.id', { unique: false });
        store.createIndex('resource', 'credential.credentialSubject.ownerOf.id', { unique: true });
      },
    });
  }

  async saveCredential(credential: CredentialReport): Promise<void> {
    const db = await this.db;

    if (!credential.found) {
      return;
    }

    const found = credential.found;

    if (!found.validated || !found.verified) {
      console.warn('Not validated and verified; not saving.');
      return;
    }

    return db.put('credentials', found).then(() => undefined);
  }

  async owns(didURI: string): Promise<string[]> {
    const db = await this.db;

    const tx = db.transaction('credentials', 'readonly');
    const idx = tx.store.index('owner');
    const acc = [];
    for await (const found of idx.iterate(didURI)) {
      console.info('Found', found.value);
      acc.push(found.value.credential.credentialSubject.ownerOf.id);
    };
    return acc;
  }
}
