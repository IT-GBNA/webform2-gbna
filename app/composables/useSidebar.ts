import { ref, computed } from 'vue';

export const useSidebar = () => {
    const sidebarWidth = computed(() => '20rem'); // 320px
    const contentMargin = computed(() => 'pl-80');

    return {
        sidebarWidth,
        contentMargin
    };
};
