// Global Configuration
const CONFIG = {
    // Service Base Prices
    basePrices: {
        twoTrack: 50,
        groupStem: 75,
        fullStem: 100,
        consultation: 50
    },

    // Vocal Track Limits
    vocals: {
        includedTracks: 4,        // Free tracks included in base price
        additionalTrackPrice: 5,  // Price per extra track
        maxTracks: 12            // Maximum tracks allowed
    },

    // Feature Prices
    featurePrices: {
        instrumentalEnhancement: 20,
        melodynePitchCorrection: 10,
        layerAlignment: 10,
        artificialHarmonies: 20,
        audioRestoration: 30
    },

    // Feature Track Counts
    featureTrackCounts: {
        melodynePitchCorrection: 0,
        layerAlignment: 0
    },

    // Processing Track Limits
    processing: {
        melodyne: {
            includedTracks: 4,
            additionalTrackPrice: 5
        },
        alignment: {
            includedTracks: 4,
            additionalTrackPrice: 5
        }
    },

    // Bulk Discounts
    discounts: {
        fivePlus: 0.10,          // 10% off for 5+ songs
        tenPlus: 0.20,           // 20% off for 10+ songs
        rushOrderFee: 0.25       // 25% additional for rush orders
    },

    // Per-Song Fees
    perSongFees: {
        stemOrganization: 20     // Per song, waivable
    },

    // Service Limits
    limits: {
        minSongs: 1,
        maxSongs: 20
    }
};

// Track configuration object
const TRACK_CONFIG = {
    twoTrack: {
        maxIncludedVocals: 4,
        allowedFeatures: [
            'instrumentalEnhancement',
            'melodynePitchCorrection',
            'artificialHarmonies',
            'layerAlignment',
            'audioRestoration'
        ]
    },
    groupStem: {
        maxIncludedVocals: 4,
        allowedFeatures: [
            'melodynePitchCorrection',
            'artificialHarmonies',
            'layerAlignment',
            'audioRestoration'
        ]
    },
    fullStem: {
        maxIncludedVocals: 4,
        allowedFeatures: [
            'melodynePitchCorrection',
            'artificialHarmonies',
            'layerAlignment',
            'audioRestoration'
        ]
    }
};

// Calculation functions
function calculateVocalTrackPrice(trackCount, mixdownType) {
    const config = TRACK_CONFIG[mixdownType];
    if (trackCount <= config.maxIncludedVocals) return 0;
    return (trackCount - config.maxIncludedVocals) * CONFIG.vocals.additionalTrackPrice;
}

function calculateBasePrice(mixdownType, songCount, vocalTrackCount = 0) {
    let basePrice = CONFIG.basePrices[mixdownType] * songCount;
    const vocalTrackPrice = calculateVocalTrackPrice(vocalTrackCount, mixdownType) * songCount;
    console.log('Vocal track price:', vocalTrackPrice);
    basePrice += vocalTrackPrice;
    
    // Apply bulk discounts
    if (songCount >= 10) {
        basePrice *= (1 - CONFIG.discounts.tenPlus);
    } else if (songCount >= 5) {
        basePrice *= (1 - CONFIG.discounts.fivePlus);
    }
    
    return basePrice;
}

function calculateFeaturePrice(selectedFeatures, songCount, trackCounts = {}) {
    if (!selectedFeatures || selectedFeatures.length === 0) return 0;
    
    return selectedFeatures.reduce((total, feature) => {
        let featurePrice = CONFIG.featurePrices[feature] || 0;
        
        if (feature === 'layerAlignment') {
            // Ensure we have valid numbers and handle edge cases
            const totalTracks = parseInt(trackCounts[feature]) || 0;
            // Only charge for tracks being aligned (excluding reference track)
            const alignedTracks = Math.max(0, totalTracks - 1);
            const alignmentCost = alignedTracks * featurePrice;
            console.log('Alignment calculation:', {
                totalTracks,
                alignedTracks,
                featurePrice,
                alignmentCost
            });
            return total + (alignmentCost * songCount);
        } else if (feature === 'melodynePitchCorrection') {
            const trackCount = parseInt(trackCounts[feature]) || 0;
            return total + (trackCount * featurePrice * songCount);
        }
        
        // For other features that don't use track counts
        return total + (featurePrice * songCount);
    }, 0);
}

function calculateFlatFees(selectedFlatFees) {
    return selectedFlatFees.reduce((total, fee) => {
        return total + CONFIG.perSongFees[fee];
    }, 0);
}

// Validation function
function validateFeatures(mixdownType, selectedFeatures) {
    // Filter out non-feature options like rushOrder
    const featuresToValidate = selectedFeatures.filter(feature => 
        !['rushOrder', 'basicAutotune', 'on'].includes(feature)
    );
    
    const allowedFeatures = TRACK_CONFIG[mixdownType].allowedFeatures;
    const invalidFeatures = featuresToValidate.filter(feature => 
        !allowedFeatures.includes(feature)
    );
    
    if (invalidFeatures.length > 0) {
        throw new Error(`Invalid features for ${mixdownType}: ${invalidFeatures.join(', ')}`);
    }
    
    return true;
}

// Stem organization fee calculation
function calculateStemOrgFee(songCount, stemOrgRequired = true) {
    return stemOrgRequired ? CONFIG.perSongFees.stemOrganization * songCount : 0;
}

// Main calculation function
function calculateTotal(mixdownType, songCount, vocalTrackCount = 0, selectedFeatures = [], selectedFlatFees = [], isRushOrder = false, stemOrgRequired = true, trackCounts = {}) {
    console.log('Calculating with track counts:', trackCounts);
    
    if (!validateTrackCounts(trackCounts)) {
        console.error('Invalid track counts:', trackCounts);
        return 0;
    }

    const basePrice = calculateBasePrice(mixdownType, songCount, vocalTrackCount);
    const featurePrice = calculateFeaturePrice(selectedFeatures, songCount, trackCounts);
    const flatFees = calculateFlatFees(selectedFlatFees);
    const stemOrgFee = calculateStemOrgFee(songCount, stemOrgRequired);
    
    console.log({
        basePrice,
        featurePrice,
        flatFees,
        stemOrgFee,
        trackCounts
    });

    let total = basePrice + featurePrice + flatFees + stemOrgFee;
    
    if (isRushOrder) {
        total *= (1 + CONFIG.discounts.rushOrderFee);
    }
    
    return total;
}

// Add validation for autotune + melodyne
function validateVocalFeatures(selectedFeatures, vocalTrackCount) {
    // Validate layer alignment
    if (selectedFeatures.includes('layerAlignment') && vocalTrackCount <= 1) {
        throw new Error('Layer alignment requires at least 2 vocal tracks');
    }
    
    // Validate melodyne pricing tiers
    if (selectedFeatures.includes('melodynePitchCorrection')) {
        const includedTracks = CONFIG.processing.melodyne.includedTracks;
        if (vocalTrackCount > includedTracks) {
            // Additional track pricing handled in calculateFeaturePrice
        }
    }
    
    return true;
}

// Add validation function for track counts
function validateTrackCounts(trackCounts) {
    return Object.entries(trackCounts).every(([feature, count]) => {
        return Number.isInteger(count) && count >= 0;
    });
}

// Export functions for use
export {
    CONFIG,
    TRACK_CONFIG,
    calculateTotal,
    calculateBasePrice,
    calculateFeaturePrice,
    calculateVocalTrackPrice,
    validateFeatures,
    validateVocalFeatures,
    calculateStemOrgFee
}; 