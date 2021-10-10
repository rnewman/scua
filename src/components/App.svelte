<svelte:options tag={null}/>
<script lang="ts">
  import browser from 'webextension-polyfill';

  import type { CredentialFinder, CredentialReport } from '../extract/extractcredential';

  import { initializeFinders } from '../extract/find';
  import { DIDIdentity } from '../lib/id';
  import { examineCredential } from '../pages';

  import { ExtensionDIDStorage } from '../storage/dids';
  import { GraphStore } from '../storage/graph';
  import { IPFSClaimStorage } from '../storage/credentials';

  import { self, selfURI } from '../stores';

  import PresentCredential from './PresentCredential.svelte';

  //
  // Initialize everything we need:
  // * The finders, which pull info from the page and stores.
  // * Our DID and credential storage, which we pre-populate with our own DID.
  // * The URL of the current tab. There are a few ways to do this; we do it with `b.t.query`.
  //

  const didStorage: ExtensionDIDStorage = new ExtensionDIDStorage();
  const claimStorage: IPFSClaimStorage = new IPFSClaimStorage();
  const graphStore: GraphStore = new GraphStore();

  initializeFinders(claimStorage);

  didStorage.getSelf().then(s => self.set(s)).catch(e => {
    console.warn('Unable to load self DID:', e);
  });

  async function getCurrentTab(): Promise<browser.Tabs.Tab> {
    const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
    return currentTabs && currentTabs[0];
  }

  let initializing = true;

  let currentTab: browser.Tabs.Tab | undefined;
  let credentialFinder: CredentialFinder | undefined;
  let credentialReport: CredentialReport | undefined;
  let selfClaim: string | undefined;

  // We will re-render as soon as this is done.
  getCurrentTab().then(t => {
    currentTab = t;
    if (t?.url) {
      return examineCredential(t.url, didStorage).then(result => {
        if (result) {
          const { finder, report } = result;
          credentialFinder = finder;
          credentialReport = report;
          // foundCredential = report?.found;
          if (report) {
            graphStore.saveCredential(report);
          }
        }
      }).catch(e => {
        console.error('Could not examine credential.', e);
      });
    } else {
      return Promise.resolve();
    }
  }).then(() => {
    initializing = false;
  });
</script>

<main>
  {#if initializing}
    <p>Initializing…</p>
  {:else}
    <div id="validate">
      {#if $selfURI === credentialReport?.found?.credential.credentialSubject.id}
        <h1>You own this page!</h1>
      {:else}
        <h1>Who owns this page?</h1>
      {/if}
      {#if currentTab}
        {#if credentialFinder}
          {#if credentialReport?.found}
            <PresentCredential me={$selfURI} {graphStore} tab={currentTab} report={credentialReport}></PresentCredential>
          {:else}
            {#if selfClaim}
              <p>Paste the following into your Twitter bio!</p>
              <pre>scua:{selfClaim}</pre>
            {:else}
              <p>Nobody has claimed ownership of {currentTab.url}. Maybe you should?</p>
              <button type="button" disabled="{!$self}" on:click="{async () => {
                if (!$self || !credentialFinder) {
                  return;
                }
                const credential = await credentialFinder.claim($self);
                const cid = await claimStorage.add(JSON.stringify(credential));
                selfClaim = cid.toString();
              }}">Claim</button>
            {/if}
          {/if}
        {:else}
          <p>I'm afraid I don't know what to do with this page yet.</p>
        {/if}
      {:else}
        <p>No current tab.</p>
      {/if}
    </div>
    <div id="identity">
      <h1>Your identity</h1>

      <div>
        {#if $selfURI}
          <p>{$selfURI}</p>
        {:else}
          <p>No identity.</p>
          <button type="button" on:click="{() => {
            DIDIdentity.create().then(identity => {
              didStorage.setSelf(identity);
              self.set(identity);
            });
          }}">Generate</button>
        {/if}
      </div>
      <div>
        <button type="button" disabled>Import</button>
      </div>
      <div>
        <button type="button" disabled>Export</button>
      </div>
    </div>
  {/if}
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