// Scheduler d'export automatique
// Vérifie chaque formation et ses configurations d'export individuellement

import { runExport } from '../services/exportService';
import Formation, { ExportConfig } from '../models/Formation';
import ExportLog from '../models/ExportLog';

// Variables d'environnement
const DISABLE_SCHEDULER = process.env.DISABLE_EXPORT_SCHEDULER === 'true';

// Tracking des exports en cours ou effectués localement (pour éviter double appel local)
const localLocks = new Set<string>();

async function checkAndRunExports() {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentHour = now.getHours(); // 0-23
    const currentMinute = now.getMinutes(); // 0-59
    const todayKey = `${now.toISOString().split('T')[0]}-${currentHour}-${currentMinute}`;

    try {
        // Récupérer toutes les formations avec des configs d'export
        const formations = await Formation.find({
            $or: [
                { 'exportConfigs.enabled': true },
                { exportEnabled: true } // Legacy
            ]
        });

        for (const formation of formations) {
            // Utiliser les nouvelles configs si disponibles
            let configs: ExportConfig[] = formation.exportConfigs || [];

            // Migration: si pas de nouvelles configs mais anciens champs actifs
            if (configs.length === 0 && formation.exportEnabled && formation.exportRecipients?.length) {
                configs = [{
                    enabled: formation.exportEnabled,
                    recipients: formation.exportRecipients,
                    apiKey: formation.exportApiKey,
                    day: formation.exportDay || 1,
                    hour: formation.exportHour || 8,
                    minute: formation.exportMinute || 0,
                    institution: formation.exportInstitution || undefined
                }];
            }

            // Vérifier chaque configuration
            for (let i = 0; i < configs.length; i++) {
                const config = configs[i];

                if (!config.enabled) continue;

                const configDay = config.day ?? 1;
                const configHour = config.hour ?? 8;
                const configMinute = config.minute ?? 0;

                // Vérifier si c'est le bon moment
                if (currentDay === configDay &&
                    currentHour === configHour &&
                    currentMinute === configMinute) {

                    // Clé unique pour cette config à cette minute
                    const configId = config._id?.toString() || `legacy-${i}`;
                    const exportKey = `${formation.id}-${configId}-${todayKey}`;
                    const label = config.institution || 'tous';
                    const expectedFormationName = config.institution ? `${formation.displayName} (${config.institution})` : formation.displayName;

                    // 1. Vérification locale (Lock)
                    if (localLocks.has(exportKey)) {
                        continue;
                    }

                    // Poser le lock local immédiatement
                    localLocks.add(exportKey);

                    // Nettoyer les vieux locks après 2 minutes
                    setTimeout(() => localLocks.delete(exportKey), 120000);

                    // 2. Vérification en base de données (pour éviter doublons multi-instances)
                    // On cherche un log de succès pour cette formation/config créé dans les 5 dernières minutes
                    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                    const existingLog = await ExportLog.findOne({
                        formationId: formation.id,
                        formationName: expectedFormationName, // C'est ici qu'on distingue les configs par institution
                        triggeredBy: 'scheduler',
                        success: true,
                        createdAt: { $gte: fiveMinutesAgo }
                    });

                    if (existingLog) {
                        console.log(`⏭️ Export déjà effectué en base: ${expectedFormationName}`);
                        continue;
                    }

                    console.log(`🔄 Export automatique: ${expectedFormationName} - ${configHour}:${configMinute.toString().padStart(2, '0')}`);

                    // Lancer l'export
                    // Note: runExport va créer le log en base, ce qui bloquera les autres instances
                    const result = await runExport(formation.id, { triggeredBy: 'scheduler' }, configId);

                    if (result.success) {
                        console.log(`✅ ${expectedFormationName}: ${result.message}`);
                    } else {
                        console.log(`❌ ${expectedFormationName}: ${result.message}`);
                        // Si échec, on pourrait vouloir retirer le lock local pour réessayer ? 
                        // Non, mieux vaut ne pas spammer en cas d'erreur persistante.
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des exports:', error);
    }
}

export default defineNitroPlugin((nitroApp) => {
    if (DISABLE_SCHEDULER) {
        console.log('⚠️ Scheduler d\'export désactivé');
        return;
    }

    console.log('📅 Scheduler d\'export automatique activé (vérifie chaque minute)');

    // Vérifier chaque minute pour une précision à la minute près
    // On ajoute un délai aléatoire de 0-10s pour désynchroniser les instances en cluster
    const randomDelay = Math.floor(Math.random() * 10000);

    setTimeout(() => {
        setInterval(checkAndRunExports, 60 * 1000);
        checkAndRunExports(); // Premier check
    }, randomDelay);
});
