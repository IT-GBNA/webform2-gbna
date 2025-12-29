<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
    users: any[];
    isFiltered?: boolean;
}>();

const emit = defineEmits(['refresh']);

// État de suppression
const deleting = ref<string | null>(null);

// Computed pour afficher tous les résultats si filtré, sinon les 10 derniers
const displayedUsers = computed(() => {
    const reversed = props.users.slice().reverse();
    if (props.isFiltered) {
        return reversed; // Afficher tous les résultats filtrés
    }
    return reversed.slice(0, 10); // Afficher seulement les 10 derniers
});

const tableTitle = computed(() => {
    if (props.isFiltered) {
        return `Résultats filtrés (${props.users.length})`;
    }
    return 'Derniers Participants';
});

// Cache pour stocker le nombre de questions par formation
const questionsCount = ref<Record<string, number>>({});
const formations = ref<Record<string, string>>({});

// Récupérer les informations des formations
onMounted(async () => {
    try {
        // Récupérer les formations
        const formationsData = await $fetch<any[]>('/api/formations');
        formationsData.forEach(f => {
            formations.value[f.id] = f.displayName;
        });

        // Récupérer le nombre de questions pour chaque formation utilisée
        const uniqueModuleIds = [...new Set(props.users.map(u => u.moduleId).filter(Boolean))];

        for (const moduleId of uniqueModuleIds) {
            try {
                const questions = await $fetch<any[]>(`/api/questions?module=${moduleId}`);
                questionsCount.value[moduleId] = questions.length;
            } catch {
                questionsCount.value[moduleId] = 0;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des formations:', error);
    }
});

// Observer les changements d'utilisateurs pour charger les questions manquantes
watch(() => props.users, async (newUsers) => {
    const uniqueModuleIds = [...new Set(newUsers.map(u => u.moduleId).filter(Boolean))];

    for (const moduleId of uniqueModuleIds) {
        if (questionsCount.value[moduleId] === undefined) {
            try {
                const questions = await $fetch<any[]>(`/api/questions?module=${moduleId}`);
                questionsCount.value[moduleId] = questions.length;
            } catch {
                questionsCount.value[moduleId] = 0;
            }
        }
    }
}, { deep: true });

// --- Helper ---
const formattedDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const getScoreColor = (score: number, total: number) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
};

const getFormationName = (moduleId: string) => {
    if (!moduleId) return 'Sensibilisation à la cybersécurité';
    return formations.value[moduleId] || 'Sensibilisation à la cybersécurité';
};

// Utilise totalQuestions stocké dans les données du participant, sinon fallback
const getTotalQuestions = (user: any) => {
    // Si totalQuestions est stocké dans les données du participant, l'utiliser
    if (user.totalQuestions && user.totalQuestions > 0) {
        return user.totalQuestions;
    }
    // Sinon, fallback vers le nombre de questions de la formation (limité à 20)
    const count = questionsCount.value[user.moduleId];
    if (count) {
        return Math.min(count, 20); // Maximum 20 questions
    }
    return 16; // Par défaut 16 (pour les anciennes participations)
};

// Supprimer une participation
const deleteParticipation = async (userId: string, userName: string) => {
    if (!confirm(`Supprimer la participation de ${userName} ? Cette action est irréversible.`)) {
        return;
    }

    deleting.value = userId;
    try {
        await $fetch(`/api/scores/${userId}`, {
            method: 'DELETE'
        });
        emit('refresh');
    } catch (error: any) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    } finally {
        deleting.value = null;
    }
};
</script>

<template>
    <div class="bg-zinc-800 rounded-xl shadow-sm border border-zinc-100/20 overflow-hidden">
        <div class="p-6 border-b border-zinc-100/10">
            <h3 class="text-lg font-bold text-white">{{ tableTitle }}</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
                        <th class="px-6 py-4 font-medium">Participant</th>
                        <th class="px-6 py-4 font-medium">Date</th>
                        <th class="px-6 py-4 font-medium">Formation</th>
                        <th class="px-6 py-4 font-medium">Score</th>
                        <th class="px-6 py-4 font-medium">Institution / Service</th>
                        <th class="px-4 py-4 font-medium text-center w-20">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100/10">
                    <tr v-for="user in displayedUsers" :key="user._id" class="hover:bg-zinc-700/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {{ getInitials(user.firstName, user.lastName) }}
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-white">{{ user.firstName }} {{
                                        user.lastName }}</p>
                                    <p class="text-xs text-zinc-500">ID: {{ user._id?.substring(0, 8) }}...</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-sm text-zinc-400">{{ formattedDate(user.createdAt) }}</span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-sm text-zinc-300 truncate max-w-[150px] block"
                                :title="getFormationName(user.moduleId)">
                                {{ getFormationName(user.moduleId) }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <span
                                :class="['px-3 py-1 rounded-full text-xs font-medium', getScoreColor(user.newScore, getTotalQuestions(user))]">
                                {{ user.newScore }} / {{ getTotalQuestions(user) }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-sm text-white">{{ user.institution }}</span>
                                <span class="text-xs text-zinc-500">{{ user.service }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-4 text-center">
                            <button @click="deleteParticipation(user._id, `${user.firstName} ${user.lastName}`)"
                                :disabled="deleting === user._id"
                                class="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Supprimer cette participation">
                                <span v-if="deleting === user._id" class="animate-spin inline-block">⏳</span>
                                <span v-else>🗑️</span>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="users.length === 0">
                        <td colspan="6" class="px-6 py-8 text-center text-zinc-500 text-sm">
                            Aucun participant trouvé.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
