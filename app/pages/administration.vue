<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="min-h-screen bg-zinc-900">
    <div class="transition-all duration-300">
      <AdminDashboard />
    </div>
  </div>
</template>
<style>
h1 {
  font-family: Inter;
  font-style: normal;
  font-weight: 700;
  font-size: 54px;
}

.box {
  transition: 2s;
}

.count {
  font-size: 40px;
  padding: 15px;
}

.lastUser {
  font-weight: 400;
  font-stretch: semi-expanded;
  font-size: 13px;
  color: lightgray;
}
</style>
