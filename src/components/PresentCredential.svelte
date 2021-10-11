<script lang="ts">
  import type browser from 'webextension-polyfill';

  import type { CredentialReport } from '../extract/extractcredential';
  import type { GraphStore } from '../storage/graph';

  export let me: string;
  export let tab: browser.Tabs.Tab;
  export let report: CredentialReport;
  export let graphStore: GraphStore;

  let owned: string[] = [];
  let isMine: boolean = false;

  $: {
    if (report?.found) {
      graphStore.owns(report.found.credential.credentialSubject.id).then(urls => {
        console.info('Also owns', urls);
        owned = urls;
      });
    }
  }

  console.info('Me:', me);
  console.info('owner:', report?.found?.credential.credentialSubject.id);
  isMine = report?.found?.credential.credentialSubject.id === me;
  console.info('isMine', isMine);
</script>

<!--
  If these weren't true, we wouldn't have got here.
  id === credential.issuer
  ownerOf.id === credential.canonicalURL
  -->
{#if report.found}
  {#if !report.found.validated}
    <h2>This claim did not validate!</h2>
  {/if}
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
  {#if isMine}
  This is yours!
  {/if}
  {#if owned.length}
    <p>This identity owns:</p>
    <ul>
      {#each owned as url}
        <li>
          {url}
        </li>
      {/each}
    </ul>
  {/if}
  <p>The credential is:</p>
  <pre width="360px" style="overflow: auto">{JSON.stringify(report, null, 2)}</pre>
{:else}
<p>No credential found.</p>
{/if}