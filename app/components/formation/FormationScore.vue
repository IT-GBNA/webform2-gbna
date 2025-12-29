<script setup>
import { computed, ref, onMounted } from 'vue';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

const props = defineProps({
    score: {
        type: Number,
        required: true
    },
    questionsHistory: {
        type: Array,
        default: () => []
    },
    participantName: {
        type: String,
        default: 'Participant'
    },
    moduleId: {
        type: String,
        required: true
    },
    totalQuestions: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['retry']);

const showScore = ref(false);
const suggestedFormations = ref([]);

// Fonction pour mélanger un tableau (Fisher-Yates)
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

onMounted(async () => {
    // Récupérer les formations suggérées
    try {
        const formations = await $fetch('/api/formations');
        const otherFormations = formations.filter(f => f.id !== props.moduleId);
        const shuffled = shuffleArray(otherFormations);
        suggestedFormations.value = shuffled.slice(0, 3);
    } catch (error) {
        console.error('Erreur lors du chargement des formations suggérées:', error);
    }

    setTimeout(() => {
        showScore.value = true;
    }, 100);
});

const percentage = computed(() => {
    if (props.totalQuestions === 0) return 0;
    return Math.round((props.score / props.totalQuestions) * 100);
});

const isPerfect = computed(() => percentage.value === 100);

const scoreData = computed(() => {
    const pct = percentage.value;
    if (pct === 100) {
        return {
            message: "Parfait !",
            subtitle: "Vous maîtrisez parfaitement ce module",
            color: "from-amber-500 to-amber-400",
            lottieUrl: "/Trophy.lottie",
            bgColor: "bg-gradient-to-br from-amber-50 to-amber-100"
        };
    } else if (pct >= 80) {
        return {
            message: "Excellent !",
            subtitle: "Très bonne maîtrise du sujet",
            color: "from-green-500 to-green-400",
            lottieUrl: "/congratulation.lottie",
            bgColor: "bg-gradient-to-tr from-green-50 to-green-100"
        };
    } else if (pct >= 50) {
        return {
            message: "Pas mal !",
            subtitle: "Vous pouvez encore progresser",
            color: "from-green-500 to-green-400",
            lottieUrl: "/success.lottie",
            bgColor: "bg-gradient-to-tr from-green-50 to-green-100"
        };
    } else {
        return {
            message: "À revoir",
            subtitle: "N'hésitez pas à réessayer",
            color: "from-red-600 to-red-700",
            lottieUrl: "/tryagain.lottie",
            bgColor: "bg-gradient-to-br from-red-50 to-red-100"
        };
    }
});

const handleRetry = () => {
    emit('retry');
};
</script>

<template>
    <div
        class="min-h-screen w-full flex items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-100 via-white to-slate-100">

        <!-- Container principal avec position relative -->
        <div v-if="showScore" class="relative">

            <!-- Card principale du score - Centrée -->
            <div class="w-[600px] max-w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">

                <!-- Header avec gradient -->
                <div :class="[scoreData.bgColor, 'pb-8 px-8']">
                    <!-- Animation Lottie -->
                    <div class="flex justify-center">
                        <DotLottieVue style="height: 250px; width: 250px" autoplay loop :src="scoreData.lottieUrl" />
                    </div>

                    <!-- Message principal -->
                    <h1
                        :class="`text-4xl font-bold text-center bg-gradient-to-b ${scoreData.color} bg-clip-text text-transparent`">
                        {{ scoreData.message }}
                    </h1>
                    <p class="text-center text-gray-600 mt-2 text-sm">{{ scoreData.subtitle }}</p>
                </div>

                <!-- Contenu principal -->
                <div class="px-8 py-8">
                    <!-- Score -->
                    <div class="text-center mb-8">
                        <div class="flex items-baseline justify-center gap-2 mb-2">
                            <span
                                :class="`text-7xl font-black bg-gradient-to-b ${scoreData.color} bg-clip-text text-transparent leading-none`">
                                {{ score }}
                            </span>
                            <span class="text-3xl text-gray-300 font-light">/</span>
                            <span class="text-4xl text-gray-400 font-semibold">{{ totalQuestions }}</span>
                        </div>
                        <p class="text-gray-500 text-sm">bonnes réponses</p>

                        <!-- Barre de progression -->
                        <div class="mt-4 max-w-xs mx-auto">
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div :class="`h-full bg-gradient-to-r ${scoreData.color} rounded-full transition-all duration-1000 ease-out`"
                                    :style="`width: ${percentage}%`"></div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">{{ percentage }}% de réussite</p>
                        </div>
                    </div>

                    <!-- Message de confirmation -->
                    <div class="text-center mb-8">
                        <div
                            class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Module terminé • Participation enregistrée
                        </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="space-y-3">
                        <button v-if="!isPerfect" @click="handleRetry"
                            class="w-full cursor-pointer px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Réessayer le module
                        </button>

                        <NuxtLink to="/"
                            class="w-full block px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] text-center">
                            <span class="flex items-center justify-center gap-3">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Terminer et revenir à l'accueil
                            </span>
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Section "Allez plus loin" - Positionnée en absolu à droite -->
            <div v-if="suggestedFormations.length > 0"
                class="hidden lg:block absolute left-full top-0 ml-6 w-96 animate-slide-in">
                <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-sky-600/75 to-sky-500/75 px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-white/20 rounded-lg">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                            <h3 class="text-white font-bold text-lg">Allez plus loin</h3>
                        </div>
                        <p class="text-sky-100 text-sm mt-1">Découvrez d'autres modules</p>
                    </div>

                    <!-- Liste des formations suggérées -->
                    <div class="divide-y divide-gray-100">
                        <NuxtLink v-for="formation in suggestedFormations" :key="formation.id" :to="formation.route"
                            class="group flex items-center gap-4 p-4 hover:bg-sky-50 transition-all duration-200">

                            <!-- Image miniature -->
                            <div class="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                <img v-if="formation.coverImage" :src="formation.coverImage"
                                    :alt="formation.displayName"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div v-else
                                    class="w-full h-full bg-gradient-to-br from-sky-200 to-sky-100 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>

                            <!-- Infos de la formation -->
                            <div class="flex-1 min-w-0">
                                <h4
                                    class="text-sm font-semibold text-gray-800 group-hover:text-sky-700 transition-colors truncate">
                                    {{ formation.displayName }}
                                </h4>
                                <p class="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ formation.duration }}
                                </p>
                            </div>

                            <!-- Flèche -->
                            <svg class="w-4 h-4 text-gray-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all flex-shrink-0"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </NuxtLink>
                    </div>

                    <!-- Footer -->
                    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <NuxtLink to="/module"
                            class="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 justify-center">
                            Voir tous les modules
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="!showScore" class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
    </div>
</template>

<style scoped>
@keyframes scale-in {
    from {
        opacity: 0;
        transform: scale(0.9);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-scale-in {
    animation: scale-in 0.4s ease-out;
}

.animate-slide-in {
    animation: slide-in 0.5s ease-out 0.3s forwards;
    opacity: 0;
}
</style>
