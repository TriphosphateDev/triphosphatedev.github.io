import { CONFIG } from './calculator.js';
import { getFeatureDisplayName } from './utils.js';

// Add service descriptions
const serviceDescriptions = {
    twoTrack: 'Perfect for finished instrumentals or beats with vocals. Professional-grade mixing that brings clarity, punch, and radio-ready polish to your tracks.',
    groupStem: 'Ideal for bands and multi-track productions. Advanced routing and individual group processing for maximum control and pristine sound quality.',
    fullStem: 'Maximum control and precision. Individual tracks for each instrument and element with detailed processing per instrument.'
};

// Add enhancement descriptions at the top of print.js
const enhancementDescriptions = {
    melodynePitchCorrection: {
        desc: 'Professional-grade pitch correction for natural-sounding results',
        benefit: 'Major-label vocal quality without the robotic effect'
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
    },
    artificialHarmonies: {
        desc: 'Custom harmony creation and professional vocal layering',
        benefit: 'Add depth and richness with natural-sounding harmonies and doubles'
    }
};

// Print-related helper functions
export function generateIncludedFeaturesList(serviceType) {
    const features = serviceType === 'twoTrack' ? [
        {
            name: 'Professional EQ & Compression',
            desc: 'Industry-standard processing for clarity and punch'
        },
        {
            name: 'Spatial Effects & Stereo Enhancement',
            desc: 'Professional depth and width in your mix'
        },
        {
            name: 'Basic Autotune',
            desc: 'Natural-sounding pitch correction included'
        },
        {
            name: 'Up to 4 Vocal Tracks',
            desc: 'Perfect for main vocals and harmonies'
        },
        {
            name: 'Unlimited Minor Revisions',
            desc: 'We refine until you\'re completely satisfied'
        }
    ] : [
        {
            name: 'Individual Group Processing',
            desc: 'Separate processing chains for each instrument group'
        },
        {
            name: 'Advanced Routing & Effects',
            desc: 'Complex signal paths for maximum control'
        },
        {
            name: 'Professional Mix Architecture',
            desc: 'Industry-standard mixing techniques'
        },
        {
            name: 'Up to 4 Vocal Tracks',
            desc: 'Professional vocal processing included'
        },
        {
            name: 'Unlimited Minor Revisions',
            desc: 'Fine-tune until perfect'
        }
    ];

    return features.map(feature => `
        <li>
            <strong>${feature.name}</strong>
            <span class="feature-desc">${feature.desc}</span>
        </li>
    `).join('');
}

export function generateEnhancementsList(features) {
    return features.map(feature => {
        const description = enhancementDescriptions[feature.name] || {};
        let priceText;
        
        // Format price text based on feature type
        if (feature.name === 'layerAlignment') {
            const totalTracks = parseInt(feature.details);
            const alignedTracks = totalTracks - 1;
            const alignmentPrice = alignedTracks * CONFIG.featurePrices[feature.name] * feature.songCount;
            priceText = `$${alignmentPrice.toFixed(2)} (${alignedTracks} aligned tracks × ${feature.songCount} songs)`;
            feature.details = `1 reference + ${alignedTracks} aligned tracks`;
        } else if (feature.name === 'melodynePitchCorrection') {
            priceText = `$${feature.price.toFixed(2)} (${feature.details} × ${feature.songCount} songs)`;
        } else if (feature.name === 'instrumentalEnhancement') {
            priceText = `$${feature.price.toFixed(2)} (${feature.songCount} songs)`;
        } else if (feature.name === 'audioRestoration') {
            priceText = `$${feature.price.toFixed(2)} (${feature.details})`;
        } else {
            priceText = `$${feature.price.toFixed(2)}`;
        }

        return `
            <div class="enhancement-item">
                <h3>${getFeatureDisplayName(feature.name)}</h3>
                <p class="enhancement-desc">${description.desc}</p>
                <p class="enhancement-benefit">${description.benefit}</p>
                <div class="enhancement-details">
                    <span>${feature.details}</span>
                    <div class="enhancement-price">${priceText}</div>
                </div>
            </div>
        `;
    }).join('');
}

export function generatePrepMethodDetails(preparation) {
    if (preparation.type === 'selfPrep') {
        return `
            <div class="prep-method self">
                <h3>Self-Preparation</h3>
                <p>You'll prepare your tracks following our professional guidelines</p>
                <ul>
                    <li>Follow our detailed preparation guide</li>
                    <li>Learn industry-standard practices</li>
                    <li>Save money while maintaining quality</li>
                </ul>
                <div class="prep-savings">
                    Savings: $${Math.abs(preparation.price).toFixed(2)}
                </div>
            </div>
        `;
    } else if (preparation.type === 'professionalPrep') {
        return `
            <div class="prep-method professional">
                <h3>Professional Track Preparation</h3>
                <p>We handle all technical aspects of file preparation</p>
                <ul>
                    <li>Expert organization and cleanup</li>
                    <li>Professional file management</li>
                    <li>Technical optimization</li>
                </ul>
                <div class="prep-cost">
                    Cost: $${preparation.price.toFixed(2)}
                </div>
            </div>
        `;
    }
    return '';
}

export function generatePriceBreakdown(summary) {
    let html = `<div class="price-breakdown">`;

    // Base Price
    html += `
        <div class="breakdown-row">
            <span class="label">Base Price</span>
            <span class="amount">$${summary.baseService.price.toFixed(2)}</span>
        </div>
    `;

    // Extra Tracks
    if (summary.baseService.extraTracks.count > 0) {
        html += `
            <div class="breakdown-row">
                <span class="label">Additional Vocal Tracks (${summary.baseService.extraTracks.count} extra × $${summary.baseService.extraTracks.pricePerTrack} × ${summary.baseService.songCount} song${summary.baseService.songCount > 1 ? 's' : ''})</span>
                <span class="amount">$${summary.baseService.extraTracks.total.toFixed(2)}</span>
            </div>
        `;
    }

    // Selected Features
    if (summary.features.length > 0) {
        const featureTotal = summary.features.reduce((total, f) => total + f.price, 0);
        html += `
            <div class="breakdown-row">
                <span class="label">Selected Features</span>
                <span class="amount">$${featureTotal.toFixed(2)}</span>
            </div>
            ${summary.features.map(feature => {
                let details = feature.details;
                let price = feature.price;

                if (feature.name === 'layerAlignment') {
                    const totalTracks = parseInt(feature.details);
                    const alignedTracks = totalTracks - 1;
                    details = `1 reference + ${alignedTracks} aligned tracks`;
                    price = alignedTracks * CONFIG.featurePrices[feature.name] * summary.baseService.songCount;
                }

                return `
                    <div class="breakdown-row indented">
                        <span class="label">${getFeatureDisplayName(feature.name)} (${details})</span>
                        <span class="amount">$${price.toFixed(2)}</span>
                    </div>
                `;
            }).join('')}
        `;
    }

    // Calculate subtotal
    const subtotal = summary.baseService.price + 
                    summary.baseService.extraTracks.total + 
                    summary.features.reduce((total, feature) => {
                        if (feature.name === 'layerAlignment') {
                            const totalTracks = parseInt(feature.details);
                            const alignedTracks = totalTracks - 1;
                            return total + (alignedTracks * CONFIG.featurePrices[feature.name] * summary.baseService.songCount);
                        }
                        return total + feature.price;
                    }, 0);

    // Calculate bulk discount
    const bulkDiscount = summary.baseService.songCount >= 5 ? 
                        subtotal * (summary.baseService.songCount >= 10 ? 0.20 : 0.10) : 
                        0;

    // Add subtotal row
    html += `
        <div class="breakdown-row subtotal">
            <span class="label">Subtotal</span>
            <span class="amount">$${subtotal.toFixed(2)}</span>
        </div>
    `;

    // Only show bulk discount if applicable
    if (summary.baseService.songCount >= 5) {
        html += `
            <div class="breakdown-row">
                <span class="label">${summary.baseService.songCount >= 10 ? '20%' : '10%'} Bulk Discount</span>
                <span class="amount">-$${bulkDiscount.toFixed(2)}</span>
            </div>
        `;
    }

    // Track Preparation (if professional prep selected)
    if (summary.preparation.type === 'professionalPrep') {
        html += `
            <div class="breakdown-row">
                <span class="label">Track Preparation (${summary.baseService.songCount} song${summary.baseService.songCount > 1 ? 's' : ''})</span>
                <span class="amount">$${summary.preparation.price.toFixed(2)}</span>
            </div>
        `;
    }

    // Calculate final total
    const finalTotal = subtotal - bulkDiscount + 
                      (summary.preparation.type === 'professionalPrep' ? summary.preparation.price : 0);

    // Final Total
    html += `
        <div class="breakdown-row total">
            <span class="label">Total Investment</span>
            <span class="amount">$${finalTotal.toFixed(2)}</span>
        </div>
    `;

    html += `</div>`;
    return html;
} 