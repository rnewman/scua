<svelte:options tag={null}/>
<script lang="ts">
  import browser from 'webextension-polyfill';
  import { DIDIdentity } from '../../src/id';

  import { ExtensionDIDStorage } from '../storage';
  import PageValidator from './PageValidator.svelte';

  const storage: ExtensionDIDStorage = new ExtensionDIDStorage();

  // TODO: better error handling.
  let selfDID: DIDIdentity | undefined;
  let selfDIDURI: string | undefined;

  storage.getSelf().then(self => {
    selfDID = self;
    self.getURI().then(uri => {
      selfDIDURI = uri;
    });
  }).catch(() => undefined);

  // TODO: watch the storage! Make it a Svelte store!

  async function currentTab(): Promise<browser.Tabs.Tab> {
    const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
    return currentTabs && currentTabs[0];
  }

  async function testIPFS() {
    const start = Date.now();
    /* @ts-ignore */
    const ipfs = await window.IpfsCore.create()
    const middle = Date.now();
    const added = await ipfs.add('Hello world')
    const end = Date.now();
    console.info(added, 'took', end - start, middle - start);
    await ipfs.stop();
  }

  testIPFS();

  async function logStorage(): Promise<void> {
    console.info('Storage:', storage);

    try {
      console.info('Me:', await storage.getSelf())
    } catch (e) {
      console.info('No me.');
    }
  }

  logStorage();
</script>

<main>
  <div id="validate">
    <h1>Who owns this page?</h1>
    {#await currentTab() then tab}
    <PageValidator {tab} {storage}></PageValidator>
    {/await}
  </div>
  <div id="identity">
    <h1>Your identity</h1>

    <div>
      {#if selfDIDURI}
        <p>{selfDIDURI}</p>
      {:else}
        <p>No identity.</p>
        <button type="button" on:click="{async () => {
          const did = await DIDIdentity.create();
          await storage.setSelf(did);
          const uri = await did.getURI();
          selfDID = did;
          selfDIDURI = uri;
        }}">Generate</button>
      {/if}
    </div>
    <div>
      <button type="button">Import</button>
    </div>
    <div>
      <button type="button" disabled>Export</button>
    </div>
  </div>
  <div id="claim">
    <h1>Claim this page</h1>
    <button type="button">Claim</button>
  </div>
</main>

<style>
  main {
    padding: 1em;
    max-width: 640px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>