export interface ModuleConfig {
    id: string;
    displayName: string;
    description: string;
    collectionName: string;
    duration: string;
    route: string;
    order: number;
    videoUrl?: string;
}

export const AVAILABLE_MODULES: ModuleConfig[] = [
{
        id: 'form_1',
        displayName: 'Sensibilisation à la cybersécurité',
        description: 'Découvrez le 1er parcours sur la cybersécurité proposé par GBNA Santé. Vous y trouverez 2 modules de fond pour comprendre l\'importance de la cybersécurité dans le domaine de la santé.',
        collectionName: 'form_1',
        duration: '10 minutes',
        route: '/formation/form_1',
        order: 1
    },
    {
        id: 'form_3',
        displayName: 'Sensibilisation au clé USB',
        description: 'Test ',
        collectionName: 'USB',
        duration: '5 minutes',
        route: '/formation/form_3',
        order: 2
    },,
    {
        id: 'form_4',
        displayName: 'Test',
        description: 'Test pour la création de formation ',
        collectionName: 'form_4',
        duration: '10 minutes',
        route: '/formation/form_4',
        order: 1
    }
];

export const DEFAULT_MODULE = 'form_1';

export function isValidModule(moduleId: string): boolean {
    return AVAILABLE_MODULES.some(module => module.id === moduleId);
}

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
    return AVAILABLE_MODULES.find(module => module.id === moduleId);
}

export function getCollectionName(moduleId: string): string {
    const module = getModuleConfig(moduleId);
    return module ? module.collectionName : DEFAULT_MODULE;
}
