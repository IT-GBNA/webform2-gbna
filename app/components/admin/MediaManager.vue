<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface MediaItem {
    name: string;
    path: string;
    sizeFormatted?: string;
    modifiedAt?: Date;
}

// State
const activeTab = ref<'videos' | 'images' | 'presentations'>('videos');
const videos = ref<MediaItem[]>([]);
const images = ref<MediaItem[]>([]);
const presentations = ref<MediaItem[]>([]);
const loading = ref(false);
const success = ref('');
const error = ref('');

// Preview modal
const previewModal = ref(false);
const previewItem = ref<MediaItem | null>(null);
const previewType = ref<'video' | 'image' | 'presentation'>('video');

// View mode
const viewMode = ref<'list' | 'grid'>('grid');

// Fetch functions
const fetchVideos = async () => {
    try {
        const data = await $fetch<{ videos: MediaItem[] }>('/api/videos');
        videos.value = data.videos || [];
    } catch (err) {
        console.error('Error fetching videos:', err);
    }
};

const fetchImages = async () => {
    try {
        const data = await $fetch<{ images: MediaItem[] }>('/api/images');
        images.value = data.images || [];
    } catch (err) {
        console.error('Error fetching images:', err);
    }
};

const fetchPresentations = async () => {
    try {
        const data = await $fetch<{ presentations: MediaItem[] }>('/api/presentations');
        presentations.value = data.presentations || [];
    } catch (err) {
        console.error('Error fetching presentations:', err);
    }
};

const fetchAll = async () => {
    loading.value = true;
    await Promise.all([fetchVideos(), fetchImages(), fetchPresentations()]);
    loading.value = false;
};

// Preview functions
const openPreview = (item: MediaItem, type: 'video' | 'image' | 'presentation') => {
    previewItem.value = item;
    previewType.value = type;
    previewModal.value = true;
};

const closePreview = () => {
    previewModal.value = false;
    previewItem.value = null;
};

// Delete functions
const deleteVideo = async (filename: string) => {
    if (!confirm(`Supprimer la vidéo "${filename}" ?`)) return;

    try {
        await $fetch('/api/videos/delete', {
            method: 'POST',
            body: { filename }
        });
        success.value = 'Vidéo supprimée';
        await fetchVideos();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message || 'Erreur';
    }
};

const deleteImage = async (filename: string) => {
    if (!confirm(`Supprimer l'image "${filename}" ?`)) return;

    try {
        await $fetch('/api/images/delete', {
            method: 'POST',
            body: { filename }
        });
        success.value = 'Image supprimée';
        await fetchImages();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message || 'Erreur';
    }
};

const deletePresentation = async (filename: string) => {
    if (!confirm(`Supprimer la présentation "${filename}" ?`)) return;

    try {
        await $fetch('/api/presentations/delete', {
            method: 'POST',
            body: { filename }
        });
        success.value = 'Présentation supprimée';
        await fetchPresentations();
        setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
        error.value = err.message || 'Erreur';
    }
};

onMounted(fetchAll);
</script>

<template>
    <div class="w-full">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-xl font-bold text-white mb-1">📁 Gestion des Médias</h2>
                <p class="text-zinc-400 text-sm">Gérez les fichiers uploadés (vidéos, images, présentations)</p>
            </div>

            <!-- View toggle -->
            <div class="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                <button @click="viewMode = 'grid'" class="p-2 rounded transition-colors cursor-pointer"
                    :class="viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </button>
                <button @click="viewMode = 'list'" class="p-2 rounded transition-colors cursor-pointer"
                    :class="viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Alerts -->
        <div v-if="success" class="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
            {{ success }}
        </div>
        <div v-if="error" class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {{ error }}
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-4">
            <button @click="activeTab = 'videos'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer" :class="activeTab === 'videos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                🎬 Vidéos ({{ videos.length }})
            </button>
            <button @click="activeTab = 'images'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer" :class="activeTab === 'images'
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                🖼️ Images ({{ images.length }})
            </button>
            <button @click="activeTab = 'presentations'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer" :class="activeTab === 'presentations'
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                📊 Présentations ({{ presentations.length }})
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-8 text-zinc-400">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            Chargement...
        </div>

        <!-- Videos Tab -->
        <div v-else-if="activeTab === 'videos'">
            <div v-if="videos.length === 0" class="text-center py-12 text-zinc-500">
                <span class="text-4xl mb-4 block">🎬</span>
                Aucune vidéo uploadée
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="video in videos" :key="video.path"
                    class="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 group hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                    <!-- Video Thumbnail -->
                    <div class="relative aspect-video bg-zinc-900 flex items-center justify-center cursor-pointer"
                        @click="openPreview(video, 'video')">
                        <video :src="video.path" class="w-full h-full object-cover" muted></video>
                        <div
                            class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                                class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-white text-sm font-medium truncate mb-1">{{ video.name }}</p>
                        <div class="flex items-center justify-between">
                            <p class="text-zinc-500 text-xs">{{ video.sizeFormatted }}</p>
                            <button @click="deleteVideo(video.name)"
                                class="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="space-y-2">
                <div v-for="video in videos" :key="video.path"
                    class="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 group hover:border-blue-500/50 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        @click="openPreview(video, 'video')">
                        <div class="w-16 h-10 bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                            <video :src="video.path" class="w-full h-full object-cover" muted></video>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-white text-sm font-medium truncate">{{ video.name }}</p>
                            <p class="text-zinc-500 text-xs">{{ video.sizeFormatted }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="openPreview(video, 'video')"
                            class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg text-xs transition-colors cursor-pointer">
                            👁️ Voir
                        </button>
                        <button @click="deleteVideo(video.name)"
                            class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Images Tab -->
        <div v-else-if="activeTab === 'images'">
            <div v-if="images.length === 0" class="text-center py-12 text-zinc-500">
                <span class="text-4xl mb-4 block">🖼️</span>
                Aucune image uploadée
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="image in images" :key="image.path"
                    class="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 group hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
                    <!-- Image Thumbnail -->
                    <div class="relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden"
                        @click="openPreview(image, 'image')">
                        <img :src="image.path" :alt="image.name"
                            class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div
                            class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                                class="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                                Agrandir
                            </div>
                        </div>
                    </div>
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-white text-sm font-medium truncate mb-1">{{ image.name }}</p>
                        <div class="flex items-center justify-between">
                            <p class="text-zinc-500 text-xs">{{ image.sizeFormatted }}</p>
                            <button @click="deleteImage(image.name)"
                                class="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="space-y-2">
                <div v-for="image in images" :key="image.path"
                    class="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 group hover:border-green-500/50 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        @click="openPreview(image, 'image')">
                        <img :src="image.path" :alt="image.name"
                            class="w-12 h-12 object-cover rounded-lg bg-zinc-700" />
                        <div class="min-w-0 flex-1">
                            <p class="text-white text-sm font-medium truncate">{{ image.name }}</p>
                            <p class="text-zinc-500 text-xs">{{ image.sizeFormatted }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="openPreview(image, 'image')"
                            class="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg text-xs transition-colors cursor-pointer">
                            👁️ Voir
                        </button>
                        <button @click="deleteImage(image.name)"
                            class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Presentations Tab -->
        <div v-else-if="activeTab === 'presentations'">
            <div v-if="presentations.length === 0" class="text-center py-12 text-zinc-500">
                <span class="text-4xl mb-4 block">📊</span>
                Aucune présentation uploadée
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="pres in presentations" :key="pres.path"
                    class="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 group hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                    <!-- Presentation Thumbnail -->
                    <div class="relative aspect-video bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center cursor-pointer"
                        @click="openPreview(pres, 'presentation')">
                        <span class="text-5xl">📊</span>
                        <div
                            class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                                class="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                                Ouvrir
                            </div>
                        </div>
                    </div>
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-white text-sm font-medium truncate mb-1">{{ pres.name }}</p>
                        <div class="flex items-center justify-between">
                            <p class="text-zinc-500 text-xs">{{ pres.sizeFormatted }}</p>
                            <button @click="deletePresentation(pres.name)"
                                class="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="space-y-2">
                <div v-for="pres in presentations" :key="pres.path"
                    class="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 group hover:border-orange-500/50 transition-colors">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <span class="text-lg">📊</span>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-white text-sm font-medium truncate">{{ pres.name }}</p>
                            <p class="text-zinc-500 text-xs">{{ pres.sizeFormatted }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <a :href="pres.path" target="_blank"
                            class="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded-lg text-xs transition-colors cursor-pointer">
                            📥 Télécharger
                        </a>
                        <button @click="deletePresentation(pres.name)"
                            class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Preview Modal -->
        <Teleport to="body">
            <div v-if="previewModal"
                class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                @click="closePreview">
                <div class="relative max-w-4xl w-full max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl"
                    @click.stop>
                    <!-- Header -->
                    <div class="px-4 py-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                        <h3 class="text-white font-medium truncate pr-4">{{ previewItem?.name }}</h3>
                        <div class="flex items-center gap-2 shrink-0">
                            <a :href="previewItem?.path" target="_blank"
                                class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Ouvrir
                            </a>
                            <button @click="closePreview"
                                class="p-2 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-4 max-h-[75vh] overflow-auto">
                        <!-- Video -->
                        <video v-if="previewType === 'video'" :src="previewItem?.path" controls autoplay
                            class="w-full rounded-lg bg-black max-h-[65vh]">
                        </video>

                        <!-- Image -->
                        <img v-else-if="previewType === 'image'" :src="previewItem?.path" :alt="previewItem?.name"
                            class="w-full h-auto rounded-lg object-contain max-h-[65vh]" />

                        <!-- Presentation -->
                        <div v-else-if="previewType === 'presentation'" class="text-center py-12">
                            <div
                                class="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-2xl flex items-center justify-center">
                                <span class="text-5xl">📊</span>
                            </div>
                            <p class="text-white text-lg font-medium mb-2">{{ previewItem?.name }}</p>
                            <p class="text-zinc-400 text-sm mb-6">{{ previewItem?.sizeFormatted }}</p>
                            <a :href="previewItem?.path" target="_blank"
                                class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Télécharger / Ouvrir
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
