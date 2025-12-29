<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import {
    HomeIcon,
    AcademicCapIcon,
    UserIcon,
    ArrowLeftStartOnRectangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Cog6ToothIcon
} from '@heroicons/vue/24/outline'
import { useAuth } from '~/composables/useAuth';

// Bouton log out
const { data, signOut, fetchUser } = useAuth();

// Utilise computed pour que ça change dynamiquement si 'data' change
const isLoggedIn = computed(() => data.value !== null);

const handleLogout = async () => {
    if (!isLoggedIn.value) {
        alert('Vous n\'êtes pas connecté.');
        return;
    }
    await signOut();
};

// Vérifier si l'utilisateur est déjà connecté au chargement de la page
onMounted(async () => {
    if (!data.value) {
        await fetchUser();
    }
});

// Gestion des menus dépliants
const openMenus = ref({
    navigation: true,
    account: true
});

const toggleMenu = (menu: keyof typeof openMenus.value) => {
    openMenus.value[menu] = !openMenus.value[menu];
};
</script>

<template>
    <aside :class="[
        'fixed top-4 h-11/12 bg-gradient-to-tr from-gray-100/25 via-white/25 to-gray-100/25 border border-white shadow-xl z-[100] flex m-4 rounded-xl flex-col transition-all duration-200 w-80 backdrop-blur-md'
    ]">
        <!-- Logo Section -->
        <div class="p-6 border-b border-white/10 flex justify-center items-center mt-8 mb-4">
            <a href="/" class="transition-transform hover:scale-105 duration-200">
                <img src="../img/gbnasante.png" class="w-20 h-20 object-contain transition-all duration-200">
            </a>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar flex flex-col">

            <!-- Navigation Group -->
            <div class="bg-white/40 rounded-xl border border-white/50 overflow-hidden shadow-sm">
                <button @click="toggleMenu('navigation')"
                    class="w-full px-4 py-3 flex items-center justify-between bg-white/50 hover:bg-white/80 transition-colors text-left">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Navigation</span>
                    <component :is="openMenus.navigation ? ChevronUpIcon : ChevronDownIcon"
                        class="w-4 h-4 text-gray-400" />
                </button>

                <div v-show="openMenus.navigation" class="p-2 space-y-1">
                    <NuxtLink to="/" active-class="bg-green-50 text-green-700 border-green-200"
                        class="flex items-center p-2 rounded-lg border border-transparent text-gray-600 hover:bg-white hover:text-green-600 hover:border-green-100 hover:shadow-sm transition-all duration-200 group">
                        <HomeIcon class="h-5 w-5 mr-3 text-gray-400 group-hover:text-green-500 transition-colors" />
                        <span class="text-sm font-medium">Accueil</span>
                    </NuxtLink>

                    <NuxtLink to="/module" active-class="bg-green-50 text-green-700 border-green-200"
                        class="flex items-center p-2 rounded-lg border border-transparent text-gray-600 hover:bg-white hover:text-green-600 hover:border-green-100 hover:shadow-sm transition-all duration-200 group">
                        <AcademicCapIcon
                            class="h-5 w-5 mr-3 text-gray-400 group-hover:text-green-500 transition-colors" />
                        <span class="text-sm font-medium">Modules</span>
                    </NuxtLink>
                </div>
            </div>

            <!-- Spacer to push Account Group to bottom -->
            <div class="flex-1"></div>

            <!-- Account Group -->
            <div class="bg-white/40 rounded-xl border border-white/50 overflow-hidden shadow-sm mt-auto">
                <button @click="toggleMenu('account')"
                    class="w-full px-4 py-3 flex items-center justify-between bg-white/50 hover:bg-white/80 transition-colors text-left">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Espace Personnel</span>
                    <component :is="openMenus.account ? ChevronUpIcon : ChevronDownIcon"
                        class="w-4 h-4 text-gray-400" />
                </button>

                <div v-show="openMenus.account" class="p-2 space-y-1">
                    <!-- Logged In State -->
                    <template v-if="isLoggedIn && data">
                        <!-- User Profile Summary -->
                        <div
                            class="flex items-center gap-3 p-3 mb-2 rounded-lg bg-blue-50/50 border border-blue-100/50">
                            <div
                                class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                {{ data.username?.charAt(0).toUpperCase() || 'U' }}
                            </div>
                            <div class="flex flex-col overflow-hidden flex-1 min-w-0">
                                <span class="text-sm font-semibold text-gray-700 truncate">{{ data.username }}</span>
                                <span class="text-[10px] text-gray-500 truncate">Connecté</span>
                            </div>
                        </div>

                        <!-- Admin Link -->
                        <NuxtLink to="/administration" active-class="bg-purple-50 text-purple-700 border-purple-200"
                            class="flex items-center p-2 rounded-lg border border-transparent text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-100 transition-all duration-200 group">
                            <Cog6ToothIcon
                                class="h-5 w-5 mr-3 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            <span class="text-sm font-medium">Console Admin</span>
                        </NuxtLink>

                        <!-- Logout -->
                        <button @click="handleLogout"
                            class="w-full flex items-center p-2 rounded-lg border border-transparent text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 group text-left">
                            <ArrowLeftStartOnRectangleIcon
                                class="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                            <span class="text-sm font-medium">Déconnexion</span>
                        </button>
                    </template>

                    <!-- Logged Out State -->
                    <template v-else>
                        <NuxtLink to="/login" active-class="bg-green-50 text-green-700 border-green-200"
                            class="flex items-center p-2 rounded-lg border border-transparent text-gray-600 hover:bg-white hover:text-green-600 hover:border-green-100 hover:shadow-sm transition-all duration-200 group">
                            <UserIcon class="h-5 w-5 mr-3 text-gray-400 group-hover:text-green-500 transition-colors" />
                            <span class="text-sm font-medium">Se connecter</span>
                        </NuxtLink>
                    </template>
                </div>
            </div>

        </div>

        <!-- Footer / Version -->

    </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 20px;
}
</style>
