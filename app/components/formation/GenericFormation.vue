<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../Sidebar.vue';
import FormationForm from './FormationForm.vue';
import FormationVideo from './FormationVideo.vue';
import FormationQuiz from './FormationQuiz.vue';
import FormationScore from './FormationScore.vue';

const props = defineProps({
    moduleId: {
        type: String,
        required: true
    }
});

const { contentMargin } = useSidebar();

// État global
const quizStarted = ref(false);
const quizVisible = ref(false);
const thankYouPage = ref(false);
const formData = ref({});
const finalScore = ref(0);
const totalQuestionsCount = ref(0);
const questionsHistory = ref([]);
const isLoading = ref(false);
const formationTitle = ref('');
const videoUrl = ref('');

// Animation states
const isTransitioning = ref(false);
const showForm = ref(true);

// Fetch formation details
onMounted(async () => {
    try {
        const data = await $fetch('/api/formations');
        const formation = data.find(f => f.id === props.moduleId);
        if (formation) {
            formationTitle.value = formation.displayName;
            videoUrl.value = formation.videoUrl;
        }
    } catch (error) {
        console.error('Error fetching formation details:', error);
    }
});

// Gérer la soumission du formulaire avec animation
const handleFormSubmit = (data) => {
    formData.value = data;
    localStorage.setItem('formData', JSON.stringify(data));

    // Démarrer l'animation de transition
    isTransitioning.value = true;
    showForm.value = false;

    // Après l'animation, passer au quiz
    setTimeout(() => {
        quizStarted.value = true;
        isTransitioning.value = false;
    }, 300);
};

// Afficher le quiz
const handleStartQuiz = () => {
    quizVisible.value = true;
};

// Gérer la complétion du quiz
const handleQuizComplete = async (data) => {
    finalScore.value = data.score;
    totalQuestionsCount.value = data.totalQuestions || 16;
    questionsHistory.value = data.history;

    // Préparer les données pour l'envoi
    const dataToSend = {
        ...formData.value,
        newScore: data.score,
        totalQuestions: data.totalQuestions, // Nombre de questions posées (max 20)
        createdAt: new Date(),
        moduleId: props.moduleId // Add module ID to saved data
    };

    try {
        isLoading.value = true;

        const { data: responseData, error } = await useFetch('/api/routes/save', {
            method: 'POST',
            body: dataToSend
        });

        if (error.value) {
            console.error('Erreur lors de la sauvegarde:', error.value);
        }

        // Afficher la page de résultat
        thankYouPage.value = true;
    } catch (err) {
        console.error('Erreur:', err);
    } finally {
        isLoading.value = false;
    }
};

// Gérer le bouton Réessayer
const handleRetryQuiz = () => {
    console.log('🔄 Réessayer le quiz - Retour au quiz');
    thankYouPage.value = false;
    // Le quiz est déjà visible car quizVisible est true
};
</script>

<template>
    <!-- Sidebar - Cachée pendant le quiz -->
    <Sidebar v-if="!quizStarted" />

    <!-- Main Content - Centré quand la sidebar est cachée -->
    <div :class="['transition-all duration-300', quizStarted ? 'w-full' : contentMargin]"
        :style="quizStarted ? '' : 'width: calc(100% - 16rem);'">

        <div class="min-h-screen relative overflow-hidden w-full">
            <!-- Quiz Preview (Blurred Background) - Visible before quiz starts -->
            <Transition enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="blur-lg opacity-30 scale-95" enter-to-class="blur-0 opacity-100 scale-100"
                leave-active-class="transition-all duration-200 ease-in" leave-from-class="blur-0 opacity-100"
                leave-to-class="blur-lg opacity-0">
                <div v-if="!quizStarted" class="absolute inset-0 overflow-hidden">
                    <!-- Blurred Quiz Preview -->
                    <div :class="[
                        'pointer-events-none origin-center transition-all duration-300',
                        isTransitioning ? 'blur-sm opacity-70 scale-100' : 'blur-md opacity-40 scale-95'
                    ]">
                        <FormationQuiz :moduleId="moduleId" :formationTitle="formationTitle" :preview="true" />
                    </div>
                </div>
            </Transition>

            <!-- Formulaire d'inscription (Overlay) with animation -->
            <ClientOnly>
                <Transition enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95 translate-y-4"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition-all duration-250 ease-in"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-105 -translate-y-4">
                    <div v-if="showForm && !quizStarted" class="relative z-10">
                        <FormationForm :formationTitle="formationTitle" @submit="handleFormSubmit" />
                    </div>
                </Transition>
            </ClientOnly>

            <!-- Module de formation (Vidéo + Quiz) with animation -->
            <Transition enter-active-class="transition-all duration-300 ease-out delay-100"
                enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0">
                <div v-if="quizStarted && !thankYouPage">
                    <!-- Vidéo -->
                    <FormationVideo :institution="formData.institution" :videoUrl="videoUrl"
                        :formationTitle="formationTitle" @start-quiz="handleStartQuiz" />

                    <!-- Quiz (affiché seulement après clic sur "Commencer le quizz") -->
                    <Transition enter-active-class="transition-all duration-200 ease-out"
                        enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0">
                        <div v-if="quizVisible">
                            <FormationQuiz :moduleId="moduleId" :formationTitle="formationTitle"
                                @complete="handleQuizComplete" />
                        </div>
                    </Transition>
                </div>
            </Transition>

            <!-- Page de résultat -->
            <div v-if="thankYouPage" class="w-full">
                <FormationScore :score="finalScore" :questionsHistory="questionsHistory"
                    :totalQuestions="totalQuestionsCount"
                    :participantName="formData.prenom || 'Participant'" :moduleId="moduleId" @retry="handleRetryQuiz" />
            </div>

            <!-- Indicateur de chargement -->
            <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div class="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p class="text-lg font-semibold text-gray-700">Enregistrement en cours...</p>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
h1 {
    font-family: Inter;
    font-style: normal;
    font-weight: 700;
    font-size: 54px;
}
</style>
