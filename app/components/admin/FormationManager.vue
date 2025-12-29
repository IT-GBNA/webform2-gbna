<script setup lang="ts">
/**
 * FormationManager - Gestionnaire principal des formations
 * 
 * Ce composant orchestre la gestion des formations via des sous-composants :
 * - FormationList : Liste des formations avec drag & drop
 * - FormationEditor : Formulaire d'édition/création
 * - QuestionManager : Gestion des questions (existant)
 */

import { ref, onMounted } from 'vue';
import FormationList from './formations/FormationList.vue';
import FormationEditor from './formations/FormationEditor.vue';
import QuestionManager from './QuestionManager.vue';

// Emits
const emit = defineEmits<{
    formationCreated: [moduleId: string];
    formationUpdated: [moduleId: string];
    formationDeleted: [moduleId: string];
}>();

// Types
interface Formation {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    order: number;
    collectionName: string;
    videoUrl?: string;
    coverImage?: string;
    exportEnabled?: boolean;
    exportRecipients?: string[];
}

// State
const formations = ref<Formation[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');
const editMode = ref(false);

// Form data
const formData = ref({
    id: '',
    displayName: '',
    description: '',
    duration: '',
    route: '',
    order: 1,
    collectionName: '',
    videoUrl: '',
    coverImage: ''
});

// Panel mode: 'form' or 'questions'
const panelMode = ref<'form' | 'questions'>('form');
const questionsFormationId = ref<string | null>(null);
const questionsFormationName = ref('');

// ============================================
// API Functions
// ============================================

const fetchFormations = async () => {
    try {
        const data = await $fetch<Formation[]>('/api/formations');
        formations.value = data.sort((a, b) => a.order - b.order);
    } catch (err: any) {
        error.value = err.message || 'Erreur lors du chargement';
    }
};

const generateNextId = () => {
    if (formations.value.length === 0) return 'form_1';
    const maxNum = formations.value.reduce((max, f) => {
        const match = f.id.match(/form_(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `form_${maxNum + 1}`;
};

const resetForm = () => {
    formData.value = {
        id: generateNextId(),
        displayName: '',
        description: '',
        duration: '',
        route: '',
        order: formations.value.length + 1,
        collectionName: '',
        videoUrl: '',
        coverImage: ''
    };
    editMode.value = false;
    panelMode.value = 'form';
};

const submitForm = async () => {
    // Validation des champs requis
    if (!formData.value.displayName?.trim()) {
        error.value = 'Le nom affiché est requis';
        return;
    }
    if (!formData.value.description?.trim()) {
        error.value = 'La description est requise';
        return;
    }
    if (!formData.value.duration?.trim()) {
        error.value = 'La durée est requise';
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        if (editMode.value) {
            await $fetch(`/api/formations/${formData.value.id}`, {
                method: 'PUT',
                body: formData.value
            });
            success.value = 'Formation mise à jour !';
            emit('formationUpdated', formData.value.id);
        } else {
            await $fetch('/api/formations', {
                method: 'POST',
                body: formData.value
            });
            success.value = 'Formation créée !';
            emit('formationCreated', formData.value.id);
        }

        await fetchFormations();
        resetForm();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.data?.statusMessage || err.message || 'Erreur';
    } finally {
        loading.value = false;
    }
};

const deleteFormation = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;

    try {
        await $fetch(`/api/formations/${id}`, { method: 'DELETE' });
        await fetchFormations();
        emit('formationDeleted', id);
        success.value = 'Formation supprimée';
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message;
    }
};

const handleReorder = async () => {
    try {
        const reorderedData = formations.value.map((f, index) => ({
            id: f.id,
            order: index + 1
        }));

        await $fetch('/api/formations/reorder', {
            method: 'PUT',
            body: { formations: reorderedData }
        });

        formations.value = formations.value.map((f, index) => ({
            ...f,
            order: index + 1
        }));
    } catch (err: any) {
        error.value = err.message;
        await fetchFormations();
    }
};

// ============================================
// Event Handlers
// ============================================

const handleEdit = (formation: Formation) => {
    formData.value = {
        ...formation,
        videoUrl: formation.videoUrl || '',
        coverImage: formation.coverImage || ''
    };
    editMode.value = true;
    panelMode.value = 'form';
};

const handleQuestions = (formation: Formation) => {
    questionsFormationId.value = formation.id;
    questionsFormationName.value = formation.displayName;
    panelMode.value = 'questions';
};

const showForm = () => {
    resetForm();
    panelMode.value = 'form';
};

// ============================================
// Lifecycle
// ============================================

onMounted(() => {
    fetchFormations();
});
</script>

<template>
    <div class="w-full">
        <!-- Alert messages -->
        <div v-if="success" class="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            {{ success }}
        </div>
        <div v-if="error" class="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {{ error }}
        </div>

        <!-- Info Box -->
        <div
            class="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-amber-400/50 rounded-lg text-xs mb-4">
            <svg class="h-3 w-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd" />
            </svg>
            <p class="text-zinc-300">
                Les formations créées ici seront automatiquement affichées sur la page d'accueil.
            </p>
        </div>

        <!-- Main Layout -->
        <div class="flex flex-col lg:flex-row gap-4 items-start">

            <!-- Left Column: Formation List -->
            <FormationList :formations="formations" :selected-formation-id="editMode ? formData.id : null"
                @update:formations="formations = $event" @edit="handleEdit" @delete="deleteFormation"
                @questions="handleQuestions" @reorder="handleReorder" @create="showForm" />

            <!-- Right Column: Form or Questions -->
            <div class="w-full lg:w-3/4 bg-zinc-900 border rounded-xl overflow-hidden sticky top-4"
                :class="panelMode === 'questions' ? 'border-purple-500/50' : 'border-blue-500/50'">

                <!-- Header: Form Mode -->
                <div v-if="panelMode === 'form'" class="px-3 py-2 bg-blue-500/20 border-b border-blue-500/50">
                    <h2 class="text-zinc-200 font-medium text-sm flex items-center gap-2">
                        <span v-if="editMode">✏️</span>
                        <span v-else>➕</span>
                        {{ editMode ? 'Modifier la formation' : 'Nouvelle formation' }}
                    </h2>
                </div>

                <!-- Header: Questions Mode -->
                <div v-else
                    class="px-3 py-2 bg-purple-900/30 border-b border-purple-500/30 flex items-center justify-between">
                    <h2 class="text-purple-200 font-medium text-sm flex items-center gap-2">
                        📝 Questions :
                        <span class="text-purple-400 font-normal">{{ questionsFormationName }}</span>
                    </h2>
                    <button @click="showForm"
                        class="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
                        ← Retour
                    </button>
                </div>

                <!-- Content: Form -->
                <FormationEditor v-if="panelMode === 'form'" v-model:formData="formData" :edit-mode="editMode"
                    :loading="loading" @submit="submitForm" @cancel="resetForm" />

                <!-- Content: Questions -->
                <div v-else class="p-4">
                    <QuestionManager v-if="questionsFormationId" :initial-module="questionsFormationId"
                        :initial-module-name="questionsFormationName" />
                </div>
            </div>
        </div>
    </div>
</template>
