<script setup lang="ts">
import { computed } from 'vue';
import CustomDropdown from '../ui/CustomDropdown.vue';

const props = defineProps<{
    institutions: { name: string }[];
    services: { name: string }[];
    formations: { id: string; displayName: string }[];
    selectedInstitution: string;
    selectedService: string;
    selectedFormation: string;
    searchPerformed?: boolean;
    users?: any[];
}>();

const emit = defineEmits(['update:selectedInstitution', 'update:selectedService', 'update:selectedFormation', 'search']);

// Transform data for CustomDropdown
const institutionOptions = computed(() => [
    { value: '', label: 'Tous les établissements' },
    ...props.institutions.map(i => ({ value: i.name, label: i.name }))
]);

const serviceOptions = computed(() => [
    { value: '', label: 'Tous les services' },
    ...props.services.map(s => ({ value: s.name, label: s.name }))
]);

const formationOptions = computed(() => [
    { value: '', label: 'Toutes les formations' },
    ...props.formations.map(f => ({ value: f.id, label: f.displayName }))
]);
</script>

<template>
    <div class="bg-zinc-800 rounded-xl border border-zinc-700">
        <div class="flex items-center gap-4 px-4 py-3">
            <!-- Filter Icon -->
            <div class="flex items-center gap-2 text-zinc-400 border-r border-zinc-700 pr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 flex-wrap">
                <!-- Établissement -->
                <CustomDropdown :modelValue="selectedInstitution"
                    @update:modelValue="$emit('update:selectedInstitution', $event)" :options="institutionOptions"
                    placeholder="Tous les établissements" />

                <span class="text-zinc-600">|</span>

                <!-- Services (disabled if no institution selected) -->
                <CustomDropdown :modelValue="selectedService"
                    @update:modelValue="$emit('update:selectedService', $event)" :options="serviceOptions"
                    placeholder="Tous les services" :disabled="!selectedInstitution" />

                <span class="text-zinc-600">|</span>

                <!-- Formations -->
                <CustomDropdown :modelValue="selectedFormation"
                    @update:modelValue="$emit('update:selectedFormation', $event)" :options="formationOptions"
                    placeholder="Toutes les formations" />
            </div>
        </div>
    </div>
</template>
