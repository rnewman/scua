<script lang="ts">
  import type browser from 'webextension-polyfill';

  import type { CredentialReport } from '../../src/extract/extractcredential';

  export let tab: browser.Tabs.Tab;
  export let report: CredentialReport;
</script>

<!--
  If these weren't true, we wouldn't have got here.
  id === credential.issuer
  ownerOf.id === credential.canonicalURL
  -->
{#if report.found}
<dl>
  <dt>URL</dt>
  <dd>{tab.url}</dd>
  <dt>Canonical URL</dt>
  <dd>{report.canonicalURL}</dd>
  <dt>Owner</dt>
  <dd width="360px" style="overflow: auto">{report.found.credential.credentialSubject.id}</dd>
  <dt>Until</dt>
  <dd>{report.found.credential.expirationDate}</dd>
</dl>
<p>The credential is:</p>
<pre width="360px" style="overflow: auto">{JSON.stringify(report, null, 2)}</pre>
<p>This identity also owns…</p>
{:else}
<p>No credential found.</p>
{/if}