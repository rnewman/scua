import type { IPFS } from '@chris.troutner/ipfs-core-types';
import type { IPFSPath } from '@chris.troutner/ipfs-core-types/src/utils';

import type CID from 'cids';

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