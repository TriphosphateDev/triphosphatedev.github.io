export const CONFIG = {
    // Base prices for each service type
    basePrices: {
        twoTrack: 50,
        groupStem: 200,
        fullStem: 100,
        consultation: 50
    },

    // Feature prices per track/song
    featurePrices: {
        melodynePitchCorrection: 10,
        layerAlignment: 10,
        artificialHarmonies: 20,
        instrumentalEnhancement: 20,
        audioRestoration: 10,
        realTimeSession: 25
    },

    // Per-song fees
    perSongFees: {
        stemOrganization: 20
    },

    // Track configuration
    vocals: {
        additionalTrackPrice: 5
    }
};

export function calculateBasePrice(serviceType, songCount, vocalTrackCount) {
    if (!serviceType) return 0;
    
    const basePrice = CONFIG.basePrices[serviceType];
    return basePrice * songCount;
}

export function calculateExtraTrackCost(vocalTrackCount, songCount) {
    const extraTracks = Math.max(0, vocalTrackCount - 4);
    return extraTracks * 5 * songCount;
}

export function calculateFeaturePrice(selectedFeatures, songCount, trackCounts = {}) {
    if (!selectedFeatures || selectedFeatures.length === 0) return 0;
    
    return selectedFeatures.reduce((total, feature) => {
        let featurePrice = CONFIG.featurePrices[feature] || 0;
        
        if (feature === 'layerAlignment') {
            const totalTracks = parseInt(trackCounts[feature]) || 0;
            const alignedTracks = Math.max(0, totalTracks - 1);
            const alignmentCost = alignedTracks * featurePrice;
            return total + (alignmentCost * songCount);
        } else if (feature === 'melodynePitchCorrection') {
            const trackCount = parseInt(trackCounts[feature]) || 0;
            return total + (trackCount * featurePrice * songCount);
        } else if (feature === 'audioRestoration') {
            const trackCount = parseInt(trackCounts[feature]) || 0;
            return total + (trackCount * featurePrice);
        } else if (feature === 'artificialHarmonies') {
            return total + (featurePrice * songCount);
        } else if (feature === 'realTimeSession') {
            return total + (featurePrice * songCount);
        }
        
        return total + (featurePrice * songCount);
    }, 0);
}

export function validateFeatures(serviceType, selectedFeatures) {
    return true; // Simplified validation for now
}

export function validateVocalFeatures(selectedFeatures, vocalTrackCount) {
    if (selectedFeatures.includes('layerAlignment') && vocalTrackCount <= 1) {
        throw new Error('Layer alignment requires at least 2 vocal tracks');
    }
    return true;
}

export function calculateTotal(serviceType, songCount, vocalTrackCount, selectedFeatures = [], stemOrgRequired = false) {
    const basePrice = calculateBasePrice(serviceType, songCount, vocalTrackCount);
    const featurePrice = calculateFeaturePrice(selectedFeatures, songCount);
    const stemOrgFee = stemOrgRequired ? CONFIG.perSongFees.stemOrganization * songCount : 0;
    
    return basePrice + featurePrice + stemOrgFee;
}

// And update the reference in main.js
function updatePriceDisplay() {
    // ...
    // Calculate base prices
    const baseServicePrice = CONFIG.basePrices[state.selectedService];
    // ...
}

export function calculateBulkDiscount(subtotal, songCount) {
    if (songCount >= 10) {
        return subtotal * 0.20;
    } else if (songCount >= 5) {
        return subtotal * 0.10;
    }
    return 0;
}

export function generateQuoteSummary(state) {
    if (!state.selectedService) return null;

    // Calculate base service details
    const baseServicePrice = CONFIG.basePrices[state.selectedService];
    const basePrice = baseServicePrice * state.songCount;
    
    // Calculate extra tracks
    const extraTrackCount = Math.max(0, state.vocalTrackCount - 4);
    const extraTrackCost = extraTrackCount * CONFIG.vocals.additionalTrackPrice;
    const extraTrackTotal = extraTrackCost * state.songCount;

    // Calculate feature prices
    const features = state.selectedFeatures.map(feature => {
        let price = 0;
        let details = '';

        switch (feature) {
            case 'melodynePitchCorrection':
                price = state.featureTrackCounts[feature] * CONFIG.featurePrices[feature] * state.songCount;
                details = `${state.featureTrackCounts[feature]} vocal tracks`;
                break;
            case 'layerAlignment':
                price = state.featureTrackCounts[feature] * CONFIG.featurePrices[feature] * state.songCount;
                details = `${state.featureTrackCounts[feature]} aligned tracks`;
                break;
            case 'artificialHarmonies':
                price = state.songCount * CONFIG.featurePrices[feature];
                details = `${state.songCount} songs with custom harmonies`;
                break;
            case 'realTimeSession':
                price = state.songCount * CONFIG.featurePrices[feature];
                details = `${state.songCount} sessions`;
                break;
            case 'audioRestoration':
                price = state.featureTrackCounts[feature] * CONFIG.featurePrices[feature];
                details = `${state.featureTrackCounts[feature]} tracks`;
                break;
            case 'instrumentalEnhancement':
                price = state.songCount * CONFIG.featurePrices[feature];
                details = `${state.songCount} songs`;
                break;
            case 'rushOrder':
                // Rush order is handled separately
                break;
        }

        return {
            name: feature,
            price: price,
            details: details,
            description: enhancementDescriptions[feature]?.desc || '',
            benefit: enhancementDescriptions[feature]?.benefit || ''
        };
    });

    // Calculate subtotal before rush fee
    const subtotal = basePrice + extraTrackTotal + features.reduce((sum, f) => sum + f.price, 0);

    // Apply rush order fee if selected
    if (state.rushOrder) {
        const rushFee = subtotal * 0.25;
        features.push({
            name: 'rushOrder',
            price: rushFee,
            details: 'Priority Processing'
        });
    }

    // Calculate bulk 
    const bulkDiscount = calculateBulkDiscount(subtotal, state.songCount);

    // Calculate stem organization fee/savings
    const stemOrgAmount = state.songCount * CONFIG.perSongFees.stemOrganization;

    return {
        baseService: {
            type: state.selectedService,
            songCount: state.songCount,
            price: basePrice,
            extraTracks: {
                count: extraTrackCount,
                pricePerTrack: CONFIG.vocals.additionalTrackPrice,
                total: extraTrackTotal
            }
        },
        features: features,
        preparation: {
            type: state.stemPrep || 'none',
            price: state.stemPrep === 'professionalPrep' ? stemOrgAmount : -stemOrgAmount
        },
        discounts: {
            bulk: bulkDiscount
        },
        total: subtotal + 
               (state.stemPrep === 'professionalPrep' ? stemOrgAmount : 0) - 
               bulkDiscount
    };
}

function getFeatureDetails(feature, state) {
    switch(feature) {
        case 'melodynePitchCorrection':
            return `${state.featureTrackCounts[feature]} vocal tracks`;
        case 'layerAlignment':
            return `${state.featureTrackCounts[feature] - 1} aligned tracks`;
        case 'realTimeSession':
            return `${state.songCount} one-hour sessions`;
        case 'audioRestoration':
            return `${state.featureTrackCounts[feature]} tracks`;
        default:
            return `${state.songCount} songs`;
    }
}

function calculateSubtotal(state) {
    const basePrice = calculateBasePrice(state.selectedService, state.songCount);
    const extraTrackCount = Math.max(0, state.vocalTrackCount - 4);
    const extraTrackCost = extraTrackCount * CONFIG.vocals.additionalTrackPrice;
    const extraTrackTotal = extraTrackCost * state.songCount;
    const features = calculateFeaturePrice(state.selectedFeatures, state.songCount, state.featureTrackCounts);
    
    return basePrice + extraTrackTotal + features;
}

// Update the enhancement descriptions
const enhancementDescriptions = {
    melodynePitchCorrection: {
        desc: 'Professional-grade pitch correction for natural-sounding results',
        benefit: 'Major-label vocal quality without the robotic effect'
    },
    artificialHarmonies: {
        desc: 'Custom harmony creation and professional vocal layering',
        benefit: 'Add depth and richness with natural-sounding harmonies and doubles'
    },
    layerAlignment: {
        desc: 'Precise timing alignment between vocal layers',
        benefit: 'Create radio-ready vocal stacks that sound cohesive and powerful'
    },
    realTimeSession: {
        desc: 'Live mix supervision via Discord with direct feedback and creative direction',
        benefit: 'Learn professional techniques while ensuring your creative vision is perfectly executed'
    },
    audioRestoration: {
        desc: 'Professional cleanup including noise reduction, de-breathing, and spectral repair',
        benefit: 'Rescue problematic recordings and achieve clean, professional results'
    },
    instrumentalEnhancement: {
        desc: 'Advanced processing for your instrumental including dynamic EQ and stereo enhancement',
        benefit: 'Give your beat the same polish heard in major releases'
    }
};