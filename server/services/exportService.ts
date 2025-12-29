import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';
import Formation, { ExportConfig } from '../models/Formation';
import { Score } from '../models/Score';
import ExportLog from '../models/ExportLog';

// Configuration SMTP via variables d'environnement
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.bordeauxnord.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '25');
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@gbna-sante.fr';

// Rate limiting: nombre max d'exports manuels par heure
const MAX_EXPORTS_PER_HOUR = 10;

interface ExportResult {
    success: boolean;
    message: string;
    recipientCount?: number;
}

interface ExportContext {
    triggeredBy: 'manual' | 'scheduler';
    userId?: string;
    username?: string;
}

interface ScoreData {
    firstName: string;
    lastName: string;
    institution: string;
    service: string;
    newScore: number;
    createdAt: Date;
}

// Fonction pour formater une date
function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// Fonction pour supprimer les doublons et garder le meilleur score
function removeDuplicatesKeepHighest(scores: ScoreData[]): ScoreData[] {
    const userMap = new Map<string, ScoreData>();

    for (const score of scores) {
        const key = `${score.firstName}-${score.lastName}-${score.institution}`;
        const existing = userMap.get(key);

        if (!existing || score.newScore > existing.newScore) {
            userMap.set(key, score);
        }
    }

    return Array.from(userMap.values());
}

// Vérifier le rate limiting pour les exports manuels
async function checkRateLimit(formationId: string): Promise<{ allowed: boolean; remaining: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentExports = await ExportLog.countDocuments({
        formationId,
        triggeredBy: 'manual',
        createdAt: { $gte: oneHourAgo }
    });

    return {
        allowed: recentExports < MAX_EXPORTS_PER_HOUR,
        remaining: Math.max(0, MAX_EXPORTS_PER_HOUR - recentExports)
    };
}

// Logger un export
async function logExport(
    formationId: string,
    formationName: string,
    recipients: string[],
    context: ExportContext,
    success: boolean,
    errorMessage?: string,
    institution?: string
): Promise<void> {
    try {
        await ExportLog.create({
            formationId,
            formationName: institution ? `${formationName} (${institution})` : formationName,
            recipientCount: recipients.length,
            recipients,
            triggeredBy: context.triggeredBy,
            userId: context.userId,
            username: context.username,
            success,
            errorMessage
        });
    } catch (err) {
        console.error('❌ Erreur lors du logging de l\'export:', err);
    }
}

// Générer le PDF avec pdf-lib
async function generatePDF(formationName: string, scores: ScoreData[], institution?: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const uniqueScores = removeDuplicatesKeepHighest(scores);
    const today = formatDate(new Date());

    // Dimensions de page A4
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Titre
    const titleBase = `Rapport de participation - ${formationName}`;
    const title = institution ? `${titleBase} (${institution})` : titleBase;
    const titleWidth = fontBold.widthOfTextAtSize(title, 14);
    page.drawText(title, {
        x: (pageWidth - titleWidth) / 2,
        y: y,
        size: 14,
        font: fontBold,
        color: rgb(0, 0, 0),
    });
    y -= 25;

    // Nombre de participants
    const participantText = `Nombre de participants: ${uniqueScores.length}`;
    const participantWidth = font.widthOfTextAtSize(participantText, 10);
    page.drawText(participantText, {
        x: (pageWidth - participantWidth) / 2,
        y: y,
        size: 10,
        font: font,
    });
    y -= 15;

    // Date d'export
    const dateText = `Exporté le ${today}`;
    const dateWidth = font.widthOfTextAtSize(dateText, 10);
    page.drawText(dateText, {
        x: (pageWidth - dateWidth) / 2,
        y: y,
        size: 10,
        font: font,
    });
    y -= 30;

    // Colonnes du tableau
    const colWidths = [80, 80, 100, 80, 50, 70];
    const headers = ['Prenom', 'Nom', 'Etablissement', 'Service', 'Score', 'Date'];
    const rowHeight = 18;
    const tableX = margin;

    // Header du tableau
    let x = tableX;

    // Fond vert pour le header
    page.drawRectangle({
        x: tableX,
        y: y - rowHeight + 3,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: rowHeight,
        color: rgb(0.137, 0.545, 0.137), // ForestGreen
    });

    headers.forEach((header, i) => {
        page.drawText(header, {
            x: x + 5,
            y: y - 10,
            size: 9,
            font: fontBold,
            color: rgb(1, 1, 1), // Blanc
        });
        x += colWidths[i];
    });
    y -= rowHeight;

    // Lignes de données
    for (const score of uniqueScores) {
        if (y < margin + 50) {
            // Nouvelle page
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
        }

        x = tableX;
        const row = [
            (score.firstName || '').substring(0, 12),
            (score.lastName || '').substring(0, 12),
            (score.institution || '').substring(0, 15),
            (score.service || '').substring(0, 12),
            `${score.newScore}/16`,
            formatDate(new Date(score.createdAt))
        ];

        row.forEach((cell, i) => {
            page.drawText(cell, {
                x: x + 5,
                y: y - 10,
                size: 8,
                font: font,
            });
            x += colWidths[i];
        });

        // Ligne de séparation
        page.drawLine({
            start: { x: tableX, y: y - rowHeight + 5 },
            end: { x: tableX + colWidths.reduce((a, b) => a + b, 0), y: y - rowHeight + 5 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });

        y -= rowHeight;
    }

    return await pdfDoc.save();
}

// Envoyer l'email avec le PDF
async function sendEmail(
    recipients: string[],
    formationName: string,
    pdfBuffer: Uint8Array,
    institution?: string
): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    const today = formatDate(new Date());
    const baseName = formationName.replace(/\s+/g, '_');
    const filename = institution
        ? `Participants_${baseName}_${institution}_${today.replace(/\//g, '-')}.pdf`
        : `Participants_${baseName}_${today.replace(/\//g, '-')}.pdf`;

    const subject = institution
        ? `Rapport de participation : ${formationName} (${institution}) - ${today}`
        : `Rapport de participation : ${formationName} - ${today}`;

    await transporter.sendMail({
        from: SMTP_FROM,
        to: recipients.join(', '),
        subject,
        text: `Veuillez trouver ci-joint le rapport de participation du ${today}.\n\nCordialement,`,
        attachments: [{
            filename,
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf'
        }]
    });
}

// Exécuter un export pour une configuration spécifique
async function runExportForConfig(
    formationId: string,
    formationName: string,
    config: ExportConfig,
    context: ExportContext
): Promise<ExportResult> {
    try {
        if (!config.enabled) {
            return { success: false, message: 'Export non activé' };
        }

        if (!config.recipients || config.recipients.length === 0) {
            return { success: false, message: 'Aucun destinataire configuré' };
        }

        // Récupérer les scores avec filtre optionnel par établissement
        const scoreFilter: any = { moduleId: formationId };
        if (config.institution) {
            scoreFilter.institution = config.institution;
        }
        const scores = await Score.find(scoreFilter).lean() as ScoreData[];

        if (scores.length === 0) {
            const errorMsg = config.institution
                ? `Aucun participant trouvé pour ${config.institution}`
                : 'Aucun participant trouvé';
            await logExport(formationId, formationName, config.recipients, context, false, errorMsg, config.institution || undefined);
            return { success: false, message: errorMsg };
        }

        // Générer le PDF
        const pdfBuffer = await generatePDF(formationName, scores, config.institution || undefined);

        // Envoyer l'email
        await sendEmail(
            config.recipients,
            formationName,
            pdfBuffer,
            config.institution || undefined
        );

        // Logger le succès
        await logExport(formationId, formationName, config.recipients, context, true, undefined, config.institution || undefined);

        return {
            success: true,
            message: config.institution
                ? `Export (${config.institution}) envoyé à ${config.recipients.length} destinataire(s)`
                : `Export envoyé à ${config.recipients.length} destinataire(s)`,
            recipientCount: config.recipients.length
        };
    } catch (error: any) {
        console.error('Erreur export config:', error);
        await logExport(formationId, formationName, config.recipients || [], context, false, error.message, config.institution || undefined);
        return { success: false, message: error.message || 'Erreur inconnue' };
    }
}

// Fonction principale d'export pour une formation (toutes les configs ou une seule)
export async function runExport(
    formationId: string,
    context: ExportContext = { triggeredBy: 'scheduler' },
    configId?: string // ID optionnel pour exécuter une seule config
): Promise<ExportResult> {
    try {
        // Récupérer la formation
        const formation = await Formation.findOne({ id: formationId });

        if (!formation) {
            return { success: false, message: 'Formation non trouvée' };
        }

        // Rate limiting pour les exports manuels
        if (context.triggeredBy === 'manual') {
            const rateLimit = await checkRateLimit(formationId);
            if (!rateLimit.allowed) {
                const errorMsg = `Limite atteinte: ${MAX_EXPORTS_PER_HOUR} exports/heure. Réessayez plus tard.`;
                return { success: false, message: errorMsg };
            }
        }

        // Utiliser les nouvelles configs si disponibles, sinon fallback sur les anciens champs
        let configs: ExportConfig[] = formation.exportConfigs || [];

        // Migration: si pas de nouvelles configs mais anciens champs actifs, les utiliser
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

        if (configs.length === 0) {
            return { success: false, message: 'Aucune configuration d\'export' };
        }

        // Si un configId est spécifié, exécuter seulement cette config
        if (configId) {
            const config = configs.find(c => c._id?.toString() === configId);
            if (!config) {
                return { success: false, message: 'Configuration d\'export non trouvée' };
            }
            return await runExportForConfig(formationId, formation.displayName, config, context);
        }

        // Sinon exécuter toutes les configs activées
        const enabledConfigs = configs.filter(c => c.enabled);
        if (enabledConfigs.length === 0) {
            return { success: false, message: 'Aucune configuration d\'export activée' };
        }

        let successCount = 0;
        let totalRecipients = 0;
        const errors: string[] = [];

        for (const config of enabledConfigs) {
            const result = await runExportForConfig(formationId, formation.displayName, config, context);
            if (result.success) {
                successCount++;
                totalRecipients += result.recipientCount || 0;
            } else {
                errors.push(result.message);
            }
        }

        if (successCount === 0) {
            return { success: false, message: errors.join('; ') };
        }

        return {
            success: true,
            message: `${successCount}/${enabledConfigs.length} export(s) envoyé(s) à ${totalRecipients} destinataire(s)`,
            recipientCount: totalRecipients
        };
    } catch (error: any) {
        console.error('Erreur export:', error);
        return { success: false, message: error.message || 'Erreur inconnue' };
    }
}

// Exécuter tous les exports actifs (pour le scheduler)
export async function runAllActiveExports(): Promise<{ total: number; success: number; failed: number }> {
    const formations = await Formation.find({
        $or: [
            { 'exportConfigs.enabled': true },
            { exportEnabled: true }
        ]
    });

    let success = 0;
    let failed = 0;

    for (const formation of formations) {
        const result = await runExport(formation.id, { triggeredBy: 'scheduler' });
        if (result.success) {
            success++;
            console.log(`✅ Export ${formation.displayName}: ${result.message}`);
        } else {
            failed++;
            console.log(`❌ Export ${formation.displayName}: ${result.message}`);
        }
    }

    return { total: formations.length, success, failed };
}
