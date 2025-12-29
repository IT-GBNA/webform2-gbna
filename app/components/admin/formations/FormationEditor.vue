<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';

interface FormData {
    id: string;
    displayName: string;
    description: string;
    duration: string;
    route: string;
    order: number;
    collectionName: string;
    videoUrl: string;
    coverImage?: string;
}

interface MediaItem {
    name: string;
    path: string;
    sizeFormatted?: string;
}

const props = defineProps<{
    formData: FormData;
    editMode: boolean;
    loading: boolean;
}>();

const emit = defineEmits<{
    'update:formData': [data: FormData];
    submit: [];
    cancel: [];
}>();

// Local copy of form data
const localData = ref({ ...props.formData });
const isUpdatingFromProps = ref(false);

// Sections management
const openSections = ref({
    general: true,
    technical: false,
    appearance: false,
    media: false
});

const toggleSection = (section: keyof typeof openSections.value) => {
    openSections.value[section] = !openSections.value[section];
};

// Fonction pour convertir un texte en slug (ID technique)
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
        .trim()
        .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
        .replace(/-+/g, '_') // Remplacer les tirets par des underscores
        .replace(/_+/g, '_'); // Éviter les underscores multiples
};

// Sync with props (external updates)
watch(() => props.formData, (val) => {
    isUpdatingFromProps.value = true;
    localData.value = { ...val };
    nextTick(() => {
        isUpdatingFromProps.value = false;
    });
}, { deep: true });

// Sync back to parent (internal updates only)
watch(localData, (val) => {
    if (!isUpdatingFromProps.value) {
        emit('update:formData', val);
    }
}, { deep: true });

// Générer automatiquement ID, collection et route quand on modifie le nom (seulement en création)
watch(() => localData.value.displayName, (newName) => {
    if (!props.editMode && newName && !isUpdatingFromProps.value) {
        const slug = slugify(newName);
        if (slug) {
            const formId = `form_${slug}`;
            localData.value.id = formId;
            localData.value.collectionName = `questions_${slug}`;
            // La route doit utiliser l'ID complet pour que le moduleId corresponde
            localData.value.route = `/formation/${formId}`;
        }
    }
});

// Media management
const mediaTab = ref<'video' | 'image' | 'presentation'>('video');
const availableVideos = ref<MediaItem[]>([]);
const availableImages = ref<MediaItem[]>([]);
const availablePresentations = ref<MediaItem[]>([]);

const currentMediaType = computed(() => {
    const url = localData.value.videoUrl || '';
    if (url.includes('/images/') || url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.includes('.pptx') || url.includes('.ppt') || url.includes('.pdf') || url.includes('/presentations/')) return 'presentation';
    return 'video';
});

const clearMedia = () => {
    localData.value.videoUrl = '';
};

// Fetch available media
const fetchVideos = async () => {
    try {
        const data = await $fetch<{ videos: MediaItem[] }>('/api/videos');
        availableVideos.value = data.videos || [];
    } catch (err) {
        console.error('Error fetching videos:', err);
    }
};

const fetchImages = async () => {
    try {
        const data = await $fetch<{ images: MediaItem[] }>('/api/images');
        availableImages.value = data.images || [];
    } catch (err) {
        console.error('Error fetching images:', err);
    }
};

const fetchPresentations = async () => {
    try {
        const data = await $fetch<{ presentations: MediaItem[] }>('/api/presentations');
        availablePresentations.value = data.presentations || [];
    } catch (err) {
        console.error('Error fetching presentations:', err);
    }
};

// Upload handlers
const handleVideoUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
        const result = await $fetch<{ path: string; name: string }>('/api/videos/upload', {
            method: 'POST',
            body: formData,
        });
        localData.value.videoUrl = result.path;
        await fetchVideos();
    } catch (err) {
        console.error('Error uploading video:', err);
    }
    input.value = '';
};

const handleImageUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const result = await $fetch<{ path: string; name: string }>('/api/images/upload', {
            method: 'POST',
            body: formData,
        });
        localData.value.videoUrl = result.path;
        await fetchImages();
    } catch (err) {
        console.error('Error uploading image:', err);
    }
    input.value = '';
};

const handlePresentationUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('presentation', file);

    try {
        const result = await $fetch<{ path: string; name: string }>('/api/presentations/upload', {
            method: 'POST',
            body: formData,
        });
        localData.value.videoUrl = result.path;
        await fetchPresentations();
    } catch (err) {
        console.error('Error uploading presentation:', err);
    }
    input.value = '';
};

// Upload cover image
const handleCoverImageUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const result = await $fetch<{ path: string; name: string }>('/api/images/upload', {
            method: 'POST',
            body: formData,
        });
        localData.value.coverImage = result.path;
        await fetchImages();
    } catch (err) {
        console.error('Error uploading cover image:', err);
    }
    input.value = '';
};

// Init
fetchVideos();
fetchImages();
fetchPresentations();
</script>

<template>
    <div class="p-4 space-y-4">

        <!-- Section 1: Informations Générales -->
        <div class="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/30">
            <button @click="toggleSection('general')"
                class="w-full px-4 py-3 flex items-center justify-between bg-zinc-800 hover:bg-zinc-750 transition-colors text-left cursor-pointer">
                <div class="flex items-center gap-2">
                    <span class="text-lg">📝</span>
                    <span class="font-medium text-zinc-200">Informations Générales</span>
                </div>
                <svg class="w-5 h-5 text-zinc-400 transform transition-transform duration-200"
                    :class="{ 'rotate-180': openSections.general }" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div v-show="openSections.general" class="p-4 space-y-4 border-t border-zinc-700">
                <!-- Display Name -->
                <div>
                    <label class="block text-xs text-zinc-400 mb-1">Nom affiché *</label>
                    <input v-model="localData.displayName" type="text" required class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm 
                        focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Sensibilisation à la cybersécurité" />
                    <p v-if="!editMode" class="text-xs text-zinc-500 mt-1">💡 L'ID, la collection et la route seront
                        générés automatiquement</p>
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-xs text-zinc-400 mb-1">Description *</label>
                    <textarea v-model="localData.description" rows="2" required class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm 
                        focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Description de la formation..."></textarea>
                </div>

                <!-- Duration -->
                <div>
                    <label class="block text-xs text-zinc-400 mb-1">Durée *</label>
                    <input v-model="localData.duration" type="text" required class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm 
                        focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="10 minutes" />
                    <p class="text-xs text-zinc-500 mt-1">💡 Indiquez la durée en minutes (ex: "10 minutes", "15
                        minutes")</p>
                </div>
            </div>
        </div>

        <!-- Section 2: Paramètres Techniques (Edit Mode Only) -->
        <div v-if="editMode" class="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/30">
            <button @click="toggleSection('technical')"
                class="w-full px-4 py-3 flex items-center justify-between bg-zinc-800 hover:bg-zinc-750 transition-colors text-left cursor-pointer">
                <div class="flex items-center gap-2">
                    <span class="text-lg">⚙️</span>
                    <span class="font-medium text-zinc-200">Paramètres Techniques</span>
                </div>
                <svg class="w-5 h-5 text-zinc-400 transform transition-transform duration-200"
                    :class="{ 'rotate-180': openSections.technical }" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div v-show="openSections.technical" class="p-4 space-y-4 border-t border-zinc-700">
                <div class="grid grid-cols-2 gap-3">
                    <!-- ID Field -->
                    <div>
                        <label class="block text-xs text-zinc-500 mb-1">ID technique</label>
                        <input v-model="localData.id" type="text" disabled
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 text-sm cursor-not-allowed" />
                    </div>
                    <!-- Collection -->
                    <div>
                        <label class="block text-xs text-zinc-500 mb-1">Collection</label>
                        <input v-model="localData.collectionName" type="text"
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 text-sm" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <!-- Route -->
                    <div>
                        <label class="block text-xs text-zinc-500 mb-1">Route</label>
                        <input v-model="localData.route" type="text"
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 text-sm" />
                    </div>
                    <!-- Order -->
                    <div>
                        <label class="block text-xs text-zinc-500 mb-1">Ordre</label>
                        <input v-model.number="localData.order" type="number" min="1" disabled
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 text-sm cursor-not-allowed" />
                        <p class="text-xs text-zinc-600 mt-0.5">Géré via glisser-déposer</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 3: Apparence -->
        <div class="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/30">
            <button @click="toggleSection('appearance')"
                class="w-full px-4 py-3 flex items-center justify-between bg-zinc-800 hover:bg-zinc-750 transition-colors text-left cursor-pointer">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🖼️</span>
                    <span class="font-medium text-zinc-200">Apparence</span>
                </div>
                <svg class="w-5 h-5 text-zinc-400 transform transition-transform duration-200"
                    :class="{ 'rotate-180': openSections.appearance }" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div v-show="openSections.appearance" class="p-4 border-t border-zinc-700">
                <label class="block text-xs text-zinc-400 mb-2">Image de couverture (affichage grille)</label>
                <div class="flex gap-3">
                    <!-- Preview -->
                    <div v-if="localData.coverImage"
                        class="w-24 h-16 rounded-lg overflow-hidden bg-zinc-700 shrink-0 relative group">
                        <img :src="localData.coverImage" :alt="localData.displayName"
                            class="w-full h-full object-cover" />
                        <button @click="localData.coverImage = ''" type="button"
                            class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span class="text-white text-xs">✕ Retirer</span>
                        </button>
                    </div>
                    <div v-else class="w-24 h-16 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                        <span class="text-zinc-500 text-xs">Aucune</span>
                    </div>

                    <!-- Selector + Upload -->
                    <div class="flex-1 space-y-2">
                        <div class="flex gap-2">
                            <select v-model="localData.coverImage"
                                class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                                <option value="">-- Sélectionner une image --</option>
                                <option v-for="image in availableImages" :key="image.path" :value="image.path">
                                    {{ image.name }}
                                </option>
                            </select>
                            <label
                                class="px-3 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload
                                <input type="file" accept="image/*" @change="handleCoverImageUpload" class="hidden" />
                            </label>
                        </div>
                        <p class="text-xs text-zinc-500">Image affichée sur les cartes de formation (sélectionner ou
                            uploader)</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: Contenu / Média -->
        <div class="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/30">
            <button @click="toggleSection('media')"
                class="w-full px-4 py-3 flex items-center justify-between bg-zinc-800 hover:bg-zinc-750 transition-colors text-left cursor-pointer">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🎬</span>
                    <span class="font-medium text-zinc-200">Contenu de la formation</span>
                </div>
                <svg class="w-5 h-5 text-zinc-400 transform transition-transform duration-200"
                    :class="{ 'rotate-180': openSections.media }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div v-show="openSections.media" class="p-4 border-t border-zinc-700">
                <label class="block text-xs text-zinc-400 mb-2">Média principal</label>

                <!-- Tabs -->
                <div class="flex gap-1 mb-3">
                    <button @click="mediaTab = 'video'" type="button"
                        class="px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer"
                        :class="mediaTab === 'video' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                        🎬 Vidéo
                    </button>
                    <button @click="mediaTab = 'image'" type="button"
                        class="px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer"
                        :class="mediaTab === 'image' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                        🖼️ Image
                    </button>
                    <button @click="mediaTab = 'presentation'" type="button"
                        class="px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer"
                        :class="mediaTab === 'presentation' ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                        📊 Présentation
                    </button>
                </div>

                <!-- Current media -->
                <div v-if="localData.videoUrl"
                    class="mb-3 p-2 bg-zinc-800 rounded-lg flex items-center justify-between">
                    <span class="text-xs text-zinc-300 truncate flex-1">{{ localData.videoUrl }}</span>
                    <button @click="clearMedia" type="button"
                        class="text-red-400 hover:text-red-300 text-xs cursor-pointer">
                        ✕
                    </button>
                </div>

                <!-- Video tab -->
                <div v-if="mediaTab === 'video'" class="space-y-2">
                    <select v-model="localData.videoUrl"
                        class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                        <option value="">-- Sélectionner une vidéo --</option>
                        <option v-for="video in availableVideos" :key="video.path" :value="video.path">
                            {{ video.name }} ({{ video.sizeFormatted }})
                        </option>
                    </select>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">ou</span>
                        <label class="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                            📤 Uploader une vidéo
                            <input type="file" accept="video/*" @change="handleVideoUpload" class="hidden" />
                        </label>
                    </div>
                </div>

                <!-- Image tab -->
                <div v-if="mediaTab === 'image'" class="space-y-2">
                    <select v-model="localData.videoUrl"
                        class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                        <option value="">-- Sélectionner une image --</option>
                        <option v-for="image in availableImages" :key="image.path" :value="image.path">
                            {{ image.name }}
                        </option>
                    </select>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">ou</span>
                        <label class="text-xs text-green-400 hover:text-green-300 cursor-pointer">
                            📤 Uploader une image
                            <input type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
                        </label>
                    </div>
                </div>

                <!-- Presentation tab -->
                <div v-if="mediaTab === 'presentation'" class="space-y-2">
                    <select v-model="localData.videoUrl"
                        class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                        <option value="">-- Sélectionner une présentation --</option>
                        <option v-for="pres in availablePresentations" :key="pres.path" :value="pres.path">
                            {{ pres.name }}
                        </option>
                    </select>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-zinc-500">ou</span>
                        <label class="text-xs text-orange-400 hover:text-orange-300 cursor-pointer">
                            📤 Uploader (PDF/PPTX)
                            <input type="file" accept=".pdf,.pptx,.ppt" @change="handlePresentationUpload"
                                class="hidden" />
                        </label>
                    </div>
                </div>

                <!-- Media Preview - Improved -->
                <div v-if="localData.videoUrl"
                    class="mt-4 border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900">
                    <div class="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                        <span class="text-sm text-zinc-300 font-medium flex items-center gap-2">
                            <span v-if="currentMediaType === 'video'">🎬</span>
                            <span v-else-if="currentMediaType === 'image'">🖼️</span>
                            <span v-else>📊</span>
                            Aperçu du média
                        </span>
                        <div class="flex items-center gap-2">
                            <a :href="localData.videoUrl" target="_blank"
                                class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs transition-colors flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Ouvrir
                            </a>
                            <button @click="clearMedia" type="button"
                                class="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs transition-colors cursor-pointer">
                                ✕ Retirer
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <!-- Video Preview -->
                        <video v-if="currentMediaType === 'video'" :src="localData.videoUrl" controls
                            class="w-full max-h-64 rounded-lg bg-black shadow-lg">
                            Votre navigateur ne supporte pas la lecture vidéo.
                        </video>

                        <!-- Image Preview -->
                        <div v-else-if="currentMediaType === 'image'" class="relative group">
                            <img :src="localData.videoUrl" :alt="localData.displayName"
                                class="w-full max-h-64 object-contain rounded-lg bg-zinc-800 shadow-lg" />
                            <div
                                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <a :href="localData.videoUrl" target="_blank"
                                    class="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                                    Voir en taille réelle
                                </a>
                            </div>
                        </div>

                        <!-- Presentation Preview -->
                        <div v-else-if="currentMediaType === 'presentation'"
                            class="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
                            <div
                                class="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-xl">
                                <span class="text-3xl">📊</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-white font-medium">Présentation</p>
                                <p class="text-zinc-400 text-sm truncate">{{ localData.videoUrl.split('/').pop() }}</p>
                                <a :href="localData.videoUrl" target="_blank"
                                    class="inline-flex items-center gap-1 mt-2 text-orange-400 hover:text-orange-300 text-sm transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Télécharger / Ouvrir
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submit buttons -->
        <div class="flex gap-2 pt-4 border-t border-zinc-700">
            <button @click="$emit('cancel')" type="button"
                class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors cursor-pointer">
                Annuler
            </button>
            <button @click="$emit('submit')" :disabled="loading" type="button"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                {{ loading ? '...' : (editMode ? 'Mettre à jour' : 'Créer') }}
            </button>
        </div>
    </div>
</template>
