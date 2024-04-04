<template>
  <div id="app">
    <DiscordActivity />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import DiscordActivity from './components/DiscordActivity.vue';

export default defineComponent({
  name: 'App',
  components: {
    DiscordActivity,
  },
});
</script>
