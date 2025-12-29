<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    modelValue: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
    const option = props.options.find(o => o.value === props.modelValue);
    return option ? option.label : props.placeholder || 'Sélectionner...';
});

const toggle = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
};

const select = (value: string) => {
    emit('update:modelValue', value);
    isOpen.value = false;
};

// Close on click outside
const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div ref="dropdownRef" class="relative">
        <!-- Trigger Button -->
        <button @click="toggle" type="button" :disabled="disabled" :class="[
            'flex items-center gap-2 text-sm py-1 px-2 rounded-md transition-all focus:outline-none',
            disabled
                ? 'text-zinc-600 cursor-not-allowed opacity-50'
                : 'text-zinc-300 hover:bg-zinc-700/50 hover:text-white cursor-pointer'
        ]">
            <span :class="modelValue && !disabled ? 'text-white' : 'text-zinc-400'">{{ selectedLabel }}</span>
            <svg class="h-4 w-4 text-zinc-500 transition-transform duration-200"
                :class="{ 'rotate-180': isOpen && !disabled }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <!-- Dropdown Menu -->
        <Transition enter-active-class="transition ease-out duration-100" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="isOpen"
                class="absolute top-full left-0 mt-1 min-w-[200px] max-h-[300px] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                <!-- Options -->
                <div class="py-1">
                    <button v-for="option in options" :key="option.value" @click="select(option.value)" type="button"
                        :class="[
                            'w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer',
                            option.value === modelValue
                                ? 'bg-purple-600 text-white'
                                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        ]">
                        <div class="flex items-center justify-between">
                            <span>{{ option.label }}</span>
                            <svg v-if="option.value === modelValue" class="h-4 w-4" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* Custom scrollbar */
div::-webkit-scrollbar {
    width: 6px;
}

div::-webkit-scrollbar-track {
    background: #18181b;
}

div::-webkit-scrollbar-thumb {
    background: #52525b;
    border-radius: 3px;
}

div::-webkit-scrollbar-thumb:hover {
    background: #71717a;
}
</style>
