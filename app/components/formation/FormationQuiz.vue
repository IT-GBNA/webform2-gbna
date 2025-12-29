<script setup>
import { ref, onMounted } from 'vue';
import FormationScore from './FormationScore.vue';

const props = defineProps({
    moduleId: {
        type: String,
        required: true
    },
    formationTitle: {
        type: String,
        default: ''
    },
    preview: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['complete']);

// Variables réactives
const questions = ref([]);
const currentQuestion = ref(0);
const selectedOptions = ref([]);
const showExplanation = ref(false);
const explanation = ref('');
const showScore = ref(false);
const score = ref(0);
const questionsHistory = ref([]);

// Fonction pour mélanger aléatoirement un tableau (algorithme Fisher-Yates)
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Constante pour le nombre maximum de questions
const MAX_QUESTIONS = 20;

// Charger les questions depuis l'API
onMounted(async () => {
    // En mode preview, afficher des questions factices
    if (props.preview) {
        questions.value = [
            {
                question: 'Question exemple pour aperçu...',
                answerOptions: [
                    { answer: 'Réponse A', isCorrect: false },
                    { answer: 'Réponse B', isCorrect: true },
                    { answer: 'Réponse C', isCorrect: false },
                    { answer: 'Réponse D', isCorrect: false }
                ],
                explanation: 'Explication...'
            }
        ];
        return;
    }

    try {
        const data = await $fetch(`/api/questions?module=${props.moduleId}`);
        // Mélanger les questions aléatoirement
        const shuffledQuestions = shuffleArray(data);
        // Limiter à MAX_QUESTIONS (20) si plus de questions
        questions.value = shuffledQuestions.slice(0, MAX_QUESTIONS);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des questions:', error);
        alert('Erreur lors du chargement des questions. Veuillez rafraîchir la page.');
    }
});

// Navigation
const handlePrevious = () => {
    if (currentQuestion.value > 0) {
        currentQuestion.value--;
    }
};

const handleNext = () => {
    const i = currentQuestion.value;

    if (i < questions.value.length) {
        let answeredCorrectly = false;
        let correctAnswer = '';

        // Vérifier les réponses
        questions.value[i].answerOptions.forEach((answer) => {
            if (answer.isCorrect && answer.answer === selectedOptions.value[i]?.answerByUser) {
                answeredCorrectly = true;
            }
            if (answer.isCorrect) {
                correctAnswer = answer.answer;
            }
        });

        // Afficher l'explication
        if (answeredCorrectly) {
            showExplanation.value = true;
            explanation.value = `<p class='text-2xl mb-5 bg-gradient-to-r from-green-700 via-green-600 to-green-700 bg-clip-text text-transparent'><strong>Bonne réponse !</strong></p><p class='text-center'>${questions.value[i].explanation}</p>`;
        } else {
            showExplanation.value = true;
            explanation.value = `<p class='text-2xl mb-5 bg-gradient-to-r from-red-700 via-red-500 to-red-700 bg-clip-text text-transparent'><strong>Mauvaise réponse !</strong></p><p class="mb-2"><strong>La bonne réponse était :</strong></p><p class='text-center mb-5'>${correctAnswer}</p><p class="mb-2"><strong>Explication :</strong></p><p class='text-center px-12'>${questions.value[i].explanation}</p>`;
        }

        // Enregistrer dans l'historique
        questionsHistory.value.push({
            questionText: questions.value[i].question,
            userAnswer: selectedOptions.value[i]?.answerByUser || 'Aucune réponse',
            correctAnswer: correctAnswer,
            isCorrect: answeredCorrectly
        });

        // Passer à la question suivante
        if (i < questions.value.length - 1) {
            currentQuestion.value++;
        }
    }
};

const handleAnswerOption = (answer) => {
    selectedOptions.value[currentQuestion.value] = { answerByUser: answer };
    selectedOptions.value = [...selectedOptions.value];
};

const handleSubmitButton = () => {
    let newScore = 0;
    for (let i = 0; i < questions.value.length; i++) {
        questions.value[i].answerOptions.forEach((answer) => {
            if (answer.isCorrect && answer.answer === selectedOptions.value[i]?.answerByUser) {
                newScore += 1;
            }
        });
    }
    score.value = newScore;
    showScore.value = true;

    // Émettre l'événement de complétion avec le score, l'historique ET le nombre de questions
    emit('complete', { score: score.value, history: questionsHistory.value, totalQuestions: questions.value.length });
};

const handleButtonClick = () => {
    if (currentQuestion.value + 1 === questions.value.length) {
        handleNext();
        showExplanation.value = true;
        handleSubmitButton();
    } else {
        handleNext();
    }
};

const handleReturnToStart = () => {
    score.value = 0;
    showScore.value = false;
    currentQuestion.value = 0;
    selectedOptions.value = [];
    questionsHistory.value = [];
};

const handleRetry = () => {
    console.log('✅ Événement retry reçu - Réinitialisation du quiz');
    // Réinitialiser toutes les variables
    score.value = 0;
    showScore.value = false;
    currentQuestion.value = 0;
    selectedOptions.value = [];
    questionsHistory.value = [];
    showExplanation.value = false;
    explanation.value = '';
};
</script>

<template>
    <!-- Score final - Affiché en dehors de la section quiz pour pleine largeur -->
    <div v-if="showScore" class="w-full">
        <FormationScore :score="score" :questionsHistory="questionsHistory" :moduleId="moduleId"
            :totalQuestions="questions.length" @retry="handleRetry" />
    </div>

    <!-- Quiz - Affiché seulement si le score n'est pas visible -->
    <section v-else id="quizz" class="w-full flex-col content-center justify-center items-center">
        <div class="w-full" style="display: flex; flex-direction: column;align-content: center;align-items: center;">
            <hr
                class="my-8 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25 dark:via-neutral-400 w-4/6" />

            <h2
                class="bg-gradient-to-r from-green-700 via-green-500 to-green-700 bg-clip-text text-transparent font-bold tracking-tight text-3xl pb-8 pt-6">
                Quiz
            </h2>

            <div class="text-sm bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative w-8/12"
                role="alert">
                <p class="font-medium">
                    Attention votre progression n'est pas sauvegardée. <br> Veuillez aller jusqu'à la dernière question
                    et cliquer sur "Soumettre" pour valider votre participation.
                </p>
            </div>

            <h1
                class="bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 bg-clip-text text-transparent text-center font-bold tracking-tight border-2 border-transparent sm:text-xl py-3 pb-10">
            </h1>

            <!-- Partie Box Quizz -->
            <div
                class="relative flex flex-col w-8/12 px-5 bg-slate-200/50 rounded-2xl pb-14 mb-14 backdrop-blur-sm border-1 border-slate-300">

                <!-- Explication -->
                <div v-if="showExplanation"
                    class="absolute inset-0 w-full h-full backdrop-blur-xl z-50 flex items-center justify-center rounded-2xl p-4">
                    <div class="w-8/12 flex flex-col items-center justify-center p-2">
                        <div
                            class="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-2xl border border-slate-300 p-6">
                            <div class="text-gray-800 text-base p-4">
                                <div v-html="explanation" class="flex flex-col items-center justify-center">
                                </div>
                            </div>
                            <div class="flex justify-center mt-4">
                                <button @click="showExplanation = false"
                                    class="mt-6 py-3 px-12 bg-gray-600 text-white rounded-xl hover:rounded-xl bg-gradient-to-r from-green-600 to-green-500 bg-no-repeat bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-left hover:text-white hover:border-transparent transition-all duration-400 cursor-pointer">
                                    Continuer →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Partie Question -->
                <div :class="{ 'blur-sm pointer-events-none': showExplanation }">
                    <div class="flex flex-col items-start w-full">
                        <div class="flex flex-col items-start w-full">
                            <h4 class="mt-5 text-xs text-slate-600 border-1 border-slate-300 p-2 rounded-xl font-bold">
                                Question {{ currentQuestion + 1 }} sur {{ questions.length }}
                            </h4>

                            <div v-if="questions.length > 0" class="mt-4 text-xl text-slate-700 font-semibold w-full">
                                {{ questions[currentQuestion].question }}

                                <div v-if="questions.length > 0">
                                    <div v-for="(answer, index) in questions[currentQuestion].answerOptions"
                                        :key="index"
                                        class="flex items-center w-full py-4 pl-5 m-2 ml-0 space-x-2 cursor-pointer border-white/10 bg-white p-5 mt-5 rounded-xl border shadow-sm border-gray-300 hover:bg-white transition hover:border-green-600/50"
                                        @click="() => handleAnswerOption(answer.answer)">
                                        <input type="radio" :name="answer.answer" :value="answer.answer"
                                            @change="() => handleAnswerOption(answer.answer)"
                                            :checked="answer.answer === selectedOptions[currentQuestion]?.answerByUser"
                                            class="ms-2 text-sm bg-black" />
                                        <p class="ms-2 text-sm pl-5">{{ answer.answer }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Boutons de navigation -->
                <div class="flex justify-center w-full mt-4">
                    <button v-if="currentQuestion + 1 !== questions.length" @click="handleButtonClick"
                        class="w-24 h-12 bg-white border-blue-600 text-green-600 rounded-xl bg-gradient-to-r from-green-600 to-green-500 bg-no-repeat bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-left hover:text-white hover:border-transparent transition-all duration-400 ease-in-out text-xl font-bold shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center">
                        →
                    </button>
                    <button v-if="currentQuestion + 1 === questions.length" @click="handleButtonClick"
                        class="w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200 text-xl font-bold shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center">
                        ✓
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
