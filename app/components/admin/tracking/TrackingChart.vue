<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    users: any[];
}>();

// --- Chart Data ---
// Show a trend line of participants over the last 14 days
const chartData = computed(() => {
    if (!props.users) return [];

    const days = 14;
    const dataPoints = new Array(days).fill(0);
    const now = new Date();

    // Group by day
    props.users.forEach(user => {
        const date = new Date(user.createdAt);
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= days) {
            dataPoints[days - diffDays]++;
        }
    });

    return dataPoints;
});

// Max value for Y-axis scaling
const maxValue = computed(() => {
    const data = chartData.value;
    if (data.length === 0) return 10;
    const max = Math.max(...data);
    // Round up to nearest nice number
    return Math.ceil(max / 5) * 5 || 5;
});

// Y-axis labels
const yAxisLabels = computed(() => {
    const max = maxValue.value;
    return [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];
});

// X-axis date labels (7 labels for readability)
const xAxisLabels = computed(() => {
    const labels = [];
    const now = new Date();
    const positions = [0, 2, 4, 6, 8, 10, 13]; // 7 positions

    for (const pos of positions) {
        const d = new Date();
        d.setDate(now.getDate() - (13 - pos));
        labels.push({
            position: (pos / 13) * 100,
            label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        });
    }
    return labels;
});

// Generate smooth SVG path using bezier curves
const svgPath = computed(() => {
    const data = chartData.value;
    if (data.length === 0) return '';

    const width = 100;
    const height = 100;
    const max = maxValue.value;
    const stepX = width / (data.length - 1);

    // Build points
    const points = data.map((val, index) => ({
        x: index * stepX,
        y: height - (val / max) * height
    }));

    if (points.length < 2) return '';

    // Build smooth curve path
    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;

        path += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
    }

    return path;
});

// Fill area path
const svgFillPath = computed(() => {
    const path = svgPath.value;
    if (!path) return '';
    return `${path} L 100,100 L 0,100 Z`;
});

// Total participants in period
const totalInPeriod = computed(() => {
    return chartData.value.reduce((sum, val) => sum + val, 0);
});
</script>

<template>
    <div class="bg-zinc-900 rounded-xl border border-zinc-600 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-800">
            <div class="flex items-center gap-3">
                <h3 class="text-white font-medium">Activité des Participants</h3>
                <span class="text-zinc-500 text-sm">14 derniers jours</span>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="text-zinc-400 text-sm">Inscriptions</span>
                </div>
            </div>
        </div>

        <!-- Chart Area -->
        <div class="p-4">
            <div class="flex">
                <!-- Y-Axis Labels -->
                <div class="flex flex-col justify-between pr-3 text-right" style="height: 200px;">
                    <span v-for="label in yAxisLabels" :key="label" class="text-xs text-zinc-500">
                        {{ label }}
                    </span>
                </div>

                <!-- Chart Container -->
                <div class="flex-1 relative" style="height: 200px;">
                    <!-- Grid Lines -->
                    <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div v-for="i in 5" :key="i" class="border-t border-zinc-800/50 w-full"></div>
                    </div>

                    <!-- SVG Chart -->
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                        <!-- Gradient -->
                        <defs>
                            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stop-color="#10B981" stop-opacity="0.3" />
                                <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
                            </linearGradient>
                        </defs>

                        <!-- Fill Area -->
                        <path :d="svgFillPath" fill="url(#areaGradient)" />

                        <!-- Line -->
                        <path :d="svgPath" fill="none" stroke="#10B981" stroke-width="2"
                            vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    <!-- Data Points -->
                    <div class="absolute inset-0 pointer-events-none">
                        <div v-for="(val, index) in chartData" :key="index"
                            class="absolute w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-900 transform -translate-x-1/2 -translate-y-1/2"
                            :style="{
                                left: (index / (chartData.length - 1)) * 100 + '%',
                                top: (1 - val / maxValue) * 100 + '%'
                            }">
                        </div>
                    </div>
                </div>
            </div>

            <!-- X-Axis Labels -->
            <div class="flex justify-between mt-2 pl-8">
                <span v-for="item in xAxisLabels" :key="item.label" class="text-xs text-zinc-500">
                    {{ item.label }}
                </span>
            </div>
        </div>

        <!-- Footer Stats -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <div class="flex items-center gap-2">
                <span class="text-zinc-500 text-xs">Total sur la période:</span>
                <span class="text-white text-xs">{{ totalInPeriod }} participants</span>
            </div>
        </div>
    </div>
</template>
