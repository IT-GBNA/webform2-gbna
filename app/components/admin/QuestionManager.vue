<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';

// Props
const props = defineProps<{
    initialModule?: string;
    initialModuleName?: string;
    autoOpenForm?: boolean;
    modulesUpdateCount?: number;
}>();

interface AnswerOption {
    answer: string;
    isCorrect?: boolean;
}

interface Question {
    _id?: string;
    question: string;
    answerOptions: AnswerOption[];
    explanation: string;
}

interface Module {
    id: string;
    name: string;
}

// État
const questions = ref<Question[]>([]);
const loading = ref(false);
const editingQuestion = ref<Question | null>(null);
const showDeleteModal = ref(false);
const questionToDelete = ref<string | null>(null);

// Module sélectionné
const selectedModule = ref(props.initialModule || '');
const availableModules = ref<Module[]>([]);

// Formulaire
const formData = ref<Question>({
    question: '',
    answerOptions: [
        { answer: '', isCorrect: false },
        { answer: '', isCorrect: false }
    ],
    explanation: ''
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = 5;

const paginatedQuestions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return questions.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(questions.value.length / itemsPerPage));

// Fetch available modules
const fetchModules = async () => {
    try {
        const data = await $fetch('/api/formations');
        availableModules.value = (data as any[]).map((m: any) => ({
            id: m.id,
            name: m.displayName
        }));

        // If no module selected and we have modules, select the first one
        if (!selectedModule.value && availableModules.value.length > 0) {
            selectedModule.value = availableModules.value[0].id;
        }
    } catch (error) {
        console.error('Error fetching modules:', error);
    }
};

// Charger les questions
const loadQuestions = async () => {
    if (!selectedModule.value) return;

    loading.value = true;
    try {
        const data = await $fetch(`/api/questions?module=${selectedModule.value}`);
        questions.value = data as Question[];
    } catch (error) {
        console.error('❌ Erreur lors du chargement des questions:', error);
    } finally {
        loading.value = false;
    }
};

// Recharger les questions quand le module change
watch(selectedModule, () => {
    currentPage.value = 1; // Réinitialiser à la page 1
    loadQuestions();
});

// Ouvrir le formulaire de création
const openCreateForm = () => {
    editingQuestion.value = null;
    formData.value = {
        question: '',
        answerOptions: [
            { answer: '', isCorrect: false },
            { answer: '', isCorrect: false }
        ],
        explanation: ''
    };
};

// Ouvrir le formulaire d'édition
const openEditForm = (question: Question) => {
    editingQuestion.value = question;
    formData.value = {
        question: question.question,
        answerOptions: JSON.parse(JSON.stringify(question.answerOptions)),
        explanation: question.explanation
    };
};

// Ajouter une option de réponse
const addAnswerOption = () => {
    formData.value.answerOptions.push({ answer: '', isCorrect: false });
};

// Supprimer une option de réponse
const removeAnswerOption = (index: number) => {
    if (formData.value.answerOptions.length > 2) {
        formData.value.answerOptions.splice(index, 1);
    }
};

// Sauvegarder la question
const saveQuestion = async () => {
    // Validation
    if (!formData.value.question.trim()) {
        alert('Veuillez saisir une question');
        return;
    }

    if (formData.value.answerOptions.some(opt => !opt.answer.trim())) {
        alert('Toutes les réponses doivent être remplies');
        return;
    }

    if (!formData.value.answerOptions.some(opt => opt.isCorrect)) {
        alert('Au moins une réponse doit être correcte');
        return;
    }

    if (!formData.value.explanation.trim()) {
        alert('Veuillez saisir une explication');
        return;
    }

    loading.value = true;
    try {
        if (editingQuestion.value?._id) {
            // Mise à jour
            await $fetch(`/api/questions/${editingQuestion.value._id}?module=${selectedModule.value}`, {
                method: 'PUT',
                body: { ...formData.value, module: selectedModule.value }
            });
        } else {
            // Création
            await $fetch('/api/questions', {
                method: 'POST',
                body: { ...formData.value, module: selectedModule.value }
            });
        }

        openCreateForm(); // Reset form
        await loadQuestions();
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            return navigateTo({
                name: 'login',
                query: {
                    reason: 'unauthorized'
                }
            });
        }
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la question');
    } finally {
        loading.value = false;
    }
};

// Confirmer la suppression
const confirmDelete = (id: string) => {
    questionToDelete.value = id;
    showDeleteModal.value = true;
};

// Supprimer la question
const deleteQuestion = async () => {
    if (!questionToDelete.value) return;

    loading.value = true;
    try {
        await $fetch(`/api/questions/${questionToDelete.value}?module=${selectedModule.value}`, {
            method: 'DELETE'
        });

        showDeleteModal.value = false;
        questionToDelete.value = null;
        await loadQuestions();
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            return navigateTo({
                name: 'login',
                query: {
                    reason: 'unauthorized'
                }
            });
        }
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la question');
    } finally {
        loading.value = false;
    }
};

// Charger les questions au montage
onMounted(async () => {
    await fetchModules();

    // If initialModule provided via props, ensure it's selected
    if (props.initialModule) {
        selectedModule.value = props.initialModule;
    }

    await loadQuestions();

    // Auto-open form if requested
    if (props.autoOpenForm) {
        setTimeout(() => {
            openCreateForm();
        }, 500);
    }
});

// Watch for initialModule changes
watch(() => props.initialModule, (newModule) => {
    if (newModule) {
        selectedModule.value = newModule;
        // loadQuestions is triggered by selectedModule watcher
    }
});

// Watch for autoOpenForm changes
watch(() => props.autoOpenForm, (shouldOpen) => {
    if (shouldOpen) {
        openCreateForm();
    }
});

// Watch for modulesUpdateCount changes to refresh modules
watch(() => props.modulesUpdateCount, async (newCount, oldCount) => {
    if (newCount && oldCount !== undefined && newCount > oldCount) {
        console.log('🔄 Refreshing modules list...');
        await fetchModules();
    }
});
</script>

<template>
    <div class="question-manager w-full">

        <!-- Alert for no questions -->
        <div v-if="questions.length === 0 && !loading && selectedModule"
            class="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-amber-400/50 rounded-lg mb-4">
            <svg class="h-3 w-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
            </svg>
            <p class="text-xs text-zinc-300">
                Cette formation ne possède pas encore de questions.
                <button @click="openCreateForm" class="text-purple-400 underline hover:text-purple-300 ml-1">
                    Créez-en une
                </button>
            </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-4 items-start">
            <!-- Left Column: Questions List (1/3) -->
            <div class="w-full lg:w-1/3 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div class="px-3 py-2 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center">
                    <h3 class="text-zinc-200 font-medium text-sm flex items-center gap-2">
                        <svg class="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Questions
                        <span class="text-zinc-500 text-xs">({{ questions.length }})</span>
                    </h3>
                    <button @click="openCreateForm"
                        class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
                        + Nouvelle
                    </button>
                </div>

                <!-- Info message about random selection -->
                <div class="px-3 py-2 bg-blue-900/20 border-b border-blue-500/20">
                    <p class="text-[10px] text-blue-200 flex gap-2 items-start leading-tight">
                        <svg class="w-3 h-3 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            Le quiz affichera <strong>20 questions aléatoires</strong> parmi celles créées. Ajoutez-en
                            plus pour varier les tirages.
                        </span>
                    </p>
                </div>
                <div class="p-3">

                    <div class="space-y-2">
                        <div v-for="question in paginatedQuestions" :key="question._id"
                            class="bg-zinc-800 border border-zinc-700 rounded-lg p-3 hover:border-zinc-600 transition-all cursor-pointer"
                            :class="{ 'border-purple-500 ring-1 ring-purple-500/30': editingQuestion && editingQuestion._id === question._id }"
                            @click="openEditForm(question)">
                            <div class="flex flex-col gap-1">
                                <h3 class="text-xs font-medium text-white line-clamp-2">{{ question.question }}</h3>
                                <div class="flex justify-between items-center">
                                    <p class="text-xs text-zinc-500">
                                        {{ question.answerOptions.length }} rép. •
                                        {{question.answerOptions.filter(a => a.isCorrect).length}} ok
                                    </p>
                                    <button @click.stop="confirmDelete(question._id!)"
                                        class="text-zinc-500 hover:text-red-400 transition-colors p-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
                        <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="[
                            'px-3 py-1 rounded-lg transition-all text-xs',
                            currentPage === page
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        ]">
                            {{ page }}
                        </button>
                    </div>

                    <p v-if="questions.length === 0 && !loading" class="text-center text-zinc-500 py-6 text-xs">
                        Aucune question.
                    </p>
                </div>
            </div>

            <!-- Right Column: Form (2/3) -->
            <div class="w-full lg:w-2/3 sticky top-4">
                <div class="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                    <div class="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
                        <h3 class="text-zinc-200 font-medium text-sm flex items-center gap-2">
                            <span v-if="editingQuestion">✏️</span>
                            <span v-else>➕</span>
                            {{ editingQuestion ? 'Modifier la question' : 'Nouvelle question' }}
                        </h3>
                    </div>
                    <div class="p-4">

                        <!-- Question -->
                        <div
                            class="mb-3 bg-gradient-to-r from-zinc-700/30 via-zinc-600/20 to-zinc-700/30 rounded-md p-3 border-1 border-gray-100/20">
                            <label class="block text-xs font-medium text-white mb-1">Question :</label>
                            <input v-model="formData.question" type="text"
                                class=" bg-white text-xs w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-white focus:border-transparent"
                                placeholder="Entrez votre question..." />
                        </div>

                        <!-- Options de réponse -->
                        <div
                            class="mb-3 bg-gradient-to-r from-zinc-700/30 via-zinc-600/20 to-zinc-700/30 rounded-md rounded-xl p-3 border-1 border-gray-100/20">
                            <label class="block text-xs font-medium text-white mb-2">Réponses :</label>
                            <div v-for="(option, index) in formData.answerOptions" :key="index" class="flex gap-2 mb-2">
                                <input v-model="option.answer" type="text" class="flex-1 px-3 py-1 bg-white
             rounded-lg border-1 border-gray-300/25 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md 
                text-xs" :placeholder="`Réponse ${index + 1}`" />
                                <label
                                    class="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg bg-white">
                                    <input v-model="option.isCorrect" type="checkbox"
                                        class="w-3 h-3 text-green-600 focus:ring-green-500 rounded" />
                                    <span class="text-xs">OK</span>
                                </label>
                                <button v-if="formData.answerOptions.length > 2" @click="removeAnswerOption(index)"
                                    class="px-2 py-1 bg-red-500/20 border-red-500/50 border-1 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-xs">
                                    ✕
                                </button>
                            </div>
                            <div class="flex justify-center">
                                <button @click="addAnswerOption" class="mt-2 px-3 py-1.5 bg-gradient-to-r from-gray-400/30 via-gray-300/30 to-gray-400/30 
            text-white rounded-lg border-1 border-amber-300/25 hover:border-amber-300 transition-all duration-200 shadow-sm hover:shadow-md 
                cursor-pointer text-xs">
                                    + Réponse
                                </button>
                            </div>

                        </div>

                        <!-- Explication -->
                        <div
                            class="mb-3 bg-gradient-to-r from-zinc-700/30 via-zinc-600/20 to-zinc-700/30 rounded-md p-3 border-1 border-gray-100/20">
                            <label class=" block text-xs font-medium text-white mb-1">Explication</label>
                            <textarea v-model="formData.explanation" rows="2"
                                class="w-full px-3 py-1.5 border border-gray-300 bg-white rounded-lg focus:border-transparent text-xs"
                                placeholder="Expliquez la bonne réponse..."></textarea>
                        </div>

                        <!-- Boutons -->
                        <div class="flex gap-2">
                            <button @click="saveQuestion" :disabled="loading" class="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 via-purple-500/30 to-purple-600/30 
            text-white rounded-lg border-1 border-purple-300/25 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md 
                cursor-pointer text-xs flex-1">
                                {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
                            </button>
                            <button @click="openCreateForm" :disabled="loading" class="mt-2 px-4 py-2 bg-gradient-to-r from-gray-400/30 via-gray-300/30 to-gray-400/30 
            text-white rounded-lg border-1 border-gray-300/25 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md 
                cursor-pointer text-xs">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de confirmation de suppression -->
            <div v-if="showDeleteModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                @click="showDeleteModal = false">
                <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" @click.stop>
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
                    <p class="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.
                    </p>
                    <div class="flex gap-3">
                        <button @click="deleteQuestion" :disabled="loading"
                            class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                            {{ loading ? 'Suppression...' : 'Supprimer' }}
                        </button>
                        <button @click="showDeleteModal = false" :disabled="loading"
                            class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loader -->
            <div v-if="loading && !showDeleteModal" class="text-center py-8">
                <div
                    class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent">
                </div>
                <p class="mt-2 text-zinc-400">Chargement...</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.question-manager {
    margin: 0 auto;
}
</style>
