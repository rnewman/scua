<script lang="ts">
  import type { CredentialReport } from '../../src/extract/extractcredential';
  import { findCredentialForURL } from '../../src/extract/find';

  import browser from 'webextension-polyfill';

  export let tab: browser.Tabs.Tab;
  let url = tab.url;

  // TODO: DID cache.
  // TODO: credential cache (with expiry, note problems with revocation).

  async function examineCredential(): Promise<CredentialReport | undefined> {
    if (!url) {
      console.info('No URL for tab.');
      return;
    }
    const credential = await findCredentialForURL(url);
    console.info('Credential report:', credential);
    return credential;
  }
</script>

{#await examineCredential()}
<p>Fetching credential…</p>
{:then credential}
  {#if credential}
  <!-- TODO -->
  <p>The owner of {url} ({credential.canonicalURL}) is {credential.credential.issuer}.</p>
  <p>The credential is {JSON.stringify(credential)}</p>
  <p>This identity also owns…</p>
  {:else}
  <p>Nobody has claimed ownership of {url}. Maybe you should?</p>
  {/if}
{:catch}
<p class="error">
  Unable to retrieve credentials for this page.
</p>
{/await}