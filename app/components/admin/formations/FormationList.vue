<script setup lang="ts">
import { Bars3Icon } from '@heroicons/vue/24/outline';
import { VueDraggable } from 'vue-draggable-plus';
import { ref, computed } from 'vue';

interface Formation {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    order: number;
    collectionName: string;
    videoUrl?: string;
    exportEnabled?: boolean;
    exportRecipients?: string[];
}

const props = defineProps<{
    formations: Formation[];
    selectedFormationId?: string | null;
}>();

const emit = defineEmits<{
    'update:formations': [formations: Formation[]];
    select: [formation: Formation];
    edit: [formation: Formation];
    delete: [id: string];
    questions: [formation: Formation];
    reorder: [];
    create: [];
}>();

// Local copy for dragging
const localFormations = computed({
    get: () => props.formations,
    set: (val) => emit('update:formations', val)
});

// Menu dropdown state
const openMenuId = ref<string | null>(null);
const isDragging = ref(false);

const toggleMenu = (id: string) => {
    openMenuId.value = openMenuId.value === id ? null : id;
};

const closeMenu = () => {
    openMenuId.value = null;
};

const getMenuPosition = () => {
    if (!openMenuId.value) return {};
    const btn = document.getElementById('menu-btn-' + openMenuId.value);
    if (!btn) return { top: '100px', right: '20px' };
    const rect = btn.getBoundingClientRect();
    return {
        top: rect.bottom + 4 + 'px',
        left: Math.max(10, rect.right - 176) + 'px'
    };
};

const onDragStart = () => {
    isDragging.value = true;
};

const onDragEnd = () => {
    isDragging.value = false;
    emit('reorder');
};
</script>

<template>
    <div class="w-full lg:w-1/4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <!-- Header -->
        <div class="px-3 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
            <h2 class="text-zinc-200 font-medium text-sm flex items-center gap-2">
                <svg class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Formations
                <span class="text-zinc-500 text-sm">({{ formations.length }})</span>
            </h2>
            <button @click="$emit('create')"
                class="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Nouvelle formation">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>

        <div class="p-3">
            <!-- Empty state -->
            <div v-if="formations.length === 0" class="text-center py-6 text-zinc-500 text-sm">
                <svg class="w-8 h-8 mx-auto mb-2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Aucune formation
            </div>

            <!-- Draggable list -->
            <VueDraggable v-else v-model="localFormations" :animation="200" ghost-class="ghost-card"
                drag-class="dragging-card" handle=".drag-handle" @start="onDragStart" @end="onDragEnd"
                class="space-y-1.5">
                <div v-for="formation in localFormations" :key="formation.id"
                    class="bg-gradient-to-bl from-gray-600/20 via-zinc-800/25 to-gray-700/20 border-t border-zinc-200/20 rounded-lg px-3 py-2 transition-all group hover:bg-zinc-800/40"
                    :class="{ 'ring-1 ring-blue-500': selectedFormationId === formation.id }">
                    <div class="flex items-center justify-between gap-2">
                        <!-- Left: Drag + Name (clickable) -->
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <div
                                class="drag-handle cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-zinc-700 transition-colors shrink-0">
                                <Bars3Icon class="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                            </div>
                            <span @click="$emit('edit', formation)"
                                class="text-white font-semibold text-sm truncate cursor-pointer hover:text-blue-300 transition-colors">
                                {{ formation.displayName }}
                            </span>
                            <span class="text-[10px] bg-zinc-700/50 px-1.5 py-0.5 rounded text-zinc-400 shrink-0">
                                #{{ formation.order }}
                            </span>
                        </div>

                        <!-- Right: Info + Menu -->
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[10px] text-gray-500 hidden sm:inline">⏱️ {{ formation.duration }}</span>

                            <!-- Dropdown Menu Button -->
                            <button @click.stop="toggleMenu(formation.id)"
                                class="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                                :id="'menu-btn-' + formation.id">
                                <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </VueDraggable>
        </div>

        <!-- Dropdown Menu (Teleported) -->
        <Teleport to="body">
            <div v-if="openMenuId" class="fixed inset-0 z-[100]" @click="closeMenu">
                <div class="fixed bg-zinc-800 border border-zinc-600 rounded-lg shadow-2xl z-[101] py-1 w-44"
                    :style="getMenuPosition()">
                    <button @click="$emit('questions', localFormations.find(f => f.id === openMenuId)!); closeMenu()"
                        class="w-full px-3 py-2 text-left text-sm text-purple-300 hover:bg-purple-600/20 transition-colors flex items-center gap-2 cursor-pointer">
                        📝 Questions
                    </button>
                    <button @click="$emit('edit', localFormations.find(f => f.id === openMenuId)!); closeMenu()"
                        class="w-full px-3 py-2 text-left text-sm text-blue-300 hover:bg-blue-600/20 transition-colors flex items-center gap-2 cursor-pointer">
                        ✏️ Modifier
                    </button>
                    <div class="border-t border-zinc-700 my-1"></div>
                    <button @click="$emit('delete', openMenuId!); closeMenu()"
                        class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-2 cursor-pointer">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.ghost-card {
    opacity: 0.5;
    background: rgba(59, 130, 246, 0.1);
    border: 1px dashed rgba(59, 130, 246, 0.5);
}

.dragging-card {
    transform: rotate(2deg);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}
</style>
