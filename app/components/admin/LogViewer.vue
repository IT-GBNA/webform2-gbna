<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';

interface Log {
    _id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    action: string;
    message: string;
    userId?: string;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

// State
const logs = ref<Log[]>([]);
const loading = ref(false);
const error = ref('');

// Pagination
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const limit = ref(30);

// Filters
const levelFilter = ref('all');
const actionFilter = ref('all');
const searchQuery = ref('');
const availableActions = ref<string[]>([]);

// Date filters
const startDate = ref('');
const endDate = ref('');

// Fetch logs
const fetchLogs = async () => {
    loading.value = true;
    error.value = '';

    try {
        const params = new URLSearchParams({
            page: currentPage.value.toString(),
            limit: limit.value.toString()
        });

        if (levelFilter.value !== 'all') {
            params.append('level', levelFilter.value);
        }
        if (actionFilter.value !== 'all') {
            params.append('action', actionFilter.value);
        }
        if (searchQuery.value) {
            params.append('search', searchQuery.value);
        }
        if (startDate.value) {
            params.append('startDate', startDate.value);
        }
        if (endDate.value) {
            params.append('endDate', endDate.value);
        }

        const data = await $fetch<{
            logs: Log[];
            total: number;
            page: number;
            totalPages: number;
            actions: string[];
        }>(`/api/activity-logs?${params.toString()}`);

        logs.value = data.logs;
        total.value = data.total;
        totalPages.value = data.totalPages;
        availableActions.value = data.actions;
    } catch (err: any) {
        error.value = err.message || 'Erreur lors du chargement des logs';
        console.error('Error fetching logs:', err);
    } finally {
        loading.value = false;
    }
};

// Reset filters
const resetFilters = () => {
    levelFilter.value = 'all';
    actionFilter.value = 'all';
    searchQuery.value = '';
    startDate.value = '';
    endDate.value = '';
    currentPage.value = 1;
    fetchLogs();
};

// Format date
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Level badge classes
const getLevelClass = (level: string) => {
    switch (level) {
        case 'error':
            return 'bg-red-500/20 text-red-400 border-red-500/50';
        case 'warning':
            return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
        case 'info':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        case 'debug':
            return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
        default:
            return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50';
    }
};

// Watch for filter changes
watch([levelFilter, actionFilter], () => {
    currentPage.value = 1;
    fetchLogs();
});

// Debounced search
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchLogs();
    }, 300);
});

// Computed for showing metadata
const expandedLogs = ref<Set<string>>(new Set());
const toggleExpand = (logId: string) => {
    if (expandedLogs.value.has(logId)) {
        expandedLogs.value.delete(logId);
    } else {
        expandedLogs.value.add(logId);
    }
};

onMounted(() => {
    fetchLogs();
});
</script>

<template>
    <div class="w-full">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                📋 Logs d'activité
                <span class="text-zinc-500 text-sm font-normal">({{ total }} entrées)</span>
            </h3>
            <button @click="fetchLogs" :disabled="loading"
                class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs cursor-pointer transition-colors">
                🔄 Actualiser
            </button>
        </div>

        <!-- Filters -->
        <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <label class="text-xs text-zinc-400 mb-1 block">Recherche</label>
                    <input v-model="searchQuery" type="text" placeholder="Message, email, action..."
                        class="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-xs focus:border-purple-500 focus:outline-none" />
                </div>

                <!-- Level filter -->
                <div>
                    <label class="text-xs text-zinc-400 mb-1 block">Niveau</label>
                    <select v-model="levelFilter"
                        class="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-xs">
                        <option value="all">Tous</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>

                <!-- Action filter -->
                <div>
                    <label class="text-xs text-zinc-400 mb-1 block">Action</label>
                    <select v-model="actionFilter"
                        class="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-xs">
                        <option value="all">Toutes</option>
                        <option v-for="action in availableActions" :key="action" :value="action">
                            {{ action }}
                        </option>
                    </select>
                </div>

                <!-- Reset button -->
                <div class="flex items-end">
                    <button @click="resetFilters"
                        class="w-full px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs cursor-pointer transition-colors">
                        ✕ Réinitialiser
                    </button>
                </div>
            </div>

            <!-- Date filters -->
            <div class="grid grid-cols-2 gap-3 mt-3">
                <div>
                    <label class="text-xs text-zinc-400 mb-1 block">Date début</label>
                    <input v-model="startDate" type="date" @change="fetchLogs"
                        class="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-xs" />
                </div>
                <div>
                    <label class="text-xs text-zinc-400 mb-1 block">Date fin</label>
                    <input v-model="endDate" type="date" @change="fetchLogs"
                        class="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-xs" />
                </div>
            </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {{ error }}
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>

        <!-- Logs table -->
        <div v-else class="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-zinc-800 text-zinc-400">
                        <tr>
                            <th class="px-3 py-2 text-left font-medium">Date</th>
                            <th class="px-3 py-2 text-left font-medium">Niveau</th>
                            <th class="px-3 py-2 text-left font-medium">Action</th>
                            <th class="px-3 py-2 text-left font-medium">Message</th>
                            <th class="px-3 py-2 text-left font-medium">Utilisateur</th>
                            <th class="px-3 py-2 text-left font-medium">Détails</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800">
                        <template v-for="log in logs" :key="log._id">
                            <tr class="hover:bg-zinc-800/50 transition-colors">
                                <td class="px-3 py-2 text-zinc-400 whitespace-nowrap">
                                    {{ formatDate(log.timestamp) }}
                                </td>
                                <td class="px-3 py-2">
                                    <span :class="getLevelClass(log.level)"
                                        class="px-2 py-0.5 rounded border text-xs uppercase font-medium">
                                        {{ log.level }}
                                    </span>
                                </td>
                                <td class="px-3 py-2 text-purple-400 font-medium">
                                    {{ log.action }}
                                </td>
                                <td class="px-3 py-2 text-white max-w-xs truncate" :title="log.message">
                                    {{ log.message }}
                                </td>
                                <td class="px-3 py-2 text-zinc-400">
                                    {{ log.userEmail || '-' }}
                                </td>
                                <td class="px-3 py-2">
                                    <button v-if="log.metadata || log.ip" @click="toggleExpand(log._id)"
                                        class="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                                        {{ expandedLogs.has(log._id) ? '▼' : '▶' }}
                                    </button>
                                </td>
                            </tr>
                            <!-- Expanded details -->
                            <tr v-if="expandedLogs.has(log._id)" class="bg-zinc-800/30">
                                <td colspan="6" class="px-3 py-3">
                                    <div class="grid grid-cols-2 gap-4 text-xs">
                                        <div v-if="log.ip">
                                            <span class="text-zinc-500">IP:</span>
                                            <span class="text-zinc-300 ml-2">{{ log.ip }}</span>
                                        </div>
                                        <div v-if="log.userId">
                                            <span class="text-zinc-500">User ID:</span>
                                            <span class="text-zinc-300 ml-2">{{ log.userId }}</span>
                                        </div>
                                        <div v-if="log.userAgent" class="col-span-2">
                                            <span class="text-zinc-500">User Agent:</span>
                                            <span class="text-zinc-300 ml-2 break-all">{{ log.userAgent }}</span>
                                        </div>
                                        <div v-if="log.metadata" class="col-span-2">
                                            <span class="text-zinc-500">Metadata:</span>
                                            <pre
                                                class="text-zinc-300 mt-1 bg-zinc-900 p-2 rounded overflow-x-auto">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <tr v-if="logs.length === 0">
                            <td colspan="6" class="px-3 py-8 text-center text-zinc-500">
                                Aucun log trouvé
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
                <div class="text-xs text-zinc-500">
                    Page {{ currentPage }} sur {{ totalPages }}
                </div>
                <div class="flex gap-2">
                    <button @click="currentPage--; fetchLogs()" :disabled="currentPage === 1"
                        class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 rounded text-xs cursor-pointer">
                        ← Précédent
                    </button>
                    <button @click="currentPage++; fetchLogs()" :disabled="currentPage === totalPages"
                        class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 rounded text-xs cursor-pointer">
                        Suivant →
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
