<svelte:options tag={null}/>
<script lang="ts">
  import PageValidator from './PageValidator.svelte';

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
</script>

<main>
  <div id="validate">
    <h1>Who owns this page?</h1>
    {#await currentTab() then tab}
    <PageValidator {tab}></PageValidator>
    {/await}
  </div>
  <div id="identity">
    <h1>Your identity</h1>
    <div>
      <button type="button">Generate</button>
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