<script setup>
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';

const props = defineProps({
    pdfUrl: {
        type: String,
        required: true
    }
});

const canvasRef = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const loading = ref(true);
const error = ref('');
const pdfDoc = shallowRef(null);  // shallowRef to avoid breaking PDF.js internals
const scale = ref(1.5);
const pdfjsLib = shallowRef(null);  // shallowRef for PDF.js library
const rendering = ref(false);

// Load PDF.js only on client side
const initPdfJs = async () => {
    if (typeof window === 'undefined') return false;

    try {
        const pdfjs = await import('pdfjs-dist');
        // Use local worker file (v3.11)
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        pdfjsLib.value = pdfjs;
        console.log('PDF.js chargé avec succès');
        return true;
    } catch (err) {
        console.error('Erreur lors du chargement de PDF.js:', err);
        error.value = 'Impossible de charger le viewer PDF';
        loading.value = false;
        return false;
    }
};

// Load PDF
const loadPdf = async () => {
    if (!props.pdfUrl || !pdfjsLib.value) return;

    loading.value = true;
    error.value = '';

    try {
        console.log('Chargement du PDF:', props.pdfUrl);
        const loadingTask = pdfjsLib.value.getDocument(props.pdfUrl);
        pdfDoc.value = await loadingTask.promise;
        totalPages.value = pdfDoc.value.numPages;
        currentPage.value = 1;
        console.log('PDF chargé:', totalPages.value, 'pages');

        // First hide loading so canvas becomes visible
        loading.value = false;

        // Wait for DOM to update and canvas to be mounted
        await nextTick();

        // Small delay to ensure canvas is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now render the first page
        await renderPage(1);
    } catch (err) {
        console.error('Erreur lors du chargement du PDF:', err);
        error.value = 'Impossible de charger le PDF';
        loading.value = false;
    }
};

// Render a specific page
const renderPage = async (pageNum) => {
    if (!pdfDoc.value || !canvasRef.value || rendering.value) return;

    rendering.value = true;

    try {
        const page = await pdfDoc.value.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale.value });

        const canvas = canvasRef.value;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
    } catch (err) {
        console.error('Erreur lors du rendu de la page:', err);
    } finally {
        rendering.value = false;
    }
};

// Navigation
const prevPage = async () => {
    if (currentPage.value > 1 && !rendering.value) {
        currentPage.value--;
        await renderPage(currentPage.value);
    }
};

const nextPage = async () => {
    if (currentPage.value < totalPages.value && !rendering.value) {
        currentPage.value++;
        await renderPage(currentPage.value);
    }
};

const goToPage = async (page) => {
    if (page >= 1 && page <= totalPages.value && !rendering.value) {
        currentPage.value = page;
        await renderPage(page);
    }
};

// Keyboard navigation
const handleKeydown = (e) => {
    if (e.key === 'ArrowLeft') prevPage();
    else if (e.key === 'ArrowRight') nextPage();
};

// Computed
const isFirstPage = computed(() => currentPage.value === 1);
const isLastPage = computed(() => currentPage.value === totalPages.value);
const progress = computed(() => totalPages.value > 0 ? (currentPage.value / totalPages.value) * 100 : 0);
const fileName = computed(() => props.pdfUrl ? props.pdfUrl.split('/').pop() || 'Document' : 'Document');

// Lifecycle
onMounted(async () => {
    const initialized = await initPdfJs();
    if (initialized) await loadPdf();
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});

watch(() => props.pdfUrl, async () => {
    if (pdfjsLib.value) await loadPdf();
});
</script>

<template>
    <div class="pdf-viewer">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Chargement du PDF...</p>
            </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex items-center justify-center h-96 bg-red-50 rounded-xl">
            <div class="text-center">
                <p class="text-red-600 mb-4">{{ error }}</p>
                <a :href="pdfUrl" target="_blank"
                    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Ouvrir le PDF
                </a>
            </div>
        </div>

        <!-- PDF Display -->
        <div v-else class="relative">

            <!-- Progress bar -->


            <!-- Canvas with arrows -->
            <div class="relative bg-gray-200">
                <!-- Left arrow -->
                <button @click="prevPage" :disabled="isFirstPage || rendering"
                    class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/95 hover:bg-white rounded-full shadow-xl flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer">
                    <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <!-- Canvas -->
                <div class="flex justify-center py-6 px-16 overflow-auto" style="max-height: 70vh;">
                    <canvas ref="canvasRef" class="shadow-2xl rounded" :class="{ 'opacity-50': rendering }"></canvas>
                </div>

                <!-- Right arrow -->
                <button @click="nextPage" :disabled="isLastPage || rendering"
                    class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/95 hover:bg-white rounded-full shadow-xl flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer">
                    <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                <div class="h-1 bg-gray-300">
                    <div class="h-1 bg-gradient-to-r from-green-500 to-green-400 transition-all"
                        :style="{ width: `${progress}%` }"></div>
                </div>
                <!-- Loading overlay -->
                <div v-if="rendering" class="absolute inset-0 flex items-center justify-center bg-white/30 z-10">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            </div>

            <!-- Page dots -->
            <div class="bg-gray-100 py-4 rounded-b-xl">
                <div class="flex items-center justify-center gap-2">
                    <template v-if="totalPages <= 15">
                        <button v-for="page in totalPages" :key="page" @click="goToPage(page)"
                            class="w-3 h-3 rounded-full transition-all cursor-pointer"
                            :class="page === currentPage ? 'bg-green-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'">
                        </button>
                    </template>
                    <template v-else>
                        <button @click="prevPage" :disabled="isFirstPage"
                            class="p-2 bg-white rounded-lg shadow disabled:opacity-30 cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span class="px-4 py-2 bg-white rounded-lg shadow font-medium">{{ currentPage }} / {{ totalPages
                        }}</span>
                        <button @click="nextPage" :disabled="isLastPage"
                            class="p-2 bg-white rounded-lg shadow disabled:opacity-30 cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </template>
                </div>
                <p class="text-center text-gray-500 text-xs mt-3">⌨️ Utilisez les flèches ← → pour naviguer</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pdf-viewer canvas {
    max-width: 100%;
    height: auto;
}
</style>
