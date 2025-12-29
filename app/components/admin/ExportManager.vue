<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface ExportConfig {
    _id?: string;
    enabled: boolean;
    recipients: string[];
    apiKey?: string;
    day: number;
    hour: number;
    minute: number;
    institution?: string;
}

interface Formation {
    id: string;
    displayName: string;
    exportConfigs: ExportConfig[];
    // Legacy fields
    exportEnabled?: boolean;
    exportRecipients?: string[];
    exportApiKey?: string;
    exportDay?: number;
    exportHour?: number;
    exportMinute?: number;
    exportInstitution?: string;
}

interface ApiUser {
    _id: string;
    username: string;
    apiKey: string;
}

interface Institution {
    name: string;
}

// State
const formations = ref<Formation[]>([]);
const usersWithApiKey = ref<ApiUser[]>([]);
const institutionsData = ref<Institution[]>([]);
const loading = ref(false);
const error = ref('');
const success = ref('');

// Modal state
const showModal = ref(false);
const selectedFormation = ref<Formation | null>(null);
const editingConfigIndex = ref<number | null>(null);
const editingConfig = ref<ExportConfig>({
    enabled: true,
    recipients: [],
    apiKey: '',
    day: 1,
    hour: 8,
    minute: 0,
    institution: ''
});
const exportRecipients = ref('');
const exportLoading = ref(false);

// Jours de la semaine
const days = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
];

// Helpers
const getDayName = (day: number) => days.find(d => d.value === day)?.label?.substring(0, 3) || 'Lun';

const getSchedule = (config: ExportConfig) => {
    const day = getDayName(config.day);
    const hour = config.hour.toString().padStart(2, '0');
    const minute = config.minute.toString().padStart(2, '0');
    return `${day} ${hour}:${minute}`;
};

const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Computed: liste plate de toutes les configs pour affichage
const allExportConfigs = computed(() => {
    const configs: Array<{ formation: Formation; config: ExportConfig; index: number }> = [];
    for (const formation of formations.value) {
        const formationConfigs = formation.exportConfigs || [];
        formationConfigs.forEach((config, index) => {
            configs.push({ formation, config, index });
        });
    }
    return configs;
});

// Fetch formations
const fetchFormations = async () => {
    loading.value = true;
    try {
        const data = await $fetch<Formation[]>('/api/formations');
        formations.value = data;
    } catch (err: any) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

// Fetch users with API key
const fetchUsersWithApiKey = async () => {
    try {
        const users = await $fetch<any[]>('/api/users');
        usersWithApiKey.value = users.filter(u => u.apiKey);
    } catch (err) {
        console.error('Erreur:', err);
    }
};

// Load institutions
const loadInstitutions = async () => {
    try {
        const data = await $fetch<Institution[]>('/etab.json');
        institutionsData.value = data;
    } catch (e) {
        console.error('Établissements non chargés:', e);
    }
};

// Open modal for new config
const openNewConfigModal = async (formation: Formation) => {
    selectedFormation.value = formation;
    editingConfigIndex.value = null;
    editingConfig.value = {
        enabled: true,
        recipients: [],
        apiKey: '',
        day: 1,
        hour: 8,
        minute: 0,
        institution: ''
    };
    exportRecipients.value = '';
    showModal.value = true;
    await Promise.all([fetchUsersWithApiKey(), loadInstitutions()]);
};

// Open modal for editing existing config
const openEditConfigModal = async (formation: Formation, configIndex: number) => {
    selectedFormation.value = formation;
    editingConfigIndex.value = configIndex;
    const config = formation.exportConfigs?.[configIndex];
    if (config) {
        editingConfig.value = {
            _id: config._id,
            enabled: config.enabled ?? true,
            recipients: config.recipients || [],
            apiKey: config.apiKey || '',
            day: config.day ?? 1,
            hour: config.hour ?? 8,
            minute: config.minute ?? 0,
            institution: config.institution || ''
        };
        exportRecipients.value = (config.recipients || []).join(', ');
    }
    showModal.value = true;
    await Promise.all([fetchUsersWithApiKey(), loadInstitutions()]);
};

// Close modal
const closeModal = () => {
    showModal.value = false;
    selectedFormation.value = null;
    editingConfigIndex.value = null;
    error.value = '';
};

// Save config
const saveConfig = async () => {
    if (!selectedFormation.value) return;

    exportLoading.value = true;
    error.value = '';

    try {
        const recipients = exportRecipients.value.split(',').map(e => e.trim()).filter(e => e);

        const configToSave: ExportConfig = {
            ...editingConfig.value,
            recipients
        };

        // Préparer le nouveau tableau de configs
        let newConfigs = [...(selectedFormation.value.exportConfigs || [])];

        if (editingConfigIndex.value !== null) {
            // Mise à jour d'une config existante
            newConfigs[editingConfigIndex.value] = configToSave;
        } else {
            // Ajout d'une nouvelle config
            newConfigs.push(configToSave);
        }

        await $fetch(`/api/formations/${selectedFormation.value.id}`, {
            method: 'PUT',
            body: { exportConfigs: newConfigs }
        });

        success.value = editingConfigIndex.value !== null ? 'Configuration mise à jour !' : 'Configuration ajoutée !';
        closeModal();
        await fetchFormations();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message || 'Erreur';
    } finally {
        exportLoading.value = false;
    }
};

// Delete config
const deleteConfig = async (formation: Formation, configIndex: number) => {
    if (!confirm('Supprimer cette configuration d\'export ?')) return;

    try {
        const newConfigs = [...formation.exportConfigs];
        newConfigs.splice(configIndex, 1);

        await $fetch(`/api/formations/${formation.id}`, {
            method: 'PUT',
            body: { exportConfigs: newConfigs }
        });

        success.value = 'Configuration supprimée';
        await fetchFormations();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message;
    }
};

// Toggle config enabled
const toggleConfig = async (formation: Formation, configIndex: number) => {
    try {
        const newConfigs = [...(formation.exportConfigs || [])];
        const currentConfig = newConfigs[configIndex];
        if (currentConfig) {
            newConfigs[configIndex] = {
                ...currentConfig,
                enabled: !currentConfig.enabled
            };
        }

        await $fetch(`/api/formations/${formation.id}`, {
            method: 'PUT',
            body: { exportConfigs: newConfigs }
        });

        await fetchFormations();
    } catch (err: any) {
        error.value = err.message;
    }
};

// Run export now
const runExportNow = async (formation: Formation, configIndex: number) => {
    const config = formation.exportConfigs?.[configIndex];
    if (!config) return;

    const label = config.institution || 'tous';
    if (!confirm(`Envoyer l'export (${label}) maintenant pour "${formation.displayName}" ?`)) return;

    loading.value = true;
    try {
        const result = await $fetch<{ message: string }>(`/api/formations/${formation.id}/export`, {
            method: 'POST',
            body: { configId: config._id }
        });
        success.value = `✅ ${result.message}`;
        setTimeout(() => { success.value = ''; }, 5000);
    } catch (err: any) {
        error.value = err.data?.statusMessage || err.message || 'Erreur';
    } finally {
        loading.value = false;
    }
};

onMounted(fetchFormations);
</script>

<template>
    <div class="w-full">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold text-white mb-2">📧 Exports automatiques</h2>
                <p class="text-zinc-400 text-sm">Configurez l'envoi automatique des rapports PDF par email</p>
            </div>
        </div>

        <!-- Alerts -->
        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="success"
                class="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                <span>✅</span> {{ success }}
            </div>
        </Transition>

        <div v-if="error && !showModal"
            class="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <span>❌</span> {{ error }}
            <button @click="error = ''" class="ml-auto text-red-300 hover:text-white cursor-pointer">✕</button>
        </div>

        <!-- Loading -->
        <div v-if="loading && !formations.length" class="text-center py-12 text-zinc-400">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
            Chargement...
        </div>

        <!-- Formations avec leurs exports -->
        <div v-else class="space-y-6">
            <div v-for="formation in formations" :key="formation.id"
                class="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
                <!-- Formation Header -->
                <div class="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-700">
                    <h3 class="text-white font-medium">{{ formation.displayName }}</h3>
                    <button @click="openNewConfigModal(formation)"
                        class="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1">
                        <span>+</span> Ajouter un export
                    </button>
                </div>

                <!-- Configs Table -->
                <div v-if="formation.exportConfigs?.length" class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-700/50">
                                <th class="text-center px-3 py-2 w-16">Actif</th>
                                <th class="text-left px-3 py-2">Établissement</th>
                                <th class="text-left px-3 py-2">Programmation</th>
                                <th class="text-left px-3 py-2">Destinataires</th>
                                <th class="text-center px-3 py-2 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-700/30">
                            <tr v-for="(config, index) in formation.exportConfigs" :key="config._id || index"
                                class="hover:bg-zinc-700/30 transition-colors">
                                <!-- Toggle -->
                                <td class="px-3 py-2 text-center">
                                    <button @click="toggleConfig(formation, index)"
                                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                                        :class="config.enabled ? 'bg-green-600' : 'bg-zinc-600'">
                                        <span
                                            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                                            :class="config.enabled ? 'translate-x-5' : 'translate-x-1'">
                                        </span>
                                    </button>
                                </td>

                                <!-- Institution -->
                                <td class="px-3 py-2">
                                    <span v-if="config.institution" class="text-cyan-400 text-sm">
                                        🏢 {{ config.institution }}
                                    </span>
                                    <span v-else class="text-zinc-500 text-sm">Tous</span>
                                </td>

                                <!-- Schedule -->
                                <td class="px-3 py-2">
                                    <span class="text-zinc-300 text-sm">📅 {{ getSchedule(config) }}</span>
                                </td>

                                <!-- Recipients -->
                                <td class="px-3 py-2">
                                    <span class="text-zinc-300 text-sm">📬 {{ config.recipients.length }}
                                        email(s)</span>
                                </td>

                                <!-- Actions -->
                                <td class="px-3 py-2 text-center">
                                    <div class="flex items-center justify-center gap-1">
                                        <button @click="openEditConfigModal(formation, index)"
                                            class="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs cursor-pointer"
                                            title="Modifier">
                                            ✏️
                                        </button>
                                        <button v-if="config.enabled" @click="runExportNow(formation, index)"
                                            class="p-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded text-xs cursor-pointer"
                                            title="Envoyer maintenant">
                                            📤
                                        </button>
                                        <button @click="deleteConfig(formation, index)"
                                            class="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs cursor-pointer"
                                            title="Supprimer">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Empty State -->
                <div v-else class="px-4 py-6 text-center text-zinc-500 text-sm">
                    Aucune configuration d'export. Cliquez sur "Ajouter un export" pour commencer.
                </div>
            </div>
        </div>

        <!-- Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="showModal"
                    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div class="bg-zinc-900 rounded-2xl border border-green-500/30 w-full max-w-lg shadow-2xl">
                        <!-- Modal Header -->
                        <div class="flex items-center justify-between p-6 border-b border-zinc-700">
                            <div>
                                <h4 class="text-lg font-semibold text-white">
                                    {{ editingConfigIndex !== null ? '✏️ Modifier' : '➕ Nouvelle' }} Configuration
                                </h4>
                                <p class="text-sm text-zinc-400 mt-1">{{ selectedFormation?.displayName }}</p>
                            </div>
                            <button @click="closeModal"
                                class="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6 space-y-4">
                            <!-- Établissement -->
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">🏢 Établissement</label>
                                <select v-model="editingConfig.institution"
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">Tous les établissements</option>
                                    <option v-for="inst in institutionsData" :key="inst.name" :value="inst.name">
                                        {{ inst.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Jour et Heure -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-zinc-300 mb-2">📅 Jour</label>
                                    <select v-model="editingConfig.day"
                                        class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                        <option v-for="day in days" :key="day.value" :value="day.value">
                                            {{ day.label }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-zinc-300 mb-2">🕐 Heure</label>
                                    <input type="time" :value="formatTime(editingConfig.hour, editingConfig.minute)"
                                        @input="(e: Event) => {
                                            const [h, m] = (e.target as HTMLInputElement).value.split(':').map(Number);
                                            editingConfig.hour = h || 0;
                                            editingConfig.minute = m || 0;
                                        }"
                                        class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>

                            <!-- Compte API -->
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">🔑 Compte API *</label>
                                <select v-model="editingConfig.apiKey" required
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">-- Sélectionner --</option>
                                    <option v-for="user in usersWithApiKey" :key="user._id" :value="user.apiKey">
                                        {{ user.username }} ({{ user.apiKey.substring(0, 15) }}...)
                                    </option>
                                </select>
                            </div>

                            <!-- Destinataires -->
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">📬 Destinataires *</label>
                                <textarea v-model="exportRecipients" rows="3"
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    placeholder="email1@exemple.com, email2@exemple.com"></textarea>
                                <p class="text-xs text-zinc-500 mt-1">Séparez les emails par des virgules</p>
                            </div>

                            <!-- Error in modal -->
                            <div v-if="error && showModal"
                                class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {{ error }}
                            </div>
                        </div>

                        <!-- Modal Footer -->
                        <div class="p-6 border-t border-zinc-700 flex gap-3">
                            <button @click="closeModal" :disabled="exportLoading"
                                class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50">
                                Annuler
                            </button>
                            <button @click="saveConfig" :disabled="exportLoading || !exportRecipients.trim()"
                                class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                                <span v-if="exportLoading" class="animate-spin">⏳</span>
                                💾 {{ editingConfigIndex !== null ? 'Modifier' : 'Ajouter' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
