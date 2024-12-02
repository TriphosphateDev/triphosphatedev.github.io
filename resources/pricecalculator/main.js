import { 
    CONFIG, 
    calculateTotal, 
    calculateBasePrice, 
    calculateFeaturePrice, 
    validateFeatures, 
    validateVocalFeatures, 
    generateQuoteSummary, 
    calculateBulkDiscount 
} from './calculator.js';

import { 
    generateIncludedFeaturesList,
    generateEnhancementsList,
    generatePrepMethodDetails,
    generatePriceBreakdown 
} from './print.js';

import { getFeatureDisplayName } from './utils.js';

// Add these service descriptions at the top level
const serviceDescriptions = {
    twoTrack: 'Perfect for finished instrumentals or beats with vocals. Professional-grade mixing that brings clarity, punch, and radio-ready polish to your tracks.',
    groupStem: 'Ideal for bands and multi-track productions. Advanced routing and individual group processing for maximum control and pristine sound quality.',
    fullStem: 'Maximum control and precision. Individual tracks for each instrument and element with detailed processing per instrument.'
};

// Add these enhancement descriptions at the top level
const enhancementDescriptions = {
    melodynePitchCorrection: {
        desc: 'Professional-grade pitch correction for natural-sounding results. Perfect for maintaining emotional delivery while ensuring pitch accuracy.',
        benefit: 'Achieve major-label vocal quality without the robotic effect.'
    },
    layerAlignment: {
        desc: 'Precise timing alignment between vocal layers for tight, professional-sounding harmonies and doubles.',
        benefit: 'Create radio-ready vocal stacks that sound cohesive and powerful.'
    },
    realTimeSession: {
        desc: 'Live mix supervision via Discord with direct feedback and creative direction.',
        benefit: 'Learn professional techniques while ensuring your creative vision is perfectly executed.'
    },
    audioRestoration: {
        desc: 'Professional cleanup including noise reduction, de-breathing, and spectral repair.',
        benefit: 'Rescue problematic recordings and achieve clean, professional results.'
    },
    instrumentalEnhancement: {
        desc: 'Advanced processing for your instrumental including dynamic EQ and stereo enhancement.',
        benefit: 'Give your beat the same polish heard in major releases.'
    }
};

// State management
const state = {
    currentStep: 0,
    selectedService: null,
    songCount: 1,
    vocalTrackCount: 1,
    selectedFeatures: [],
    rushOrder: false,
    stemPrep: null,
    stemOrgRequired: null,
    featureTrackCounts: {
        melodynePitchCorrection: 0,
        layerAlignment: 0,
        realTimeSession: 0
    }
};

// Initialize UI handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    initializeNavigationBehavior();
});

function initializeCalculator() {
    // Add this to the existing initialization
    initializePreQuoteMessage();
    
    // Service selection panels
    const servicePanels = document.querySelectorAll('.service-panel');
    if (servicePanels) {
        servicePanels.forEach(panel => {
            panel.addEventListener('click', handleServiceSelection);
        });
    }

    // Back button
    const backButton = document.getElementById('backToServices');
    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    initializeCounters();
    initializeFeatureHandlers();
    initializeSongSlider();
    initializeStemPrep();
    initializePriceBreakdown();
    initializeSummaryHandlers();

    // Add this to ensure summary is populated on first load of step 3
    if (state.currentStep === 3) {
        updateQuoteSummary();
    }
}

function initializePreQuoteMessage() {
    const messageBox = document.getElementById('preQuoteMessage');
    if (!messageBox) return;

    const closeBtn = messageBox.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            messageBox.classList.add('hiding');
            setTimeout(() => {
                messageBox.remove(); // Just remove from DOM without storing in localStorage
            }, 300); // Match animation duration
        });
    }
}

function initializePriceBreakdown() {
    const mainToggleBtn = document.querySelector('.breakdown-toggle');
    const breakdown = document.querySelector('.price-breakdown');
    const featureToggleBtn = document.querySelector('.feature-expand-btn');
    const featureDetails = document.querySelector('.feature-details-breakdown');
    
    if (mainToggleBtn && breakdown) {
        mainToggleBtn.addEventListener('click', () => {
            const isExpanded = mainToggleBtn.getAttribute('aria-expanded') === 'true';
            mainToggleBtn.setAttribute('aria-expanded', !isExpanded);
            breakdown.classList.toggle('expanded');
            
            // Update text content
            const textSpan = mainToggleBtn.querySelector('span:not(.toggle-icon)');
            textSpan.textContent = isExpanded ? 'Show Breakdown' : 'Hide Breakdown';
        });
    }

    if (featureToggleBtn && featureDetails) {
        // Set initial state to expanded
        featureToggleBtn.setAttribute('aria-expanded', 'true');
        featureDetails.classList.add('expanded');
        
        featureToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = featureToggleBtn.getAttribute('aria-expanded') === 'true';
            
            // Toggle state
            featureToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
            featureDetails.classList.toggle('expanded');
            
            // Prevent event from reaching other handlers
            e.preventDefault();
        });
    }
}

function navigateToStep(step) {
    // Validate step boundaries
    if (step < 0 || step > 3) return;
    
    // Validate requirements before proceeding
    if (step === 3) {
        // Check if we have all required selections
        if (!state.selectedService) {
            showError('Please select a service type first');
            return;
        }
        if (!state.stemPrep) {
            showError('Please select a track preparation option');
            return;
        }
        
        // Show the step first
        showStep(step);
        
        // Scroll to top of page smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // For other steps, just show the step
        showStep(step);
    }
    
    // Update state and UI
    state.currentStep = step;
    updateProgressIndicator(step);
    updateNavigationButtons(step);

    // Add pulsing effect to Finish step when on Features (step 2)
    const finishStep = document.querySelector('.progress-step[data-step="3"]');
    if (finishStep) {
        if (step === 2) {
            finishStep.classList.add('pulse');
            finishStep.style.cursor = 'pointer';
            finishStep.addEventListener('click', () => {
                if (validateFeatureSelections()) {
                    navigateToStep(3);
                }
            });
        } else {
            finishStep.classList.remove('pulse');
            finishStep.style.cursor = 'default';
            finishStep.replaceWith(finishStep.cloneNode(true));
        }
    }
}

// Add validation function
function validateFeatureSelections() {
    if (!state.selectedService) {
        showError('Please select a service type first');
        return false;
    }
    if (!state.stemPrep) {
        showError('Please select a track preparation option');
        return false;
    }
    return true;
}

function handleServiceSelection(event) {
    const panel = event.currentTarget;
    const serviceType = panel.dataset.service;
    
    // If it's a standalone service, don't process it in the calculator
    if (panel.classList.contains('standalone')) {
        return;
    }
    
    // Update selection state
    document.querySelectorAll('.service-panel').forEach(p => {
        p.classList.remove('selected');
        const radio = p.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = false;
        }
    });
    
    panel.classList.add('selected');
    const radio = panel.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }
    state.selectedService = serviceType;
    
    // Show/hide Instrumental Enhancement based on service type
    const instrumentalEnhancement = document.querySelector('.feature-box.instrumental-enhancement');
    if (instrumentalEnhancement) {
        instrumentalEnhancement.style.display = serviceType === 'twoTrack' ? 'block' : 'none';
        // Uncheck if switching away from 2-track
        if (serviceType !== 'twoTrack') {
            const checkbox = instrumentalEnhancement.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                state.selectedFeatures = state.selectedFeatures.filter(f => f !== 'instrumentalEnhancement');
            }
        }
    }
    
    // Show flow and hide service panels
    document.querySelector('.feature-flow').style.display = 'block';
    document.querySelector('.service-panels').style.display = 'none';
    
    // Navigate to first step
    navigateToStep(1);
}

function handleBack() {
    // Reset state
    state.currentStep = 0;
    state.selectedService = null;
    
    // Reset feature selections
    state.selectedFeatures = [];
    state.stemPrep = null;
    
    // Reset UI elements
    const featureFlow = document.querySelector('.feature-flow');
    const servicePanels = document.querySelector('.service-panels');
    
    if (featureFlow) {
        featureFlow.style.display = 'none';
        // Reset any selected features UI
        document.querySelectorAll('.feature-box').forEach(box => {
            box.classList.remove('selected', 'expanded');
            const checkbox = box.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        });
    }
    
    if (servicePanels) {
        servicePanels.style.display = 'grid';
        // Reset service panel selections
        document.querySelectorAll('.service-panel').forEach(panel => {
            panel.classList.remove('selected');
            const radio = panel.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });
    }
    
    // Reset progress indicator to show Mix Type step
    updateProgressIndicator(0);
    
    // Update price display
    updatePriceDisplay();
    
    // Show the initial step
    showStep(0);
}

function showStep(stepNumber) {
    // Hide all flow steps first
    document.querySelectorAll('.flow-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Handle Mix Type step (step 0) specially
    if (stepNumber === 0) {
        // Show service panels and hide feature flow
        const featureFlow = document.querySelector('.feature-flow');
        const servicePanels = document.querySelector('.service-panels');
        
        if (featureFlow) featureFlow.style.display = 'none';
        if (servicePanels) servicePanels.style.display = 'grid';
        return;
    }
    
    // For other steps, show feature flow and hide service panels
    const featureFlow = document.querySelector('.feature-flow');
    const servicePanels = document.querySelector('.service-panels');
    
    if (featureFlow) featureFlow.style.display = 'block';
    if (servicePanels) servicePanels.style.display = 'none';
    
    // Show the current step
    const currentStep = document.querySelector(`.flow-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.style.display = 'block';
        if (stepNumber === 3) {
            updateQuoteSummary();
        }
    }
}

function updateProgressIndicator(step) {
    const steps = document.querySelectorAll('.progress-step');
    const progressSteps = document.querySelector('.progress-steps');
    
    // Force a reflow to ensure styles are applied consistently
    progressSteps.style.display = 'flex';
    
    steps.forEach((indicator, index) => {
        // Remove all classes first
        indicator.classList.remove('active', 'completed');
        
        // Add appropriate classes
        if (index === step) {
            indicator.classList.add('active');
        } else if (index < step) {
            indicator.classList.add('completed');
        }
    });

    // Calculate and update progress line width
    const progressWidth = (step / (steps.length - 1)) * 100;
    progressSteps.style.setProperty('--progress-width', `${progressWidth}%`);
}

function updateNavigationButtons(step) {
    const prevButton = document.querySelector('.flow-progress .nav-btn.prev');
    const nextButton = document.querySelector('.flow-progress .nav-btn.next');
    
    prevButton.disabled = step === 0;
    nextButton.disabled = step === 3;
}

function initializeCounters() {
    const vocalTrackInput = document.getElementById('vocalTrackCount');
    if (!vocalTrackInput) return;
    
    // Initialize counter buttons
    const decrementBtn = vocalTrackInput.parentElement?.querySelector('.decrement');
    const incrementBtn = vocalTrackInput.parentElement?.querySelector('.increment');

    if (decrementBtn) {
        decrementBtn.addEventListener('click', () => {
            const currentValue = parseInt(vocalTrackInput.value) || 1;
            const minValue = parseInt(vocalTrackInput.min) || 1;
            if (currentValue > minValue) {
                const newValue = currentValue - 1;
                vocalTrackInput.value = newValue.toString();
                state.vocalTrackCount = newValue;
                updateVocalFeatureAvailability(newValue);
                syncFeatureTracksWithMain();
                updatePriceDisplay();
            }
        });
    }

    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => {
            const currentValue = parseInt(vocalTrackInput.value) || 1;
            const maxValue = parseInt(vocalTrackInput.max) || 8;
            if (currentValue < maxValue) {
                const newValue = currentValue + 1;
                vocalTrackInput.value = newValue.toString();
                state.vocalTrackCount = newValue;
                updateVocalFeatureAvailability(newValue);
                syncFeatureTracksWithMain();
                updatePriceDisplay();
            }
        });
    }

    // Handle direct input
    vocalTrackInput.addEventListener('change', () => {
        let value = parseInt(vocalTrackInput.value) || 1;
        const min = parseInt(vocalTrackInput.min) || 1;
        const max = parseInt(vocalTrackInput.max) || 8;
        
        // Enforce min/max bounds
        value = Math.max(min, Math.min(max, value));
        vocalTrackInput.value = value.toString();
        state.vocalTrackCount = value;
        
        updateVocalFeatureAvailability(value);
        syncFeatureTracksWithMain();
        updatePriceDisplay();
    });
}

function initializeFeatureHandlers() {
    // Handle regular features
    const featureBoxes = document.querySelectorAll('.feature-box:not(.included):not(.rush)');
    
    featureBoxes.forEach(box => {
        const checkbox = box.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        // Handle feature selection
        box.addEventListener('click', (e) => {
            // Don't trigger if clicking counter buttons
            if (e.target.closest('.counter-controls')) return;
            
            const feature = checkbox.value;

            // Check if trying to select layer alignment with insufficient tracks
            if (feature === 'layerAlignment' && !checkbox.checked && state.vocalTrackCount < 2) {
                showError('Layer alignment requires at least 2 vocal tracks');
                return;
            }
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                if (!state.selectedFeatures.includes(feature)) {
                    state.selectedFeatures.push(feature);
                    box.classList.add('selected', 'expanded');
                    
                    // Initialize track count based on feature type
                    if (feature === 'realTimeSession') {
                        // Sessions automatically match song count
                        state.featureTrackCounts[feature] = state.songCount;
                        updateRealTimeSessionDisplay();
                    } else if (feature === 'melodynePitchCorrection') {
                        state.featureTrackCounts[feature] = state.vocalTrackCount;
                    } else if (feature === 'layerAlignment') {
                        state.featureTrackCounts[feature] = Math.max(2, state.vocalTrackCount);
                    } else if (feature === 'audioRestoration') {
                        state.featureTrackCounts[feature] = state.vocalTrackCount;
                    }
                }
            } else {
                state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                box.classList.remove('selected', 'expanded');
                
                // Reset track count
                if (feature in state.featureTrackCounts) {
                    state.featureTrackCounts[feature] = 0;
                }
            }
            
            updateFeatureTrackDisplay(feature);
            updatePriceDisplay();
        });

        // Handle counter buttons for features that need them
        const counterBtns = box.querySelectorAll('.counter-btn');
        counterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const feature = btn.dataset.feature;
                const action = btn.dataset.action;
                
                if (feature === 'layerAlignment') {
                    // Layer alignment needs minimum 2 tracks
                    if (action === 'increase' && state.featureTrackCounts[feature] < state.vocalTrackCount) {
                        state.featureTrackCounts[feature]++;
                    } else if (action === 'decrease' && state.featureTrackCounts[feature] > 2) {
                        state.featureTrackCounts[feature]--;
                    }
                } else if (feature === 'melodynePitchCorrection') {
                    if (action === 'increase' && state.featureTrackCounts[feature] < state.vocalTrackCount) {
                        state.featureTrackCounts[feature]++;
                    } else if (action === 'decrease' && state.featureTrackCounts[feature] > 1) {
                        state.featureTrackCounts[feature]--;
                    }
                } else if (feature === 'audioRestoration') {
                    // Audio restoration can go above vocal track count (for instruments)
                    if (action === 'increase') {
                        state.featureTrackCounts[feature]++;
                    } else if (action === 'decrease' && state.featureTrackCounts[feature] > 1) {
                        state.featureTrackCounts[feature]--;
                    }
                }
                
                updateFeatureTrackDisplay(feature);
                updatePriceDisplay();
            });
        });
    });

    /* Comment out rush order section
    // Handle rush order separately
    const rushBox = document.querySelector('.feature-box.rush');
    if (rushBox) {
        rushBox.addEventListener('click', () => {
            const checkbox = rushBox.querySelector('input[type="checkbox"]');
            if (!checkbox) return;

            checkbox.checked = !checkbox.checked;
            rushBox.classList.toggle('selected');
            state.rushOrder = checkbox.checked;
            
            // Don't add to selectedFeatures since it's a fee, not a feature
            updatePriceDisplay();
        });
    }
    */
}

function toggleServiceSpecificOptions(serviceType) {
    // Show/hide instrumental enhancement for 2-track only
    const instrumentalEnhancement = document.getElementById('instrumentalEnhancement');
    if (instrumentalEnhancement) {
        instrumentalEnhancement.style.display = serviceType === 'twoTrack' ? 'block' : 'none';
    }
}

function updatePriceDisplay() {
    // Get all price elements
    const totalPrice = document.querySelectorAll('#totalPrice');  // Get all elements with this ID
    const basePriceRaw = document.getElementById('basePriceRaw');
    const featurePrice = document.getElementById('featurePrice');
    const subtotalPrice = document.getElementById('subtotalPrice');
    const discountAmount = document.getElementById('discountAmount');
    const totalDiscounts = document.getElementById('totalDiscounts');
    const bulkDiscountItem = document.querySelector('.bulk-discount');
    const feesSection = document.querySelector('.fees-section');
    const stemOrgFee = document.querySelector('.stem-org-fee');
    const stemOrgSavings = document.querySelector('.stem-org-savings');
    const totalFees = document.getElementById('totalFees');
    
    if (!state.selectedService) {
        // Reset all prices if no service selected
        totalPrice.forEach(el => el.textContent = '0.00');
        if (basePriceRaw) basePriceRaw.textContent = '0.00';
        if (featurePrice) featurePrice.textContent = '0.00';
        if (subtotalPrice) subtotalPrice.textContent = '0.00';
        if (discountAmount) discountAmount.textContent = '0.00';
        if (totalDiscounts) totalDiscounts.textContent = '0.00';
        if (bulkDiscountItem) bulkDiscountItem.style.display = 'none';
        return;
    }

    // Calculate base price
    const baseServicePrice = CONFIG.basePrices[state.selectedService];
    const basePrice = baseServicePrice * state.songCount;
    
    // Calculate extra tracks fee
    const extraTrackCount = Math.max(0, state.vocalTrackCount - 4);
    const extraTrackCost = extraTrackCount * CONFIG.vocals.additionalTrackPrice;
    const extraTrackTotal = extraTrackCost * state.songCount;

    // Update base price display
    if (basePriceRaw) basePriceRaw.textContent = basePrice.toFixed(2);

    // Remove all existing extra tracks fee items first
    document.querySelectorAll('.extra-tracks-fee').forEach(item => item.remove());

    // Add extra tracks fee if applicable
    if (extraTrackCount > 0) {
        const extraTracksItem = createBreakdownItem(
            `Additional Vocal Tracks (${extraTrackCount} extra × $${CONFIG.vocals.additionalTrackPrice} × ${state.songCount} song${state.songCount > 1 ? 's' : ''})`,
            extraTrackTotal.toFixed(2),
            'extra-tracks-fee'
        );
        // Insert after base price
        const basePriceItem = document.querySelector('.breakdown-item.base');
        if (basePriceItem) {
            basePriceItem.after(extraTracksItem);
        }
    }

    // Calculate features price
    const features = calculateFeaturePrice(state.selectedFeatures, state.songCount, state.featureTrackCounts);
    
    // Calculate subtotal before rush fee
    const subtotalBeforeRush = basePrice + extraTrackTotal + features;

    /* Comment out rush fee calculation
    // Calculate rush fee
    let rushFee = 0;
    if (state.rushOrder) {
        rushFee = subtotalBeforeRush * 0.25;
    }

    // Calculate final subtotal including rush fee
    const subtotal = subtotalBeforeRush + rushFee;
    */

    // Replace with direct assignment
    const subtotal = subtotalBeforeRush;

    // Calculate bulk discount based on total including rush fee
    const bulkDiscount = calculateBulkDiscount(subtotal, state.songCount);
    
    // Calculate stem organization fee/savings
    const stemOrgAmount = state.songCount * CONFIG.perSongFees.stemOrganization;
    const stemOrgSavingsAmount = state.stemPrep === 'selfPrep' ? stemOrgAmount : 0;

    // Calculate final total
    const total = subtotal + (state.stemPrep === 'professionalPrep' ? stemOrgAmount : 0) - bulkDiscount;

    // Update all displays
    if (basePriceRaw) basePriceRaw.textContent = basePrice.toFixed(2);
    if (featurePrice) featurePrice.textContent = features.toFixed(2);
    if (subtotalPrice) subtotalPrice.textContent = subtotal.toFixed(2);
    if (discountAmount) discountAmount.textContent = bulkDiscount.toFixed(2);
    if (totalDiscounts) totalDiscounts.textContent = (bulkDiscount + stemOrgSavingsAmount).toFixed(2);

    // Update all total price displays
    totalPrice.forEach(element => {
        if (element) element.textContent = total.toFixed(2);
    });

    // Update stem organization displays
    if (feesSection && stemOrgFee && stemOrgSavings) {
        if (state.stemPrep === 'selfPrep') {
            feesSection.style.display = 'none';
            stemOrgFee.style.display = 'none';
            stemOrgSavings.style.display = 'flex';
            const savings = document.getElementById('stemOrgSavings');
            if (savings) savings.textContent = stemOrgAmount.toFixed(2);
        } else if (state.stemPrep === 'professionalPrep') {
            feesSection.style.display = 'flex';
            stemOrgFee.style.display = 'flex';
            stemOrgSavings.style.display = 'none';
            const price = document.getElementById('stemOrgPrice');
            if (price) price.textContent = stemOrgAmount.toFixed(2);
            if (totalFees) totalFees.textContent = stemOrgAmount.toFixed(2);
        } else {
            feesSection.style.display = 'none';
            stemOrgFee.style.display = 'none';
            stemOrgSavings.style.display = 'none';
        }
    }

    // Update feature breakdown with the calculated values
    updateFeatureBreakdown(basePrice, extraTrackTotal, features);

    // Show/hide bulk discount row
    if (bulkDiscountItem) {
        bulkDiscountItem.style.display = bulkDiscount > 0 ? 'flex' : 'none';
        if (bulkDiscount > 0) {
            const discountText = state.songCount >= 10 ? '20% Bulk Discount' : '10% Bulk Discount';
            const discountLabel = bulkDiscountItem.querySelector('span:first-child');
            if (discountLabel) discountLabel.textContent = discountText;
        }
    }

    // Update quote summary if we're on the final step
    if (state.currentStep === 3) {
        updateQuoteSummary();
    }
}

function initializeFeatureBreakdown() {
    const featureSummary = document.querySelector('.feature-summary');
    const expandBtn = document.querySelector('.feature-expand-btn');
    const detailsContainer = document.querySelector('.feature-details-breakdown');
    
    if (!featureSummary || !expandBtn || !detailsContainer) return;
    
    // Set initial state to expanded
    expandBtn.setAttribute('aria-expanded', 'true');
    detailsContainer.classList.add('expanded');
    
    // Handle click on the button itself
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = expandBtn.getAttribute('aria-expanded') === 'true';
        
        // Toggle state
        expandBtn.setAttribute('aria-expanded', String(!isExpanded));
        detailsContainer.classList.toggle('expanded');
        
        // Prevent event from reaching other handlers
        e.preventDefault();
    });
}

function updateFeatureBreakdown(basePrice, extraTrackTotal, features) {
    const detailsContainer = document.querySelector('.feature-details-breakdown');
    if (!detailsContainer) return;

    let detailsHTML = '';

    // If no features selected, show a message
    if (state.selectedFeatures.length === 0) {
        detailsHTML = `
            <div class="feature-detail-item">
                <span style="color: rgba(255,255,255,0.5);">No features selected</span>
            </div>
        `;
    } else {
        // Add regular features first
        state.selectedFeatures.forEach(feature => {
            if (feature === 'rushOrder') return; // Skip rush order, we'll add it after

            let amount = 0;
            let calcText = '';

            if (feature === 'melodynePitchCorrection') {
                const tracks = state.featureTrackCounts[feature];
                amount = tracks * CONFIG.featurePrices[feature] * state.songCount;
                calcText = `${tracks} tracks × $${CONFIG.featurePrices[feature]}/track × ${state.songCount} songs`;
            } else if (feature === 'layerAlignment') {
                const totalTracks = state.featureTrackCounts[feature];
                const alignedTracks = Math.max(0, totalTracks - 1);
                amount = alignedTracks * CONFIG.featurePrices[feature] * state.songCount;
                calcText = `${alignedTracks} aligned tracks × $${CONFIG.featurePrices[feature]}/track × ${state.songCount} songs`;
            } else if (feature === 'audioRestoration') {
                const tracks = state.featureTrackCounts[feature];
                amount = tracks * CONFIG.featurePrices[feature];
                calcText = `${tracks} tracks × $${CONFIG.featurePrices[feature]}/track`;
            } else if (feature === 'realTimeSession') {
                amount = CONFIG.featurePrices[feature] * state.songCount;
                calcText = `${state.songCount} one-hour sessions × $${CONFIG.featurePrices[feature]}/session`;
            } else {
                amount = CONFIG.featurePrices[feature] * state.songCount;
                calcText = `$${CONFIG.featurePrices[feature]} × ${state.songCount} songs`;
            }

            detailsHTML += `
                <div class="feature-detail-item">
                    <div class="feature-detail-left">
                        <span>${getFeatureDisplayName(feature)}</span>
                        <div class="detail-calc">${calcText}</div>
                    </div>
                    <div class="amount">$${amount.toFixed(2)}</div>
                </div>
            `;
        });

        // Add rush order fee last, after calculating subtotal
        if (state.rushOrder) {
            const subtotalBeforeRush = basePrice + extraTrackTotal + features;
            const rushFee = subtotalBeforeRush * 0.25;
            detailsHTML += `
                <div class="feature-detail-item">
                    <div class="feature-detail-left">
                        <span>Priority Processing</span>
                        <div class="detail-calc">25% of subtotal ($${subtotalBeforeRush.toFixed(2)})</div>
                    </div>
                    <div class="amount">$${rushFee.toFixed(2)}</div>
                </div>
            `;
        }
    }

    // Update content
    detailsContainer.innerHTML = detailsHTML;
}

function initializeSongSlider() {
    const container = document.querySelector('.price-and-controls');
    const songSlider = document.getElementById('songCount');
    const songOutput = document.querySelector('.slider-value');
    const sliderTicks = document.querySelector('.slider-ticks');
    const sliderProgress = document.querySelector('.slider-progress');
    const songControl = document.querySelector('.song-count-control');
    
    let sliderInactivityTimer;
    
    // Function to expand the slider
    function expandSlider() {
        songControl.classList.add('active');
        if (sliderInactivityTimer) {
            clearTimeout(sliderInactivityTimer);
        }
    }
    
    // Function to start collapse timer
    function startSliderCollapseTimer() {
        if (sliderInactivityTimer) {
            clearTimeout(sliderInactivityTimer);
        }
        sliderInactivityTimer = setTimeout(() => {
            songControl.classList.remove('active');
        }, 2000);
    }
    
    // Slider event handlers
    songSlider.addEventListener('mousedown', expandSlider);
    songSlider.addEventListener('touchstart', expandSlider);
    songSlider.addEventListener('mouseover', expandSlider);
    songSlider.addEventListener('mouseup', startSliderCollapseTimer);
    songSlider.addEventListener('touchend', startSliderCollapseTimer);
    songSlider.addEventListener('mouseleave', startSliderCollapseTimer);
    songSlider.addEventListener('input', (e) => {
        expandSlider();
        updateSliderProgress(e.target.value);
        
        // Update Real-Time Sessions if selected
        if (state.selectedFeatures.includes('realTimeSession')) {
            state.featureTrackCounts.realTimeSession = parseInt(e.target.value);
            updateRealTimeSessionDisplay();
        }
        
        updatePriceDisplay();
    });

    // Create tick marks
    for (let i = 1; i <= 20; i++) {
        const tick = document.createElement('div');
        tick.className = 'slider-tick';
        
        // Add special styling for discount thresholds
        if (i === 5 || i === 10) {
            tick.classList.add('discount');
            const label = document.createElement('div');
            label.className = 'slider-tick-label';
            
            // Create song count label
            const songCount = document.createElement('span');
            songCount.textContent = `${i} songs`;
            
            // Create discount badge
            const discountBadge = document.createElement('span');
            discountBadge.className = 'discount-indicator';
            discountBadge.textContent = i === 5 ? 'Save 10%' : 'Save 20%';
            
            // Add both elements to label
            label.appendChild(songCount);
            label.appendChild(discountBadge);
            tick.appendChild(label);
        }
        
        // Position tick mark
        const position = ((i - 1) / 19) * 100;
        tick.style.left = `${position}%`;
        sliderTicks.appendChild(tick);
    }
    
    function updateSliderProgress(value) {
        // Update progress bar
        const progress = ((value - 1) / 19) * 100;
        sliderProgress.style.width = `${progress}%`;
        
        // Update value display
        songOutput.textContent = value === '1' ? '1 song' : `${value} songs`;
        
        // Update tick marks
        const ticks = document.querySelectorAll('.slider-tick');
        ticks.forEach((tick, index) => {
            if (index < value - 1) {
                tick.classList.add('active');
            } else {
                tick.classList.remove('active');
            }
        });
        
        // Position value display
        const thumbPosition = ((value - 1) / 19) * (songSlider.offsetWidth - 48);
        songOutput.style.left = `${thumbPosition + 24}px`;
        songOutput.style.transform = 'translateX(-50%)';
        
        // Update state and price
        state.songCount = parseInt(value);
        if (state.selectedService) {
            updatePriceDisplay();
        }
    }
    
    // Initialize
    updateSliderProgress(songSlider.value);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        updateSliderProgress(songSlider.value);
    });
}

function initializeStemPrep() {
    const stemPrepOptions = document.querySelectorAll('input[name="stemPrep"]');
    const stemOptionCards = document.querySelectorAll('.stem-option');
    
    // Handle clicks on the entire card
    stemOptionCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const radio = card.querySelector('input[type="radio"]');
            if (!radio) return;
            
            radio.checked = true;
            state.stemPrep = radio.value;
            state.stemOrgRequired = radio.value === 'professionalPrep';
            
            // Update price display
            updatePriceDisplay();
            
            // Automatically advance to features step after a short delay
            setTimeout(() => {
                navigateToStep(2);
            }, 300);
        });
    });
    
    // Also handle direct radio button changes
    stemPrepOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            state.stemPrep = e.target.value;
            state.stemOrgRequired = e.target.value === 'professionalPrep';
            
            // Update price display
            updatePriceDisplay();
            
            // Automatically advance to features step after a short delay
            setTimeout(() => {
                navigateToStep(2);
            }, 300);
        });
    });
}

function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-dismiss">×</button>
    `;
    
    // Insert at the top of the content area
    const contentArea = document.querySelector('.content-wrapper');
    contentArea.insertBefore(errorContainer, contentArea.firstChild);
    
    // Manual dismiss
    errorContainer.querySelector('.error-dismiss').onclick = () => errorContainer.remove();
}

function initializeNavigationBehavior() {
    const container = document.querySelector('.price-and-controls');
    const navSection = document.querySelector('.flow-progress');
    const progressSteps = document.querySelectorAll('.progress-step');
    let navInactivityTimer;
    let isNavHovered = false;

    // Add click handlers for progress steps
    progressSteps.forEach(step => {
        step.addEventListener('click', () => {
            const stepNumber = parseInt(step.dataset.step);
            // Only allow navigating to completed steps or current step
            if (stepNumber <= state.currentStep) {
                navigateToStep(stepNumber);
            }
        });
    });

    // Navigation button handlers
    const prevButton = navSection.querySelector('.nav-btn.prev');
    const nextButton = navSection.querySelector('.nav-btn.next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (state.currentStep > 0) {
                navigateToStep(state.currentStep - 1);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (state.currentStep < 3) {
                navigateToStep(state.currentStep + 1);
            }
        });
    }

    // Rest of the navigation behavior...
}

function updateStemOrgDisplay() {
    const stemOrgFeeDisplay = document.getElementById('stemOrgFeeDisplay');
    const stemOrgPrice = document.getElementById('stemOrgPrice');
    const stemOrgSavings = document.getElementById('stemOrgSavings');
    const savingsAmount = stemOrgSavings.querySelector('.savings-amount');
    const totalAmount = state.songCount * CONFIG.perSongFees.stemOrganization;

    if (state.stemPrep === 'selfPrep') {
        // Show savings amount in green
        stemOrgFeeDisplay.style.display = 'none';
        stemOrgSavings.style.display = 'inline';
        savingsAmount.textContent = totalAmount.toFixed(2);
    } else {
        // Show fee amount in red with link
        stemOrgFeeDisplay.style.display = 'inline';
        stemOrgSavings.style.display = 'none';
        stemOrgPrice.textContent = totalAmount.toFixed(2);
    }
}

function updateVocalFeatureAvailability(vocalTrackCount) {
    // Get all vocal-dependent features
    const layerAlignment = document.querySelector('input[value="layerAlignment"]')?.closest('.feature-box');
    const pitchCorrection = document.querySelector('input[value="melodynePitchCorrection"]')?.closest('.feature-box');
    
    if (layerAlignment) {
        // Layer alignment needs at least 2 tracks (1 reference + 1 to align)
        if (vocalTrackCount < 2) {
            layerAlignment.classList.add('disabled');
            // Uncheck if selected
            if (state.selectedFeatures.includes('layerAlignment')) {
                const checkbox = layerAlignment.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
                state.selectedFeatures = state.selectedFeatures.filter(f => f !== 'layerAlignment');
                state.featureTrackCounts['layerAlignment'] = 0;
                layerAlignment.classList.remove('selected', 'expanded');
            }
        } else {
            layerAlignment.classList.remove('disabled');
        }
    }

    if (pitchCorrection) {
        if (vocalTrackCount === 0) {
            pitchCorrection.classList.add('disabled');
            // Uncheck if selected
            const checkbox = pitchCorrection.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                state.selectedFeatures = state.selectedFeatures.filter(f => f !== 'melodynePitchCorrection');
            }
        } else {
            pitchCorrection.classList.remove('disabled');
        }
    }

    // Update price display to reflect any changes
    updatePriceDisplay();
}

function updateFeatureTrackDisplay(feature) {
    const featureBox = document.querySelector(`input[value="${feature}"]`)?.closest('.feature-box');
    if (!featureBox) return;

    const trackCounter = featureBox.querySelector('.feature-track-counter');
    if (!trackCounter) return;

    const trackCount = state.featureTrackCounts[feature];

    if (feature === 'layerAlignment') {
        // Update the aligned tracks display
        const alignedTracks = trackCounter.querySelector('.aligned-tracks');
        if (alignedTracks) {
            const alignedCount = Math.max(0, trackCount - 1);
            alignedTracks.textContent = alignedCount;
        }

        // Update the counter display to show total tracks
        const countDisplay = trackCounter.querySelector('.track-count');
        if (countDisplay) {
            countDisplay.textContent = trackCount;
        }
    } else {
        const countDisplay = trackCounter.querySelector('.track-count');
        if (countDisplay) {
            countDisplay.textContent = trackCount;
        }
    }

    // Update price preview
    updateFeaturePricePreview(feature);
}

function updateFeaturePricePreview(feature) {
    const featureBox = document.querySelector(`input[value="${feature}"]`)?.closest('.feature-box');
    if (!featureBox) return;

    const pricePreview = featureBox.querySelector('.feature-price-preview');
    if (!pricePreview) return;

    let amount = 0;
    if (feature === 'melodynePitchCorrection' || feature === 'layerAlignment') {
        const tracks = state.featureTrackCounts[feature];
        const effectiveTracks = feature === 'layerAlignment' ? Math.max(0, tracks - 1) : tracks;
        amount = effectiveTracks * CONFIG.featurePrices[feature] * state.songCount;
    } else if (feature === 'audioRestoration') {
        // Audio restoration shows per-track total, not multiplied by song count
        const tracks = state.featureTrackCounts[feature];
        amount = tracks * CONFIG.featurePrices[feature];
    } else {
        amount = CONFIG.featurePrices[feature] * state.songCount;
    }

    pricePreview.textContent = `$${amount.toFixed(2)}`;
}

function syncFeatureTracksWithMain() {
    const mainCount = state.vocalTrackCount;
    
    Object.keys(state.featureTrackCounts).forEach(feature => {
        const featureBox = document.querySelector(`input[value="${feature}"]`)?.closest('.feature-box');
        if (!featureBox) return;

        // Don't sync audio restoration or real-time sessions
        if (feature === 'audioRestoration' || feature === 'realTimeSession') {
            if (state.selectedFeatures.includes(feature)) {
                updateFeatureTrackDisplay(feature);
            }
            return;
        }

        // Handle vocal processing features
        if (state.selectedFeatures.includes(feature)) {
            if (feature === 'layerAlignment') {
                // For layer alignment, ensure we maintain at least 2 tracks if possible
                if (mainCount < 2) {
                    // If vocal tracks drop below 2, deselect the feature
                    state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                    state.featureTrackCounts[feature] = 0;
                    featureBox.classList.remove('selected', 'expanded');
                    const checkbox = featureBox.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.checked = false;
                } else {
                    // Keep current count unless it exceeds available tracks
                    const currentCount = state.featureTrackCounts[feature];
                    if (currentCount > mainCount) {
                        state.featureTrackCounts[feature] = mainCount;
                    } else if (currentCount < 2) {
                        state.featureTrackCounts[feature] = 2;
                    }
                }
            } else if (feature === 'melodynePitchCorrection') {
                // For pitch correction, ensure count doesn't exceed available tracks
                const currentCount = state.featureTrackCounts[feature];
                if (currentCount > mainCount) {
                    state.featureTrackCounts[feature] = mainCount;
                }
            }
            
            updateFeatureTrackDisplay(feature);
        }
    });
    
    updatePriceDisplay();
}

// Helper function to create breakdown items
function createBreakdownItem(label, amount, className = '') {
    const item = document.createElement('div');
    item.className = `breakdown-item ${className}`.trim();
    item.innerHTML = `
        <span>${label}</span>
        <span class="amount">$<span>${amount}</span></span>
    `;
    return item;
}

// Add new function to update Real-Time Session display
function updateRealTimeSessionDisplay() {
    const sessionBox = document.querySelector('input[value="realTimeSession"]')?.closest('.feature-box');
    if (!sessionBox) return;

    const sessionCount = sessionBox.querySelector('.session-count');
    const totalHours = sessionBox.querySelector('.total-hours');
    const featureTotal = sessionBox.querySelector('.feature-total');

    if (sessionCount) sessionCount.textContent = state.songCount;
    if (totalHours) totalHours.textContent = state.songCount;
    if (featureTotal) featureTotal.textContent = (state.songCount * CONFIG.featurePrices.realTimeSession).toFixed(2);
}

// Update the updateQuoteSummary function to include base features
function updateQuoteSummary() {
    if (state.currentStep !== 3) return;
    
    const elements = {
        totalPrice: document.getElementById('quoteTotalPrice'),
        serviceType: document.getElementById('quoteServiceType'),
        serviceDesc: document.getElementById('quoteServiceDesc'),
        songCount: document.getElementById('quoteSongCount'),
        includedFeatures: document.getElementById('quoteIncludedFeatures'),
        enhancementList: document.getElementById('quoteEnhancementList'),
        prepMethod: document.getElementById('quotePrepMethod')
    };

    const summary = generateQuoteSummary(state);
    
    // Use the same total from the price breakdown
    const mainTotal = document.getElementById('totalPrice');
    if (elements.totalPrice && mainTotal) {
        elements.totalPrice.textContent = mainTotal.textContent;
    }

    // Update service info with song count and track details
    if (elements.serviceType && elements.serviceDesc) {
        elements.serviceType.textContent = summary.baseService.type === 'twoTrack' ? '2-Track Mixdown' : 'Group Stem Mixdown';
        elements.serviceDesc.innerHTML = `
            Perfect for finished instrumentals or beats with vocals. 
            Professional-grade mixing with streaming-ready mastering that brings clarity, punch, and radio-ready polish to your tracks.
        `;
        if (elements.songCount) {
            let songText = `${summary.baseService.songCount} song${summary.baseService.songCount > 1 ? 's' : ''}`;
            if (summary.baseService.extraTracks.count > 0) {
                songText += ` (including ${summary.baseService.extraTracks.count} additional vocal tracks at $${CONFIG.vocals.additionalTrackPrice}/track)`;
            }
            elements.songCount.textContent = songText;
        }
    }

    // Update included features with detailed explanations
    if (elements.includedFeatures) {
        const baseFeatures = summary.baseService.type === 'twoTrack' ? [
            {
                feature: 'Professional EQ & Compression',
                desc: 'Surgical frequency control and dynamic processing for a balanced, professional sound'
            },
            {
                feature: 'Spatial Effects & Stereo Enhancement',
                desc: 'Create depth and width in your mix using industry-standard techniques'
            },
            {
                feature: 'Basic Autotune',
                desc: 'Natural-sounding pitch correction included at no extra cost'
            },
            {
                feature: 'Streaming-Ready Mastering',
                desc: 'Professional mastering optimized for all streaming platforms'
            },
            {
                feature: 'Up to 4 Vocal Tracks',
                desc: 'Perfect for main vocals, doubles, and basic harmonies'
            },
            {
                feature: 'Unlimited Minor Revisions',
                desc: 'We\'ll refine until you\'re completely satisfied with the results'
            }
        ] : [
            {
                feature: 'Individual Group Processing',
                desc: 'Separate processing chains for drums, vocals, instruments, and more'
            },
            {
                feature: 'Advanced Routing & Effects',
                desc: 'Complex signal routing for maximum clarity and professional sound'
            },
            {
                feature: 'Complex Effect Chains',
                desc: 'Multiple stages of processing for each instrument group'
            },
            {
                feature: 'Professional Mastering',
                desc: 'Advanced mastering with detailed control over the final sound'
            },
            {
                feature: 'Up to 4 Vocal Tracks',
                desc: 'Professional vocal processing with group-based control'
            },
            {
                feature: 'Unlimited Minor Revisions',
                desc: 'Fine-tune your mix until it\'s exactly right'
            }
        ];

        elements.includedFeatures.innerHTML = baseFeatures.map(feature => `
            <li>
                <strong>${feature.feature}</strong>
                <span class="feature-explanation">${feature.desc}</span>
            </li>
        `).join('');
    }

    // Update selected enhancements with detailed pricing
    if (elements.enhancementList) {
        if (summary.features.length === 0) {
            elements.enhancementList.innerHTML = `
                <p>No additional enhancements selected. Consider adding professional enhancements to take your mix to the next level.</p>
            `;
        } else {
            const enhancementsHTML = summary.features.map(feature => {
                const description = enhancementDescriptions[feature.name] || {};
                let priceText;
                let displayDetails = feature.details;
                
                // Format price text based on feature type
                if (feature.name === 'layerAlignment') {
                    const totalTracks = parseInt(feature.details);
                    const alignedTracks = totalTracks - 1;
                    const alignmentPrice = alignedTracks * CONFIG.featurePrices[feature.name] * summary.baseService.songCount;
                    priceText = `$${alignmentPrice.toFixed(2)} (${alignedTracks} aligned tracks × ${summary.baseService.songCount} songs)`;
                    displayDetails = `1 reference + ${alignedTracks} aligned tracks`;
                } else if (feature.name === 'melodynePitchCorrection') {
                    priceText = `$${feature.price.toFixed(2)} (${feature.details} × ${summary.baseService.songCount} songs)`;
                } else if (feature.name === 'instrumentalEnhancement') {
                    priceText = `$${feature.price.toFixed(2)} (${summary.baseService.songCount} songs)`;
                } else if (feature.name === 'audioRestoration') {
                    priceText = `$${feature.price.toFixed(2)} (${feature.details})`;
                } else if (feature.name === 'rushOrder') {
                    const subtotalBeforeRush = summary.baseService.price + 
                                             summary.baseService.extraTracks.total + 
                                             summary.features.reduce((total, f) => {
                                                 if (f.name === 'layerAlignment') {
                                                     const totalTracks = parseInt(f.details);
                                                     const alignedTracks = totalTracks - 1;
                                                     return total + (alignedTracks * CONFIG.featurePrices[f.name] * summary.baseService.songCount);
                                                 }
                                                 return total + f.price;
                                             }, 0);
                    const rushFee = subtotalBeforeRush * 0.25;
                    priceText = `$${rushFee.toFixed(2)} (25% of subtotal)`;
                    displayDetails = 'Expedited processing';

                    return `
                        <div class="enhancement-item">
                            <h4>Priority Processing</h4>
                            <p class="enhancement-desc">Fast-tracked processing and delivery with priority queue placement.</p>
                            <p class="enhancement-benefit">Expedited turnaround time based on current workload.</p>
                            <div class="enhancement-details">
                                <span>${displayDetails}</span>
                                <div class="enhancement-price">${priceText}</div>
                            </div>
                        </div>
                    `;
                } else {
                    priceText = `$${feature.price.toFixed(2)}`;
                }

                return `
                    <div class="enhancement-item">
                        <h4>${getFeatureDisplayName(feature.name)}</h4>
                        <p class="enhancement-desc">${description.desc || ''}</p>
                        <p class="enhancement-benefit">${description.benefit || ''}</p>
                        <div class="enhancement-details">
                            <span>${displayDetails}</span>
                            <div class="enhancement-price">${priceText}</div>
                        </div>
                    </div>
                `;
            }).join('');
            elements.enhancementList.innerHTML = enhancementsHTML;
        }
    }

    // Update track preparation method with value-focused messaging
    if (elements.prepMethod) {
        if (summary.preparation.type === 'selfPrep') {
            elements.prepMethod.innerHTML = `
                <div class="prep-details">
                    <h4>Self-Preparation</h4>
                    <p>Take control of your track preparation and save money while ensuring optimal mix quality.</p>
                    <div class="prep-benefits">
                        <ul>
                            <li>Follow our professional guidelines for best results</li>
                            <li>Learn industry-standard file preparation techniques</li>
                            <li>Ensure faster turnaround time</li>
                        </ul>
                    </div>
                    <div class="prep-savings">Saves $${Math.abs(summary.preparation.price).toFixed(2)}</div>
                    <a href="/services/track-prep/" class="prep-guide-link">View Track Preparation Guide</a>
                </div>
            `;
        } else if (summary.preparation.type === 'professionalPrep') {
            elements.prepMethod.innerHTML = `
                <div class="prep-details">
                    <h4>Professional Track Preparation</h4>
                    <p>Let us handle the technical details while you focus on your creativity.</p>
                    <div class="prep-benefits">
                        <ul>
                            <li>Expert organization and cleanup of your files</li>
                            <li>Proper track labeling and grouping</li>
                            <li>Technical optimization for best mix quality</li>
                            <li>Save time and ensure professional results</li>
                        </ul>
                    </div>
                    <div class="prep-cost">$${summary.preparation.price.toFixed(2)}</div>
                </div>
            `;
        }
    }

    // Add bulk discount info with encouraging messaging
    if (summary.discounts.bulk > 0) {
        // Calculate bulk discount the same way as calculator and printout
        const subtotalBeforeDiscount = summary.baseService.price + 
                                     summary.baseService.extraTracks.total + 
                                     summary.features.reduce((total, feature) => {
                                         if (feature.name === 'layerAlignment') {
                                             const totalTracks = parseInt(feature.details);
                                             const alignedTracks = totalTracks - 1;
                                             return total + (alignedTracks * CONFIG.featurePrices[feature.name] * summary.baseService.songCount);
                                         }
                                         return total + feature.price;
                                     }, 0);
        
        const bulkDiscount = subtotalBeforeDiscount * (summary.baseService.songCount >= 10 ? 0.20 : 0.10);
        
        const discountHTML = `
            <div class="discount-item">
                <h4>${summary.baseService.songCount >= 10 ? '20%' : '10%'} Bulk Discount</h4>
                <p>Save more by mixing multiple songs! Professional consistency across your entire project.</p>
                <div class="discount-amount">-$${bulkDiscount.toFixed(2)}</div>
            </div>
        `;
        if (elements.enhancementList) {
            elements.enhancementList.insertAdjacentHTML('beforeend', discountHTML);
        }
    }
}

// Add this to handle back navigation from summary
function handleBackFromSummary() {
    // Store current state for potential forward navigation
    const previousState = { ...state };
    
    // Return to features step
    navigateToStep(2);
}

// Add this to handle print functionality
function handlePrintQuote() {
    const summary = generateQuoteSummary(state);
    if (!summary) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Your Custom Mixing Package - Trip Mixes</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .print-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #8A7BF4;
                }

                .print-logo {
                    max-width: 150px;
                    margin-bottom: 1rem;
                }

                h1, h2, h3, h4 {
                    color: #8A7BF4;
                    margin: 1.5rem 0 1rem;
                }

                .service-details, .prep-method-section {
                    background: #f8f8ff;
                    border: 1px solid #e0e0ff;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .features-section {
                    margin: 2rem 0;
                }

                .feature-item {
                    background: #fff;
                    border: 1px solid #e0e0ff;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }

                .feature-desc, .feature-benefit {
                    margin: 0.5rem 0;
                    color: #666;
                }

                .feature-details {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0ff;
                }

                .price-calc {
                    color: #666;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }

                .breakdown-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #e0e0ff;
                }

                .breakdown-row.indented {
                    padding-left: 2rem;
                    color: #666;
                }

                .breakdown-row.subtotal {
                    font-weight: bold;
                    border-top: 2px solid #8A7BF4;
                    border-bottom: none;
                    padding-top: 1rem;
                    margin-top: 1rem;
                }

                .breakdown-row.total {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #8A7BF4;
                    border: none;
                    padding-top: 1rem;
                    margin-top: 1rem;
                }

                .quote-message {
                    background: #f8f8ff;
                    border: 1px solid #e0e0ff;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                }

                .quote-message ul {
                    padding-left: 1.5rem;
                }

                .quote-message li {
                    margin: 0.5rem 0;
                }

                .print-footer {
                    text-align: center;
                    margin-top: 3rem;
                    padding-top: 1rem;
                    border-top: 2px solid #8A7BF4;
                    color: #666;
                    font-size: 0.9rem;
                }

                @media print {
                    body {
                        padding: 0;
                    }

                    .service-details, .prep-method-section, .feature-item, .quote-message {
                        break-inside: avoid;
                    }

                    .features-section {
                        break-before: avoid;
                        break-after: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-wrapper">
                <div class="print-header">
                    <img src="/Driplogo.jpg" alt="Trip Mixes" class="print-logo">
                    <h1>Professional Mixing Quote</h1>
                    <div class="print-date">Generated on ${new Date().toLocaleDateString()}</div>
                </div>

                <div class="quote-content">
                    <!-- Mix Type Box -->
                    <div class="service-details">
                        <h3>${summary.baseService.type === 'twoTrack' ? '2-Track Mixdown' : 'Group Stem Mixdown'}</h3>
                        <p>${serviceDescriptions[summary.baseService.type]}</p>
                        <div class="service-info">
                            <p><strong>${summary.baseService.songCount} song${summary.baseService.songCount > 1 ? 's' : ''}</strong></p>
                            ${summary.baseService.extraTracks.count > 0 ? `
                                <p>Including ${summary.baseService.extraTracks.count} additional vocal track${summary.baseService.extraTracks.count > 1 ? 's' : ''} 
                                at $${CONFIG.vocals.additionalTrackPrice}/track</p>
                            ` : ''}
                            <div class="included-features">
                                <h4>Included Features:</h4>
                                <ul>
                                    ${generateIncludedFeaturesList(summary.baseService.type)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Track Preparation Box -->
                    <div class="prep-method-section">
                        <h3>Track Preparation</h3>
                        ${summary.preparation.type === 'selfPrep' ? `
                            <div class="prep-details">
                                <h4>Self-Preparation</h4>
                                <p>Take control of your track preparation and save money while ensuring optimal mix quality.</p>
                                <div class="prep-benefits">
                                    <ul>
                                        <li>Follow our professional guidelines for best results</li>
                                        <li>Learn industry-standard file preparation techniques</li>
                                        <li>Ensure faster turnaround time</li>
                                    </ul>
                                </div>
                                <div class="prep-savings">Savings: $${Math.abs(summary.preparation.price).toFixed(2)}</div>
                                <a href="/services/track-prep/" class="prep-guide-link">View Track Preparation Guide</a>
                            </div>
                        ` : `
                            <div class="prep-details">
                                <h4>Professional Track Preparation</h4>
                                <p>Let us handle the technical details while you focus on your creativity.</p>
                                <div class="prep-benefits">
                                    <ul>
                                        <li>Expert organization and cleanup of your files</li>
                                        <li>Proper track labeling and grouping</li>
                                        <li>Technical optimization for best mix quality</li>
                                        <li>Save time and ensure professional results</li>
                                    </ul>
                                </div>
                                <div class="prep-cost">Cost: $${summary.preparation.price.toFixed(2)}</div>
                            </div>
                        `}
                    </div>

                    <!-- Selected Features Section -->
                    ${summary.features.length > 0 ? `
                        <div class="features-section">
                            <h3>Selected Features</h3>
                            ${summary.features.map(feature => {
                                const description = enhancementDescriptions[feature.name] || {};
                                let priceBreakdown = '';
                                let displayDetails = feature.details;
                                
                                if (feature.name === 'layerAlignment') {
                                    const totalTracks = parseInt(feature.details);
                                    const alignedTracks = totalTracks - 1;
                                    priceBreakdown = `$${CONFIG.featurePrices[feature.name]} × ${alignedTracks} aligned tracks × ${summary.baseService.songCount} songs = $${feature.price.toFixed(2)}`;
                                    displayDetails = `1 reference + ${alignedTracks} aligned tracks`;
                                } else if (feature.name === 'melodynePitchCorrection') {
                                    priceBreakdown = `$${CONFIG.featurePrices[feature.name]} × ${feature.details} × ${summary.baseService.songCount} songs = $${feature.price.toFixed(2)}`;
                                } else if (feature.name === 'audioRestoration') {
                                    priceBreakdown = `$${CONFIG.featurePrices[feature.name]} × ${feature.details} = $${feature.price.toFixed(2)}`;
                                } else if (feature.name === 'realTimeSession') {
                                    priceBreakdown = `$${CONFIG.featurePrices[feature.name]} × ${summary.baseService.songCount} songs = $${feature.price.toFixed(2)}`;
                                } else {
                                    priceBreakdown = `$${CONFIG.featurePrices[feature.name]} × ${summary.baseService.songCount} songs = $${feature.price.toFixed(2)}`;
                                }

                                return `
                                    <div class="feature-item">
                                        <h4>${getFeatureDisplayName(feature.name)}</h4>
                                        <p class="feature-desc">${description.desc || ''}</p>
                                        <p class="feature-benefit">${description.benefit || ''}</p>
                                        <div class="feature-details">
                                            <div class="scope">${displayDetails}</div>
                                            <div class="price-calc">
                                                <span class="breakdown">${priceBreakdown}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}

                    <!-- Investment Summary -->
                    <div class="quote-section">
                        <h2>Investment Summary</h2>
                        ${generatePriceBreakdown(summary)}
                    </div>

                    <!-- Quote Message -->
                    <div class="quote-message">
                        <h3>What This Quote Means</h3>
                        <p>This custom quote represents the estimated hours and work involved in enhancing your music based on your input. Here's what to keep in mind:</p>
                        <ul>
                            <li><strong>Not Set in Stone:</strong> Some songs may require less work than estimated, and we'll never overcharge for features or enhancements that aren't needed.</li>
                            <li><strong>Tailored to You:</strong> During the free consultation, we'll assess your tracks and determine what's necessary to achieve your vision.</li>
                            <li><strong>Flexible and Affordable:</strong> Our goal is to offer professional mixing services that meet your needs without exceeding your budget.</li>
                        </ul>
                    </div>
                </div>

                <div class="print-footer">
                    <p>Quote valid for 30 days from date of generation</p>
                    <p>Contact: triphosphatelp@gmail.com</p>
                    <p>www.tripmixes.com</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };
}

function initializeSummaryHandlers() {
    const printButton = document.querySelector('.quote-summary .btn.secondary');
    if (printButton) {
        printButton.addEventListener('click', handlePrintQuote);
    }
}

// Add this function for testing
function resetPreQuoteMessage() {
    localStorage.removeItem('preQuoteMessageDismissed');
    location.reload();
}

function handleFeatureClick(e) {
    // Don't trigger if clicking counter buttons
    if (e.target.closest('.counter-controls')) return;
    
    const featureBox = e.currentTarget;
    const checkbox = featureBox.querySelector('input[type="checkbox"]');
    const feature = checkbox.value;

    // Check if trying to select layer alignment with insufficient tracks
    if (feature === 'layerAlignment' && !checkbox.checked && state.vocalTrackCount < 2) {
        showError('Layer alignment requires at least 2 vocal tracks');
        return;
    }
    
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        if (!state.selectedFeatures.includes(feature)) {
            state.selectedFeatures.push(feature);
            featureBox.classList.add('selected');
            
            // Initialize track count based on feature type
            if (feature === 'realTimeSession') {
                state.featureTrackCounts[feature] = state.songCount;
                updateRealTimeSessionDisplay();
            } else if (feature === 'melodynePitchCorrection') {
                state.featureTrackCounts[feature] = state.vocalTrackCount;
            } else if (feature === 'layerAlignment') {
                state.featureTrackCounts[feature] = Math.max(2, state.vocalTrackCount);
            } else if (feature === 'audioRestoration') {
                state.featureTrackCounts[feature] = state.vocalTrackCount;
            } else if (feature === 'rushOrder') {
                state.rushOrder = true;
            }
        }
    } else {
        state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
        featureBox.classList.remove('selected');
        
        // Reset track count or state
        if (feature in state.featureTrackCounts) {
            state.featureTrackCounts[feature] = 0;
        } else if (feature === 'rushOrder') {
            state.rushOrder = false;
        }
    }
    
    updatePriceDisplay();
}
