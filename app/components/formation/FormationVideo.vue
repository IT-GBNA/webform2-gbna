<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import PdfViewer from './PdfViewer.vue';

const props = defineProps({
    institution: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        default: ''
    },
    formationTitle: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['start-quiz']);

// Detect media type
const mediaType = computed(() => {
    if (!props.videoUrl) return null;
    const url = props.videoUrl.toLowerCase();

    // Embeds (YouTube, Vimeo, Canva)
    if (url.includes('youtube') || url.includes('vimeo') || url.includes('canva') || url.includes('embed')) {
        return 'embed';
    }

    // Video files
    if (['.mp4', '.webm', '.ogg', '.mov'].some(ext => url.includes(ext))) {
        return 'video';
    }

    // Image files
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(ext => url.includes(ext))) {
        return 'image';
    }

    // PDF - use custom viewer with navigation
    if (url.includes('.pdf')) {
        return 'pdf';
    }

    // Default to embed for unknown URLs
    return 'embed';
});
</script>

<template>
    <section id="video">
        <div class="flex justify-center flex-col items-center pt-8">

            <!-- Bloc média -->
            <div v-if="videoUrl"
                class="bg-gradient-to-t from-white to-gray-200 w-full max-w-5xl flex flex-col items-center justify-center p-6 md:p-10 rounded-xl mb-10">

                <!-- Embed (YouTube, Vimeo, Canva) -->
                <div v-if="mediaType === 'embed'" class="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                    <iframe loading="lazy" class="w-full h-full" :src="videoUrl" allowfullscreen="allowfullscreen"
                        allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                    </iframe>
                </div>

                <!-- Vidéo locale (MP4, WebM) -->
                <div v-else-if="mediaType === 'video'"
                    class="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                    <video :src="videoUrl" controls class="w-full h-full" preload="metadata">
                        Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                </div>

                <!-- Image -->
                <div v-else-if="mediaType === 'image'" class="w-full rounded-xl overflow-hidden shadow-lg">
                    <img :src="videoUrl" :alt="formationTitle" class="w-full h-auto object-contain max-h-[600px]" />
                </div>

                <!-- PDF with carousel navigation -->
                <div v-else-if="mediaType === 'pdf'" class="w-full">
                    <ClientOnly>
                        <PdfViewer :pdfUrl="videoUrl" />
                        <template #fallback>
                            <div class="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
                                <div class="text-center">
                                    <div
                                        class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4">
                                    </div>
                                    <p class="text-gray-600">Chargement du PDF...</p>
                                </div>
                            </div>
                        </template>
                    </ClientOnly>
                </div>

                <div class="mt-10 flex items-center justify-center gap-x-6">
                    <NuxtLink href="#quizz" @click="emit('start-quiz')"
                        class="rounded-xl p-4 px-10 text-sm font-medium text-white shadow-sm border-gray-100 bg-gray-600 hover:bg-gray-700 transition">
                        Commencer le quiz
                    </NuxtLink>
                </div>
            </div>

            <!-- Pas de média -->
            <div v-else class="mt-16 flex items-center justify-center gap-x-6 mb-20">
                <NuxtLink href="#quizz" @click="emit('start-quiz')"
                    class="rounded-xl p-4 px-10 text-sm font-medium text-white shadow-sm border-gray-100 bg-gray-600 hover:bg-gray-700 transition">
                    Commencer le quiz
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<style scoped>
.aspect-video {
    aspect-ratio: 16 / 9;
}
</style>
