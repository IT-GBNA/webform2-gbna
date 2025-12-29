<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar';
import ModulesSection from '~/components/ModulesSection.vue';

const { contentMargin: marginClass } = useSidebar();

// Fetch formations from API
const { data: formations, pending, error } = await useFetch('/api/formations');
</script>

<template>
  <!-- Sidebar -->
  <Sidebar />

  <!-- Main Content -->
  <div :class="['transition-all duration-300 min-h-screen', marginClass]">
    <div class="p-10 max-w-7xl mx-auto">
      <ModulesSection :formations="formations" :pending="pending" :error="error" title="Les modules disponibles"
        subtitle="Parcourez nos formations interactives pour renforcer vos compétences en cybersécurité ou autre sujets." />
    </div>
  </div>
</template>