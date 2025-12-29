<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

const props = defineProps<{
    users: any[];
    selectedFormation: string;
}>();

const emit = defineEmits(['export-csv', 'export-pdf']);

// Nombre de questions pour la formation sélectionnée
const totalQuestions = ref<number | null>(null);

// Récupérer le nombre de questions quand la formation change
const fetchQuestionCount = async () => {
    if (!props.selectedFormation) {
        totalQuestions.value = null;
        return;
    }

    try {
        const data = await $fetch(`/api/questions?module=${props.selectedFormation}`);
        totalQuestions.value = Array.isArray(data) ? data.length : null;
    } catch (error) {
        console.error('Erreur lors de la récupération des questions:', error);
        totalQuestions.value = null;
    }
};

// Observer les changements de formation
watch(() => props.selectedFormation, fetchQuestionCount, { immediate: true });

// --- Computed Stats ---

// 1. Total Participants
const totalParticipants = computed(() => props.users ? props.users.length : 0);

// 2. Average Score
const averageScore = computed(() => {
    if (!props.users || props.users.length === 0) return 0;
    const total = props.users.reduce((sum, user) => sum + (user.newScore || 0), 0);
    return Math.round((total / props.users.length) * 10) / 10;
});

// 3. Success Rate (pourcentage basé sur le nombre de questions si disponible, sinon 75%)
const successRate = computed(() => {
    if (!props.users || props.users.length === 0) return 0;
    const threshold = totalQuestions.value ? Math.floor(totalQuestions.value * 0.75) : 12;
    const successCount = props.users.filter(user => (user.newScore || 0) >= threshold).length;
    return Math.round((successCount / props.users.length) * 100);
});

// 4. Recent Activity (Participants in last 24h)
const recentActivity = computed(() => {
    if (!props.users || props.users.length === 0) return 0;
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return props.users.filter(user => new Date(user.createdAt) > oneDayAgo).length;
});
</script>

<template>
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        <!-- Card 1: Total Participants -->
        <div class="bg-gradient-to-tr from-green-700/18 via-zinc-600/15 to-zinc-900/15 rounded-xl p-6 
            shadow-sm border border-green-300/40">
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-green-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>

            </div>
            <h3 class="text-zinc-300 text-xs">Participants Totaux</h3>
            <div class="flex items-center gap-2">
                <p class="text-2xl font-bold text-white mt-1">{{ totalParticipants }}</p>
                <span class="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 mt-1 ml-2 rounded-full">+{{
                    recentActivity }} (24h)</span>
            </div>
        </div>

        <!-- Card 2: Average Score -->
        <div class="bg-gradient-to-tr from-purple-700/18 via-zinc-600/15 to-zinc-900/15 rounded-xl p-6 
            shadow-sm border border-purple-300/40">
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-purple-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
            </div>
            <h3 class="text-zinc-300 text-xs">Score Moyen</h3>
            <p class="text-2xl font-bold text-white mt-1">{{ averageScore }}<span
                    v-if="selectedFormation && totalQuestions" class="text-sm text-zinc-500 font-normal"> / {{
                    totalQuestions }}</span></p>
        </div>

        <!-- Card 3: Success Rate -->
        <div class="bg-gradient-to-tr from-blue-600/18 via-zinc-600/15 to-zinc-900/15 rounded-xl p-6 
            shadow-sm border border-blue-300/40">
            <div class="flex items-center justify-between mb-4">
                <div class="p-2 bg-blue-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <h3 class="text-zinc-300 text-xs">Taux de Réussite</h3>
            <p class="text-2xl font-bold text-white mt-1">{{ successRate }}%</p>
        </div>

        <!-- Card 4: Export Actions -->
        <div class="bg-gradient-to-tr from-zinc-700/25 via-zinc-600/15 to-zinc-800/20 rounded-xl p-6 
            shadow-sm border border-zinc-300/40">
            <h3 class="text-zinc-300 text-xs mb-6">Export manuel</h3>
            <div class="flex flex-col gap-2">
                <button @click="$emit('export-csv')" class="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 
                py-2 bg-gradient-to-tl from-zinc-700/55 via-zinc-600/25 to-zinc-600/55 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors 
                    border border-green-600">
                    <span>📄</span> CSV
                </button>
                <button @click="$emit('export-pdf')" class="flex-1 flex cursor-pointer items-center justify-center gap-2 px-3 
                py-2 bg-gradient-to-tl from-zinc-700/55 via-zinc-600/25 to-zinc-600/55 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors 
                    border border-red-600">
                    <span>📑</span> PDF
                </button>
            </div>
        </div>
    </div>
</template>
