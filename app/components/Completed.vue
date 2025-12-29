<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import { useSidebar } from '~/composables/useSidebar';

const { contentMargin } = useSidebar();
const route = useRoute();

// Get score data from route query or props
const score = ref(Number(route.query.score) || 0);
const totalQuestions = ref(Number(route.query.total) || 20);

// Calculate percentage
const percentage = computed(() => {
    if (totalQuestions.value === 0) return 0;
    return Math.round((score.value / totalQuestions.value) * 100);
});

// Determine result message based on percentage
const resultMessage = computed(() => {
    if (percentage.value >= 80) return { title: 'Excellent !', subtitle: 'Vous maîtrisez parfaitement ce sujet.', color: 'green' };
    if (percentage.value >= 60) return { title: 'Bien joué !', subtitle: 'Vous avez de bonnes connaissances.', color: 'green' };
    if (percentage.value >= 40) return { title: 'À revoir', subtitle: "N'hésitez pas à réessayer.", color: 'orange' };
    return { title: 'À revoir', subtitle: "N'hésitez pas à réessayer.", color: 'red' };
});

// Fetch other formations for "Go further" section
const { data: formations } = await useFetch('/api/formations');

// Get current module ID to exclude from suggestions
const currentModuleId = route.query.moduleId as string;

// Filter out current module and limit to 2 suggestions
const suggestedFormations = computed(() => {
    if (!formations.value) return [];
    return formations.value
        .filter((f: any) => f.id !== currentModuleId)
        .slice(0, 2);
});

const handleRetry = () => {
    // Navigate back to the formation to retry
    if (currentModuleId) {
        navigateTo(`/formation/${currentModuleId}`);
    } else {
        navigateTo('/module');
    }
};

const handleGoHome = () => {
    navigateTo('/');
};
</script>

<template>
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div :class="['transition-all duration-300 min-h-screen bg-gradient-to-br from-gray-50 to-white', contentMargin]">
        <div class="flex flex-col lg:flex-row gap-8 p-8 max-w-6xl mx-auto">
            
            <!-- Result Card -->
            <div class="flex-1">
                <div class="bg-gradient-to-b from-red-50 to-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
                    
                    <!-- Mascot -->
                    <div class="mb-6">
                        <div class="w-24 h-24 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center">
                            <span class="text-5xl">🤖</span>
                        </div>
                    </div>

                    <!-- Result Title -->
                    <h1 class="text-4xl font-bold mb-2" :class="{
                        'text-green-600': resultMessage.color === 'green',
                        'text-orange-500': resultMessage.color === 'orange',
                        'text-red-500': resultMessage.color === 'red'
                    }">
                        {{ resultMessage.title }}
                    </h1>
                    <p class="text-gray-500 mb-8">{{ resultMessage.subtitle }}</p>

                    <!-- Score Display -->
                    <div class="mb-6">
                        <div class="flex items-baseline justify-center gap-1">
                            <span class="text-5xl font-bold" :class="{
                                'text-green-600': resultMessage.color === 'green',
                                'text-orange-500': resultMessage.color === 'orange',
                                'text-red-500': resultMessage.color === 'red'
                            }">{{ score }}</span>
                            <span class="text-2xl text-gray-400">/ {{ totalQuestions }}</span>
                        </div>
                        <p class="text-gray-500 text-sm mt-1">bonnes réponses</p>
                    </div>

                    <!-- Progress Bar -->
                    <div class="max-w-xs mx-auto mb-2">
                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                class="h-full rounded-full transition-all duration-500"
                                :class="{
                                    'bg-green-500': resultMessage.color === 'green',
                                    'bg-orange-500': resultMessage.color === 'orange',
                                    'bg-red-500': resultMessage.color === 'red'
                                }"
                                :style="{ width: `${percentage}%` }"
                            ></div>
                        </div>
                        <p class="text-gray-400 text-xs mt-1">{{ percentage }}% de réussite</p>
                    </div>

                    <!-- Success Badge -->
                    <div class="my-6">
                        <span class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium border border-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Module terminé • Participation enregistrée
                        </span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-3 max-w-sm mx-auto">
                        <button 
                            @click="handleRetry"
                            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Réessayer le module
                        </button>
                        
                        <button 
                            @click="handleGoHome"
                            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg shadow-green-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Terminer et revenir à l'accueil
                        </button>
                    </div>
                </div>
            </div>

            <!-- Go Further Section -->
            <div class="lg:w-80">
                <div class="bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                        <h3 class="font-bold">Allez plus loin</h3>
                    </div>
                    <p class="text-cyan-100 text-sm mb-4">Découvrez d'autres modules</p>

                    <!-- Suggested Formations -->
                    <div class="space-y-3">
                        <NuxtLink 
                            v-for="formation in suggestedFormations" 
                            :key="formation.id"
                            :to="formation.route"
                            class="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors"
                        >
                            <img 
                                v-if="formation.coverImage" 
                                :src="formation.coverImage" 
                                :alt="formation.displayName"
                                class="w-10 h-10 rounded-lg object-cover"
                            />
                            <div v-else class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <span class="text-lg">📚</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-sm truncate">{{ formation.displayName }}</p>
                                <p class="text-cyan-200 text-xs flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ formation.duration }}
                                </p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </NuxtLink>
                    </div>

                    <!-- View All Link -->
                    <NuxtLink 
                        to="/module" 
                        class="flex items-center justify-center gap-2 mt-4 text-cyan-100 hover:text-white text-sm font-medium transition-colors"
                    >
                        Voir tous les modules
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>