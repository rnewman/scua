import type { CredentialReport } from "../../src/extract/extractcredential";

// import Level from 'level-js';
// import { Quad, Quadstore, ResultType } from 'quadstore';
// import { newEngine as SPARQL } from 'quadstore-comunica';
// import { DataFactory } from 'rdf-data-factory';

export class GraphStore {
  // public _db: Quadstore;
  // public db: Promise<Quadstore>;
  constructor(name = 'scua') {
    // this._db = new Quadstore({
    //   backend: new Level('scua'),
    //   comunica: SPARQL(),
    //   dataFactory: new DataFactory(),
      // TODO: https://github.com/beautifulinteractions/node-quadstore#quadstore-class
      // prefixes: {},
    // });
    // this.db = this._db.open().then(_ => this._db);
  }

  async saveCredential(credential: CredentialReport): Promise<void> {
    // const db = await this.db;

    // if (!credential.found) {
    //   return;
    // }

    // const found = credential.found;

    // if (!found.validated || !found.verified) {
    //   console.warn('Not validated and verified; not saving.');
    //   return;
    // }
    // const cred = credential.found.credential;
    // const s = db.dataFactory.namedNode(credential.found.resolved);
    // const nn = (s: string) => db.dataFactory.namedNode(s);
    // const cv1 = (s: string) => nn(`https://www.w3.org/2018/credentials/v1#${s}`);
    // const scua = (s: string) => nn(`https://example.org/scua/v1#${s}`);
    // const xsd = (s: string) => nn(`http://www.w3.org/2001/XMLSchema#${s}`);
    // const xsdDateTime = xsd('dateTime');

    // const owner = nn(cred.credentialSubject.id);

    // const quads: Quad[] = [
    //   db.dataFactory.quad(s, cv1('#expirationDate'), db.dataFactory.literal(cred.expirationDate, xsdDateTime)),
    //   db.dataFactory.quad(s, cv1('#issuanceDate'), db.dataFactory.literal(cred.issuanceDate, xsdDateTime)),
    //   db.dataFactory.quad(s, cv1('#credentialSubject'), owner),
    //   db.dataFactory.quad(owner, scua('ownerOf'), nn(cred.credentialSubject.ownerOf.id)),
    // ];
    // await db.multiPut(quads);
  }

  async owns(didURI: string): Promise<string[]> {
    return [];
    // const db = await this.db;

    // Shame this doesn't support bindings.
    // TODO: escaping for safety!
    // const result = await db.sparql(`SELECT ?o WHERE { <${didURI}> <https://example.org/scua/v1#ownerOf> ?o }`);
    // if (result.type !== ResultType.BINDINGS) {
    //   throw new Error(`Unexpected query result ${result.type}.`);
    // }
    // console.info('Results:', result.items);
    // return result.items.map(binding => binding['o'].value);
  }
}
