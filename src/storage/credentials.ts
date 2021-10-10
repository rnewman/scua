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
    console.info('Getting claim', cid);
    const ipfs = await this.ipfs;
    const decoder = new TextDecoder()
    let content = ''

    // This will time out if the data wasn't pinned or is otherwise unavailable.
    const chunks = ipfs.cat(cid, { timeout: 3_000 });
    for await (const chunk of chunks) {
      content += decoder.decode(chunk)
    }
    return content;
  }

  async stop(): Promise<void> {
    return this.ipfs.then(ipfs => ipfs.stop());
  }
}