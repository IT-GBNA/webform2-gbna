<script setup lang="ts">
import { ref } from 'vue';
import TrackingStats from './tracking/TrackingStats.vue';
import TrackingChart from './tracking/TrackingChart.vue';
import TrackingTable from './tracking/TrackingTable.vue';

const props = defineProps<{
    count: number;
    latestScore: any;
    users: any[];
    selectedInstitution: string;
    selectedService: string;
    selectedFormation: string;
}>();

const emit = defineEmits(['export-csv', 'export-pdf', 'refresh']);

// Collapsible state
const isStatsOpen = ref(true);

// Détecter si un filtre est actif
const isFiltered = computed(() => {
    return !!(props.selectedInstitution || props.selectedService || props.selectedFormation);
});
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- Info Alert -->
        <div v-if="!selectedInstitution && !selectedService"
            class="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 border border-amber-400/50 rounded-lg">
            <svg class="h-4 w-4 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-zinc-300">
                <span class="text-zinc-200">Astuce :</span> Pour exporter <span
                    class="text-white font-medium">tous</span> les participants, ne sélectionnez aucun filtre.
            </p>
        </div>

        <!-- Collapsible Stats + Chart Section -->
        <div class="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
            <!-- Header (clickable to toggle) -->
            <button @click="isStatsOpen = !isStatsOpen" type="button"
                class="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700/50 transition-colors cursor-pointer">
                <div class="flex items-center gap-3">
                    <svg class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span class="text-white font-medium">Statistiques & Activité</span>
                    <span class="text-zinc-500 text-sm">{{ users?.length || 0 }} participants</span>
                </div>
                <svg class="h-5 w-5 text-zinc-400 transition-transform duration-200"
                    :class="{ 'rotate-180': isStatsOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <!-- Collapsible Content -->
            <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[600px] opacity-100" leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-[600px] opacity-100" leave-to-class="max-h-0 opacity-0">
                <div v-if="isStatsOpen" class="overflow-hidden">
                    <div class="p-4">
                        <div class="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                            <!-- Left: Stats Cards (2x2 grid) -->
                            <div class="w-full lg:w-1/3 self-stretch">
                                <TrackingStats class="h-full" :users="users" :selectedFormation="selectedFormation"
                                    @export-csv="$emit('export-csv')" @export-pdf="$emit('export-pdf')" />
                            </div>

                            <!-- Right: Chart -->
                            <div class="w-full lg:w-2/3">
                                <TrackingChart :users="users" />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>

        <!-- Bottom Section: Data Table -->
        <TrackingTable :users="users" :isFiltered="isFiltered" @refresh="$emit('refresh')" />

    </div>
</template>
