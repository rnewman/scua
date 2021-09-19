<svelte:options tag={null}/>
<script lang="ts">
  // import browser from "webextension-polyfill";
  console.info('yyy');
</script>

<main>
  <p>Hello, world</p>
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