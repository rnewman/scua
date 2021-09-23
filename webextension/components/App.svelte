<svelte:options tag={null}/>
<script lang="ts">
  import browser from 'webextension-polyfill';
import { initializeFinders } from '../../src/extract/find';
  import { DIDIdentity } from '../../src/id';
  import { TwitterClaim } from '../../src/resources/twitter';

  import { ExtensionDIDStorage, IPFSClaimStorage } from '../storage';
  import PageValidator from './PageValidator.svelte';

  const didStorage: ExtensionDIDStorage = new ExtensionDIDStorage();
  const claimStorage: IPFSClaimStorage = new IPFSClaimStorage();

  initializeFinders(claimStorage);

  // TODO: better error handling.
  let selfDID: DIDIdentity | undefined;
  let selfDIDURI: string | undefined;

  didStorage.getSelf().then(self => {
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

  async function logStorage(): Promise<void> {
    console.info('Storage:', didStorage);

    try {
      console.info('Me:', await didStorage.getSelf())
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
    <PageValidator {tab} storage={didStorage}></PageValidator>
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
          await didStorage.setSelf(did);
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
    <button type="button" disabled="{!selfDID}" on:click="{() => {
      const claimer = new TwitterClaim('scuasky');
      if (!selfDID) {
        return;
      }
      claimer.claim(selfDID)
             .then(credential => claimStorage.add(JSON.stringify(credential)))
             .then(cid => console.info('Your claim:', cid.toString()));
    }}">Claim</button>
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