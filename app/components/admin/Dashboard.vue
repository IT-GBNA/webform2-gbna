<script>
definePageMeta({
    middleware: "auth",
});

import { defineComponent, ref, computed } from 'vue';
import institutionsData from '../../public/etab.json';
import servicesData from '../../public/services.json';
import QuestionManager from './QuestionManager.vue';
import FormationManager from './FormationManager.vue';
import ParticipantSearch from './ParticipantSearch.vue';
import ParticipantTracking from './ParticipantTracking.vue';
import UserManager from './UserManager.vue';
import LogViewer from './LogViewer.vue';
import ExportManager from './ExportManager.vue';
import MediaManager from './MediaManager.vue';
import { useAuth } from '~/composables/useAuth';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    UserGroupIcon,
    AcademicCapIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    PhotoIcon,
    ChartBarIcon,
    ArrowLeftStartOnRectangleIcon
} from '@heroicons/vue/24/outline';

export default defineComponent({
    components: {
        QuestionManager,
        FormationManager,
        ParticipantSearch,
        ParticipantTracking,
        UserManager,
        LogViewer,
        ExportManager,
        MediaManager,
        // Icons
        ChevronDownIcon,
        ChevronUpIcon,
        UserGroupIcon,
        AcademicCapIcon,
        Cog6ToothIcon,
        DocumentTextIcon,
        ArrowDownTrayIcon,
        PhotoIcon,
        ChartBarIcon,
        ArrowLeftStartOnRectangleIcon
    },
    data() {
        return {
            activeTab: 'tracking',
            questionModuleId: '',
            autoOpenQuestionForm: false,
            modulesUpdateCount: 0,
            // Tracking data
            institutions: institutionsData,
            selectedInstitution: '',
            services: servicesData,
            selectedService: '',
            formations: [], // Store available formations
            selectedFormation: '', // Store selected formation ID
            latestScore: null,
            count: 0,
            allUsers: [], // Store all users
        };
    },
    computed: {
        filteredUsers() {
            return this.allUsers.filter(user => {
                const matchInstitution = this.selectedInstitution ? user.institution === this.selectedInstitution : true;
                const matchService = this.selectedService ? user.service === this.selectedService : true;
                const matchFormation = this.selectedFormation ? user.moduleId === this.selectedFormation : true;
                return matchInstitution && matchService && matchFormation;
            });
        }
    },
    async mounted() {
        await this.fetchFormations();
        await this.fetchScoresData();
        if (!this.user) {
            await this.fetchUser();
        }
    },
    setup() {
        const { data: user, signOut, fetchUser } = useAuth();

        const handleLogout = async () => {
            await signOut();
            navigateTo('/login');
        };

        // Permissions basées sur le rôle
        const canViewFormations = computed(() => {
            return user.value?.role === 'superadmin' || user.value?.role === 'admin';
        });

        const canViewUsers = computed(() => {
            return user.value?.role === 'superadmin';
        });

        const canViewLogs = computed(() => {
            return user.value?.role === 'superadmin' || user.value?.role === 'admin';
        });

        // Menu state - Open by default
        const openMenus = ref({
            tracking: true,
            content: true,
            admin: true
        });

        const toggleMenu = (menu) => {
            openMenus.value[menu] = !openMenus.value[menu];
        };

        return {
            user,
            handleLogout,
            fetchUser,
            canViewFormations,
            canViewUsers,
            canViewLogs,
            openMenus,
            toggleMenu
        };
    },
    methods: {
        async fetchFormations() {
            try {
                const data = await $fetch('/api/formations');
                this.formations = data;
            } catch (error) {
                console.error('Erreur lors de la récupération des formations:', error);
            }
        },
        async fetchScoresData() {
            try {
                const data = await $fetch('/api/routes/scores');
                this.allUsers = data; // Store all data
                this.count = data.length;
                if (data.length > 0) {
                    this.latestScore = data[data.length - 1];
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    return navigateTo({
                        name: 'login',
                        query: {
                            reason: 'unauthorized'
                        }
                    });
                }
                console.error('Erreur lors de la récupération des données:', error);
            }
        },
        handleFormationCreated(moduleId) {
            this.modulesUpdateCount++;
            this.fetchFormations(); // Refresh formations list
        },
        handleFormationDeleted() {
            this.modulesUpdateCount++;
            this.fetchFormations(); // Refresh formations list
        },
        handleFormationUpdated() {
            this.modulesUpdateCount++;
            this.fetchFormations(); // Refresh formations list
        },
        jsonToCsv(json) {
            const headers = Object.keys(json[0]);
            const csvRows = [];
            csvRows.push(headers.join(','));
            for (const row of json) {
                const values = headers.map(header => JSON.stringify(row[header], (key, value) => value === null ? '' : value));
                csvRows.push(values.join(','));
            }
            return csvRows.join('\n');
        },
        async exportCSV() {
            try {
                // Export filtered users
                const dataToExport = this.filteredUsers;

                if (dataToExport.length === 0) {
                    alert("Aucune donnée à exporter.");
                    return;
                }

                const csv = this.jsonToCsv(dataToExport);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'participants_export.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Erreur lors de l\'exportation du fichier CSV :', error);
            }
        },
        async generatePDF() {
            const { default: jsPDF } = await import('jspdf');

            try {
                // Export filtered users
                const dataToExport = this.filteredUsers;

                if (dataToExport.length === 0) {
                    alert("Aucune donnée à exporter.");
                    return;
                }

                const uniqueUsersMap = {};
                dataToExport.forEach(user => {
                    const key = `${user.firstName}_${user.lastName}`;
                    if (!uniqueUsersMap[key] || user.newScore > uniqueUsersMap[key].newScore) {
                        uniqueUsersMap[key] = user;
                    }
                });

                const uniqueUsers = Object.values(uniqueUsersMap);
                const doc = new jsPDF({ orientation: 'landscape' });

                const cellWidth = 45;
                const serviceColumnWidth = 60;
                const cellHeight = 10;
                const startX = 10;
                const startY = 30;
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                const bottomMargin = 10;
                let currentY = startY;

                const titleText = 'Feuille d\'émargement de sensibilisation à la cybersécurité';
                const titleWidth = doc.getTextWidth(titleText);
                const centerX = (pageWidth - titleWidth) / 2;
                doc.setFontSize(14);
                doc.text(titleText, centerX, 20);

                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleDateString() + ' ' + currentDate.toLocaleTimeString();
                const totalParticipantsText = `Total des participants : ${uniqueUsers.length} (au ${formattedDate})`;
                doc.setFontSize(10);
                doc.text(totalParticipantsText, startX, 28);
                doc.setFontSize(8);

                const columnLabels = ['Prénom', 'Nom', 'Etablissement', 'Service', 'Score', 'Date'];
                const columnWidths = [cellWidth, cellWidth, cellWidth, serviceColumnWidth, cellWidth, cellWidth];

                doc.setFont('helvetica', 'bold');
                columnLabels.forEach((label, i) => {
                    const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    doc.text(label, xPosition + 2, currentY + 8);
                    doc.rect(xPosition, currentY, columnWidths[i], cellHeight, 'S');
                });

                currentY += cellHeight;

                doc.setFont('helvetica', 'normal');
                uniqueUsers.forEach((user) => {
                    if (currentY + cellHeight + bottomMargin > pageHeight) {
                        doc.addPage();
                        currentY = startY;
                        doc.setFont('helvetica', 'bold');
                        columnLabels.forEach((label, i) => {
                            const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                            doc.text(label, xPosition + 2, currentY + 8);
                            doc.rect(xPosition, currentY, columnWidths[i], cellHeight, 'S');
                        });
                        currentY += cellHeight;
                        doc.setFont('helvetica', 'normal');
                    }

                    const userData = [
                        user.firstName,
                        user.lastName,
                        user.institution,
                        user.service,
                        user.newScore + '/' + (user.totalQuestions || 16),
                        this.formattedDate(user.createdAt)
                    ];

                    userData.forEach((data, i) => {
                        const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        doc.text(data, xPosition + 2, currentY + 8);
                        doc.rect(xPosition, currentY, columnWidths[i], cellHeight, 'S');
                    });
                    currentY += cellHeight;
                });

                doc.save('Participants_export.pdf');
            } catch (error) {
                console.error('Erreur lors de la génération du PDF:', error);
            }
        },
        formattedDate(dateString) {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        },
    },
});

</script>

<template>
    <div class="flex flex-col lg:flex-row min-h-screen">
        <!-- Sidebar Navigation (Fixed) -->
        <div class="w-full lg:w-64 lg:fixed lg:top-0 lg:left-0 lg:h-screen bg-zinc-800 border-r border-zinc-700 
            flex flex-col p-2 shrink-0 z-50">
            <div class="p-4 border-b border-white/10 flex justify-center items-center mt-4 mb-4">
                <a href="/" class="transition-transform hover:scale-105 duration-200">
                    <img src="../../img/gbnasante-w.png" class="w-16 h-16 object-contain transition-all duration-200">
                </a>
            </div>

            <!-- Scrollable Navigation -->
            <nav class="flex-1 overflow-y-auto space-y-4 custom-scrollbar">

                <!-- Tracking Group -->
                <div class="bg-zinc-900/50 rounded-xl border border-zinc-700/50 overflow-hidden">
                    <button @click="toggleMenu('tracking')"
                        class="w-full px-3 py-2 flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition-colors text-left">
                        <span class="text-xs font-medium text-zinc-500  tracking-wider">Suivi</span>
                        <component :is="openMenus.tracking ? 'ChevronUpIcon' : 'ChevronDownIcon'"
                            class="w-3 h-3 text-zinc-500" />
                    </button>

                    <div v-show="openMenus.tracking" class="p-1 space-y-1">
                        <button @click="activeTab = 'tracking'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'tracking'
                                ? 'bg-purple-600/10 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <UserGroupIcon class="w-4 h-4" />
                            Participants
                        </button>
                    </div>
                </div>

                <!-- Content Group -->
                <div v-if="canViewFormations"
                    class="bg-zinc-900/50 rounded-xl border border-zinc-700/50 overflow-hidden">
                    <button @click="toggleMenu('content')"
                        class="w-full px-3 py-2 flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition-colors text-left">
                        <span class="text-xs font-medium text-zinc-500  tracking-wider">Contenu</span>
                        <component :is="openMenus.content ? 'ChevronUpIcon' : 'ChevronDownIcon'"
                            class="w-3 h-3 text-zinc-500" />
                    </button>

                    <div v-show="openMenus.content" class="p-1 space-y-1">
                        <button @click="activeTab = 'formations'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'formations'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <AcademicCapIcon class="w-4 h-4" />
                            Formations
                        </button>

                        <button @click="activeTab = 'media'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'media'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <PhotoIcon class="w-4 h-4" />
                            Médias
                        </button>
                    </div>
                </div>

                <!-- Admin Group -->
                <div v-if="canViewUsers || canViewLogs"
                    class="bg-zinc-900/50 rounded-xl border border-zinc-700/50 overflow-hidden">
                    <button @click="toggleMenu('admin')"
                        class="w-full px-3 py-2 flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 transition-colors text-left">
                        <span class="text-xs font-medium text-zinc-500 tracking-wider">Administration</span>
                        <component :is="openMenus.admin ? 'ChevronUpIcon' : 'ChevronDownIcon'"
                            class="w-3 h-3 text-zinc-500" />
                    </button>

                    <div v-show="openMenus.admin" class="p-1 space-y-1">
                        <button v-if="canViewUsers" @click="activeTab = 'users'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'users'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <Cog6ToothIcon class="w-4 h-4" />
                            Utilisateurs
                        </button>

                        <button v-if="canViewLogs" @click="activeTab = 'logs'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'logs'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <DocumentTextIcon class="w-4 h-4" />
                            Logs
                        </button>

                        <button v-if="canViewFormations" @click="activeTab = 'exports'" :class="[
                            'w-full flex items-center gap-3 text-left text-sm p-2 rounded-lg transition-all duration-200',
                            activeTab === 'exports'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        ]">
                            <ArrowDownTrayIcon class="w-4 h-4" />
                            Exports
                        </button>
                    </div>
                </div>
            </nav>

            <!-- User Info & Logout -->
            <div class="mt-auto pt-4 border-t border-zinc-700">
                <div v-if="user"
                    class="flex items-center gap-3 mb-3 px-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-700/50">
                    <div
                        class="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-purple-900/20">
                        {{ user.username?.charAt(0).toUpperCase() || 'A' }}
                    </div>
                    <div class="flex flex-col overflow-hidden">
                        <span class="text-sm font-semibold text-gray-200 truncate">{{ user.username }}</span>
                        <span class="text-[10px]" :class="{
                            'text-amber-400': user.role === 'superadmin',
                            'text-purple-400': user.role === 'admin',
                            'text-green-400': user.role === 'export'
                        }">{{ user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Export'
                            }}</span>
                    </div>
                </div>

                <button @click="handleLogout"
                    class="cursor-pointer flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-lg transition-all duration-200 group">
                    <ArrowLeftStartOnRectangleIcon class="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    Déconnexion
                </button>
            </div>
        </div>

        <!-- Main Content Area (with left margin to account for fixed sidebar) -->
        <div class="flex-1 p-4 lg:p-6 lg:ml-64 overflow-y-auto bg-zinc-900 min-h-screen">
            <!-- Content -->
            <div class="mx-2">
                <!-- Tracking & Search Tab -->
                <div v-if="activeTab === 'tracking'" class="flex flex-col gap-4 animate-fade-in">
                    <h3 class="text-lg font-bold text-white mb-1">Suivi des Participants</h3>

                    <!-- Search & Filter Component (Top Bar) -->
                    <ParticipantSearch class="w-full" :institutions="institutions" :services="services"
                        :formations="formations" :selectedInstitution="selectedInstitution"
                        :selectedService="selectedService" :selectedFormation="selectedFormation" :users="filteredUsers"
                        @update:selectedInstitution="selectedInstitution = $event"
                        @update:selectedService="selectedService = $event"
                        @update:selectedFormation="selectedFormation = $event" />

                    <!-- Real-time Tracking Component -->
                    <ParticipantTracking class="w-full" :count="count" :latestScore="latestScore" :users="filteredUsers"
                        :selectedInstitution="selectedInstitution" :selectedService="selectedService"
                        :selectedFormation="selectedFormation" @export-csv="exportCSV" @export-pdf="generatePDF"
                        @refresh="fetchScoresData" />
                </div>

                <!-- Formations Tab -->
                <div v-if="activeTab === 'formations'" class="flex flex-col gap-4 animate-fade-in">
                    <h3 class="text-lg font-bold text-white mb-1">Gestion des Formations</h3>
                    <FormationManager @formationCreated="handleFormationCreated"
                        @formationUpdated="handleFormationUpdated" @formationDeleted="handleFormationDeleted" />
                </div>

                <!-- Users Tab -->
                <div v-if="activeTab === 'users'" class="flex flex-col gap-4 animate-fade-in">
                    <UserManager />
                </div>

                <!-- Logs Tab -->
                <div v-if="activeTab === 'logs'" class="flex flex-col gap-4 animate-fade-in">
                    <LogViewer />
                </div>

                <!-- Exports Tab -->
                <div v-if="activeTab === 'exports'" class="flex flex-col gap-4 animate-fade-in">
                    <ExportManager />
                </div>

                <!-- Media Tab -->
                <div v-if="activeTab === 'media'" class="flex flex-col gap-4 animate-fade-in">
                    <MediaManager />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.count {
    font-size: 2.5rem;
    font-weight: bold;
}

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
