<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface User {
    _id: string;
    username: string;
    email?: string;
    role: string;
    apiKey?: string;
    createdAt: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingUser = ref<User | null>(null);
const searchQuery = ref('');

// API Key modal
const showApiKeyModal = ref(false);
const selectedUserForApiKey = ref<User | null>(null);
const generatedApiKey = ref('');
const apiKeyLoading = ref(false);

// Form data
const formData = ref({
    username: '',
    email: '',
    password: '',
    role: 'admin'
});

// Fetch users
const fetchUsers = async () => {
    loading.value = true;
    try {
        const data = await $fetch('/api/users');
        users.value = data as User[];
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
    } finally {
        loading.value = false;
    }
};

// Filtered users
const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    const query = searchQuery.value.toLowerCase();
    return users.value.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
});

// Open form for new user
const openNewForm = () => {
    editingUser.value = null;
    formData.value = { username: '', email: '', password: '', role: 'admin' };
    showForm.value = true;
};

// Open form for editing
const openEditForm = (user: User) => {
    editingUser.value = user;
    formData.value = {
        username: user.username,
        email: user.email || '',
        password: '',
        role: user.role
    };
    showForm.value = true;
};

// Save user (create or update)
const saveUser = async () => {
    try {
        if (editingUser.value) {
            // Update existing user
            await $fetch(`/api/users/${editingUser.value._id}`, {
                method: 'PUT',
                body: formData.value
            });
        } else {
            // Create new user
            await $fetch('/api/users', {
                method: 'POST',
                body: formData.value
            });
        }
        showForm.value = false;
        await fetchUsers();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de l\'utilisateur');
    }
};

// Delete user
const deleteUser = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) return;

    try {
        await $fetch(`/api/users/${user._id}`, { method: 'DELETE' });
        await fetchUsers();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
    }
};

// Open API Key modal
const openApiKeyModal = (user: User) => {
    selectedUserForApiKey.value = user;
    generatedApiKey.value = user.apiKey || '';
    showApiKeyModal.value = true;
};

// Generate new API key
const generateApiKey = async () => {
    if (!selectedUserForApiKey.value) return;

    apiKeyLoading.value = true;
    try {
        const response = await $fetch<{ apiKey: string }>(`/api/users/${selectedUserForApiKey.value._id}/api-key`, {
            method: 'POST'
        });
        generatedApiKey.value = response.apiKey;
        await fetchUsers();
    } catch (error) {
        console.error('Erreur lors de la génération de la clé API:', error);
        alert('Erreur lors de la génération de la clé API');
    } finally {
        apiKeyLoading.value = false;
    }
};

// Revoke API key
const revokeApiKey = async () => {
    if (!selectedUserForApiKey.value) return;
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé API ? Les scripts utilisant cette clé ne pourront plus accéder à l\'API.')) return;

    apiKeyLoading.value = true;
    try {
        await $fetch(`/api/users/${selectedUserForApiKey.value._id}/api-key`, {
            method: 'DELETE'
        });
        generatedApiKey.value = '';
        await fetchUsers();
    } catch (error) {
        console.error('Erreur lors de la révocation de la clé API:', error);
        alert('Erreur lors de la révocation de la clé API');
    } finally {
        apiKeyLoading.value = false;
    }
};

// Copy API key to clipboard
const copyApiKey = async () => {
    try {
        await navigator.clipboard.writeText(generatedApiKey.value);
        alert('Clé API copiée dans le presse-papier !');
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
    }
};

// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

onMounted(() => {
    fetchUsers();
});
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-2xl font-bold text-white">Gestion des Utilisateurs</h3>
                <p class="text-zinc-400 text-sm mt-1">Gérez les comptes administrateurs et leurs clés API</p>
            </div>
            <button @click="openNewForm"
                class="flex items-center gap-2 px-4 py-2 bg-zinc-600/50 hover:bg-zinc-600/75 text-white rounded-lg text-sm font-medium transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Nouvel utilisateur
            </button>
        </div>

        <!-- Search -->
        <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" type="text" placeholder="Rechercher un utilisateur..."
                class="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        <!-- Users Table -->
        <div class="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center">
                <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto">
                </div>
                <p class="text-zinc-400 mt-3">Chargement...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredUsers.length === 0" class="p-8 text-center">
                <svg class="w-12 h-12 text-zinc-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-zinc-400 mt-3">Aucun utilisateur trouvé</p>
            </div>

            <!-- Table -->
            <table v-else class="w-full">
                <thead class="bg-zinc-800">
                    <tr>
                        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">
                            Utilisateur</th>
                        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">Email
                        </th>
                        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">Rôle
                        </th>
                        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">API
                        </th>
                        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">Créé
                            le</th>
                        <th class="text-right text-xs font-medium text-zinc-400 uppercase tracking-wider px-6 py-3">
                            Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800">
                    <tr v-for="user in filteredUsers" :key="user._id" class="hover:bg-zinc-800/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {{ user.username.charAt(0).toUpperCase() }}
                                </div>
                                <span class="text-white font-medium">{{ user.username }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-zinc-400">{{ user.email || '-' }}</td>
                        <td class="px-6 py-4">
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                user.role === 'superadmin'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : user.role === 'admin'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-green-500/20 text-green-400'
                            ]">
                                {{ user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' :
                                'Export' }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <span v-if="user.apiKey"
                                class="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                Active
                            </span>
                            <span v-else
                                class="px-2 py-1 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">
                                Inactive
                            </span>
                        </td>
                        <td class="px-6 py-4 text-zinc-400 text-sm">{{ formatDate(user.createdAt) }}</td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <!-- API Key Button -->
                                <button @click="openApiKeyModal(user)"
                                    class="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                    title="Gérer la clé API">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </button>
                                <!-- Edit Button -->
                                <button @click="openEditForm(user)"
                                    class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <!-- Delete Button -->
                                <button @click="deleteUser(user)"
                                    class="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Form -->
        <Teleport to="body">
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="showForm"
                    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div class="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md shadow-2xl">
                        <!-- Modal Header -->
                        <div class="flex items-center justify-between p-6 border-b border-zinc-700">
                            <h4 class="text-lg font-semibold text-white">
                                {{ editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}
                            </h4>
                            <button @click="showForm = false" class="text-zinc-400 hover:text-white transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <form @submit.prevent="saveUser" class="p-6 space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Nom d'utilisateur</label>
                                <input v-model="formData.username" type="text" required
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Email (optionnel)</label>
                                <input v-model="formData.email" type="email"
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Mot de passe</label>
                                <input v-model="formData.password" type="password" :required="!editingUser"
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Rôle</label>
                                <select v-model="formData.role"
                                    class="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="superadmin">Super Admin - Accès complet</option>
                                    <option value="admin">Admin - Sans gestion utilisateurs</option>
                                    <option value="export">Export - Participants uniquement</option>
                                </select>
                                <p class="text-xs text-zinc-500 mt-1">
                                    {{ formData.role === 'superadmin' ? 'Accès à toutes les fonctionnalités' :
                                        formData.role === 'admin' ? 'Participants, Formations, Logs' :
                                            'Uniquement la section Participants' }}
                                </p>
                            </div>

                            <!-- Actions -->
                            <div class="flex gap-3 pt-4">
                                <button type="button" @click="showForm = false"
                                    class="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors">
                                    Annuler
                                </button>
                                <button type="submit"
                                    class="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                                    {{ editingUser ? 'Mettre à jour' : 'Créer' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- API Key Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0"
                enter-to-class="opacity-100" leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="showApiKeyModal"
                    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div class="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-lg shadow-2xl">
                        <!-- Modal Header -->
                        <div class="flex items-center justify-between p-6 border-b border-zinc-700">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 class="text-lg font-semibold text-white">Clé API</h4>
                                    <p class="text-sm text-zinc-400">{{ selectedUserForApiKey?.username }}</p>
                                </div>
                            </div>
                            <button @click="showApiKeyModal = false"
                                class="text-zinc-400 hover:text-white transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6 space-y-4">
                            <!-- Info -->
                            <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                <p class="text-sm text-amber-300">
                                    <strong>Usage :</strong> Utilisez cette clé API dans vos scripts avec le header
                                    <code class="bg-zinc-800 px-1 rounded">X-API-Key: votre_clé</code>
                                </p>
                            </div>

                            <!-- Current API Key -->
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Clé API actuelle</label>
                                <div class="flex gap-2">
                                    <input type="text" :value="generatedApiKey || 'Aucune clé générée'" readonly
                                        class="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm" />
                                    <button v-if="generatedApiKey" @click="copyApiKey"
                                        class="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                                        title="Copier">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Example -->
                            <div>
                                <label class="block text-sm font-medium text-zinc-300 mb-2">Exemple Python</label>
                                <pre
                                    class="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto"><code>import requests

response = requests.get(
    "https://votre-domaine.com/api/routes/scores",
    headers={"X-API-Key": "{{ generatedApiKey || 'votre_clé_api' }}"}
)
print(response.json())</code></pre>
                            </div>

                            <!-- Actions -->
                            <div class="flex gap-3 pt-4">
                                <button @click="generateApiKey" :disabled="apiKeyLoading"
                                    class="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                    <svg v-if="apiKeyLoading" class="animate-spin w-4 h-4" fill="none"
                                        viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                        </path>
                                    </svg>
                                    {{ generatedApiKey ? 'Régénérer' : 'Générer' }} une clé
                                </button>
                                <button v-if="generatedApiKey" @click="revokeApiKey" :disabled="apiKeyLoading"
                                    class="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 rounded-lg font-medium transition-colors">
                                    Révoquer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
