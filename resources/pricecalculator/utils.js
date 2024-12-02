// Shared utility functions
export function getFeatureDisplayName(feature) {
    const displayNames = {
        melodynePitchCorrection: 'Manual Pitch & Timing Correction',
        layerAlignment: 'Layer Alignment',
        artificialHarmonies: 'Artificial Harmonies',
        instrumentalEnhancement: 'Instrumental Enhancement',
        audioRestoration: 'Audio Restoration',
        realTimeSession: 'Real-Time Studio Session'
    };
    return displayNames[feature] || feature;
} 