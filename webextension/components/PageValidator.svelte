<script lang="ts">
  import type browser from 'webextension-polyfill';

  import type { CredentialReport } from '../../src/extract/extractcredential';
  import { findCredentialForURL } from '../../src/extract/find';
  import type { ExtensionDIDStorage } from '../storage';

  export let tab: browser.Tabs.Tab;
  export let storage: ExtensionDIDStorage;

  let url = tab.url;

  // TODO: DID cache.
  // TODO: credential cache (with expiry, note problems with revocation).

  async function examineCredential(): Promise<CredentialReport | undefined> {
    if (!url) {
      console.info('No URL for tab.');
      return;
    }
    const credential = await findCredentialForURL(url, storage);
    console.info('Credential report:', credential);
    return credential;
  }
</script>

{#await examineCredential()}
<p>Fetching credential… from {storage}</p>
{:then credential}
  {#if credential}

  <!--
    If these weren't true, we wouldn't have got here.
    id === credential.issuer
    ownerOf.id === credential.canonicalURL
    -->
  <dl>
    <dt>URL</dt>
    <dd>{url}</dd>
    <dt>Canonical URL</dt>
    <dd>{credential.canonicalURL}</dd>
    <dt>Owner</dt>
    <dd width="360px" style="overflow: auto">{credential.credential.credentialSubject.id}</dd>
    <dt>Until</dt>
    <dd>{credential.credential.expirationDate}</dd>
  </dl>
  <p>The credential is:</p>
  <pre width="360px" style="overflow: auto">{JSON.stringify(credential, null, 2)}</pre>
  <p>This identity also owns…</p>
  {:else}
  <p>Nobody has claimed ownership of {url}. Maybe you should?</p>
  {/if}
{:catch}
<p class="error">
  Unable to retrieve credentials for this page.
</p>
{/await}