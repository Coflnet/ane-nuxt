<template>
  <AneTextField type="email" placeholder="Email" v-model="modal" />
</template>

<script setup lang="ts">

const modal = defineModel();

</script>
