import { 
    CONFIG, 
    calculateTotal, 
    calculateBasePrice, 
    calculateFeaturePrice, 
    validateFeatures, 
    validateVocalFeatures 
} from './calculator.js';

// State management
const state = {
    currentStep: 1,
    selectedService: null,
    songCount: 1,
    vocalTrackCount: 1,
    selectedFeatures: [], // Start empty, don't add basicAutotune (it's included)
    rushOrder: false,
    stemOrgRequired: true,
    stemPrep: null,
    featureTrackCounts: {
        melodynePitchCorrection: 0,
        layerAlignment: 0
    }
};

// Initialize UI handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    initializeFeatureCounters();
});

function initializeCalculator() {
    // Service selection buttons
    const selectButtons = document.querySelectorAll('.select-btn');
    if (selectButtons) {
        selectButtons.forEach(button => {
            button.addEventListener('click', handleServiceSelection);
        });
    }

    // Back button
    const backButton = document.getElementById('backToServices');
    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    // Counter controls
    initializeCounters();

    // Feature checkboxes
    initializeFeatureHandlers();

    // Initialize song slider
    initializeSongSlider();

    // Initialize stem preparation options
    initializeStemPrep();

    // Initialize navigation after price display is loaded
    initializeNavigation();

    // Initialize price breakdown toggle
    initializePriceBreakdown();
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
        featureToggleBtn.addEventListener('click', () => {
            const isExpanded = featureToggleBtn.getAttribute('aria-expanded') === 'true';
            featureToggleBtn.setAttribute('aria-expanded', !isExpanded);
            featureDetails.classList.toggle('expanded');
        });
    }
}

function navigateToStep(step) {
    // Validate step boundaries
    if (step < 0 || step > 3) return;
    
    // Handle special cases
    if (step === 0) {
        // Return to service selection
        document.querySelector('.feature-flow').style.display = 'none';
        document.querySelector('.service-panels').style.display = 'grid';
        state.selectedService = null;
    } else {
        // Validate requirements before proceeding
        if (step === 1 && !state.selectedService) {
            showError('Please select a service type first');
            return;
        }
        if (step === 2 && !state.stemPrep) {
            showError('Please select a track preparation option');
            return;
        }
        
        // Show feature flow if coming from service selection
        if (state.currentStep === 0) {
            document.querySelector('.feature-flow').style.display = 'block';
            document.querySelector('.service-panels').style.display = 'none';
        }
        
        showStep(step);
    }
    
    // Update state and UI
    state.currentStep = step;
    updateProgressIndicator(step);
    updateNavigationButtons(step);
}

function handleServiceSelection(event) {
    const serviceType = event.target.dataset.service;
    state.selectedService = serviceType;
    
    // Update vocal track minimum and default value
    const vocalTrackInput = document.getElementById('vocalTrackCount');
    if (vocalTrackInput) {
        vocalTrackInput.min = serviceType === 'twoTrack' ? 1 : 0;
        // Set default value based on service type
        const defaultValue = serviceType === 'twoTrack' ? 1 : 0;
        vocalTrackInput.textContent = defaultValue;
        state.vocalTrackCount = defaultValue;
    }
    
    // Update feature visibility based on vocal track count
    updateVocalFeatureAvailability(state.vocalTrackCount);
    
    // Navigate to first step
    navigateToStep(1);
    
    // Show flow and hide service panels
    document.querySelector('.feature-flow').style.display = 'block';
    document.querySelector('.service-panels').style.display = 'none';
    
    // Start with stem organization choice
    showStep(1);
    updateProgressIndicator(1);
    
    // Show/hide service-specific options
    toggleServiceSpecificOptions(serviceType);
    
    // Reset rush order if selected
    if (state.rushOrder) {
        const rushOrderOption = document.querySelector('.feature-box.rush');
        rushOrderOption.classList.remove('selected');
        document.getElementById('rushOrder').checked = false;
        const selectedTag = rushOrderOption.querySelector('.selected-tag');
        if (selectedTag) selectedTag.style.display = 'none';
        state.rushOrder = false;
    }
    
    // Update price display with new service
    updatePriceDisplay();
}

function handleBack() {
    // Reset state
    state.currentStep = 1;
    state.selectedService = null;
    
    // Show service panels and hide flow
    document.querySelector('.feature-flow').style.display = 'none';
    document.querySelector('.service-panels').style.display = 'grid';
    
    // Reset progress
    updateProgressIndicator(1);
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.flow-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    const currentStep = document.querySelector(`.flow-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.style.display = 'block';
    }
}

function updateProgressIndicator(step) {
    document.querySelectorAll('.progress-step').forEach((indicator, index) => {
        if (index <= step) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
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
    
    state.vocalTrackCount = 1;
    vocalTrackInput.textContent = state.vocalTrackCount;
    
    const vocalTrackBtns = vocalTrackInput.parentElement.querySelectorAll('.counter-btn');
    
    vocalTrackBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const currentValue = state.vocalTrackCount;
            const minTracks = state.selectedService === 'twoTrack' ? 1 : 0;
            
            if (action === 'increase' && currentValue < CONFIG.vocals.maxTracks) {
                state.vocalTrackCount = currentValue + 1;
            } else if (action === 'decrease' && currentValue > minTracks) {
                state.vocalTrackCount = currentValue - 1;
            }
            
            vocalTrackInput.textContent = state.vocalTrackCount;
            
            // First sync feature tracks with new main count
            syncFeatureTracksWithMain();
            // Then update feature availability (this will handle disabling/enabling)
            updateVocalFeatureAvailability(state.vocalTrackCount);
            
            updatePriceDisplay();
        });
    });
}

function initializeFeatureHandlers() {
    const featureOptions = document.querySelectorAll('.feature-box:not(.included):not(.rush)');
    featureOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            if (option.classList.contains('disabled')) return;
            
            const checkbox = option.querySelector('input[type="checkbox"]');
            const isSelected = option.classList.contains('selected');
            const selectedTag = option.querySelector('.selected-tag');
            const feature = checkbox.value;
            
            try {
                // Toggle expanded state
                option.classList.toggle('expanded');
                
                // Handle feature selection
                if (!isSelected) {
                    validateFeatures(state.selectedService, [...state.selectedFeatures, feature]);
                    validateVocalFeatures([...state.selectedFeatures, feature], state.vocalTrackCount);
                    state.selectedFeatures.push(feature);
                    option.classList.add('selected');
                    checkbox.checked = true;
                    if (selectedTag) selectedTag.style.display = 'block';
                    
                    // Initialize track count to match main count when selected
                    if (feature === 'melodynePitchCorrection') {
                        state.featureTrackCounts[feature] = state.vocalTrackCount;
                    } else if (feature === 'layerAlignment') {
                        // For layer alignment, ensure minimum 2 tracks when selected
                        state.featureTrackCounts[feature] = Math.max(2, state.vocalTrackCount);
                    }
                    updateFeatureTrackDisplay(feature);
                    updateFeaturePricePreview(feature);
                } else {
                    state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                    option.classList.remove('selected');
                    checkbox.checked = false;
                    if (selectedTag) selectedTag.style.display = 'none';
                    
                    // Reset track count when deselected
                    if (feature === 'melodynePitchCorrection' || feature === 'layerAlignment') {
                        state.featureTrackCounts[feature] = 0;
                        updateFeatureTrackDisplay(feature);
                        updateFeaturePricePreview(feature);
                    }
                }
                updatePriceDisplay();
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // Rush order handler
    const rushOrderCheckbox = document.getElementById('rushOrder');
    if (!rushOrderCheckbox) return;
    
    const rushOrderOption = rushOrderCheckbox.closest('.feature-box.rush');
    if (!rushOrderOption) return;
    
    rushOrderOption.addEventListener('click', (e) => {
        e.preventDefault();
        const isSelected = rushOrderOption.classList.contains('selected');
        const selectedTag = rushOrderOption.querySelector('.selected-tag');
        
        if (!isSelected) {
            rushOrderOption.classList.add('selected');
            rushOrderCheckbox.checked = true;
            if (selectedTag) selectedTag.style.display = 'block';
            state.rushOrder = true;
        } else {
            rushOrderOption.classList.remove('selected');
            rushOrderCheckbox.checked = false;
            if (selectedTag) selectedTag.style.display = 'none';
            state.rushOrder = false;
        }
        updatePriceDisplay();
    });
}

function toggleServiceSpecificOptions(serviceType) {
    // Show/hide instrumental enhancement for 2-track only
    const instrumentalEnhancement = document.getElementById('instrumentalEnhancement');
    if (instrumentalEnhancement) {
        instrumentalEnhancement.style.display = serviceType === 'twoTrack' ? 'block' : 'none';
    }
}

function updatePriceDisplay() {
    const totalPrice = document.getElementById('totalPrice');
    const basePrice = document.getElementById('basePrice');
    const featurePrice = document.getElementById('featurePrice');
    const discountAmount = document.getElementById('discountAmount');
    const bulkDiscountItem = document.querySelector('.breakdown-item.bulk-discount');
    
    if (!state.selectedService) {
        // Reset all prices if no service selected
        totalPrice.textContent = '0';
        basePrice.textContent = '0';
        featurePrice.textContent = '0';
        discountAmount.textContent = '0';
        bulkDiscountItem.style.display = 'none';
        return;
    }
    
    const total = calculateTotal(
        state.selectedService,
        state.songCount,
        state.vocalTrackCount,
        state.selectedFeatures,
        [], // flat fees
        state.rushOrder,
        state.stemOrgRequired,
        state.featureTrackCounts
    );

    // Guard against invalid total
    if (isNaN(total)) {
        console.error('Invalid total calculated:', {
            service: state.selectedService,
            songs: state.songCount,
            vocals: state.vocalTrackCount,
            features: state.selectedFeatures
        });
        return;
    }

    // Calculate components using imported functions
    const base = calculateBasePrice(state.selectedService, state.songCount, state.vocalTrackCount);
    const features = calculateFeaturePrice(state.selectedFeatures, state.songCount, state.featureTrackCounts);
    
    totalPrice.textContent = total.toFixed(2);
    basePrice.textContent = base.toFixed(2);
    featurePrice.textContent = features.toFixed(2);
    
    // Show/hide bulk discount if applicable
    if (state.songCount >= 5) {
        const discount = state.songCount >= 10 ? 0.20 : 0.10;
        const discountValue = (base + features) * discount;
        discountAmount.textContent = discountValue.toFixed(2);
        bulkDiscountItem.style.display = 'flex';
    } else {
        bulkDiscountItem.style.display = 'none';
    }

    // Update stem organization fee/savings
    const stemOrgPrice = document.getElementById('stemOrgPrice');
    const stemOrgSavings = document.getElementById('stemOrgSavings');
    const waivedNotice = document.querySelector('.waived-notice');
    
    const stemOrgAmount = 20 * state.songCount;
    if (state.stemPrep === 'selfPrep') {
        stemOrgPrice.textContent = '0';
        stemOrgSavings.textContent = stemOrgAmount.toFixed(2);
        waivedNotice.style.display = 'block';
    } else {
        stemOrgPrice.textContent = stemOrgAmount.toFixed(2);
        waivedNotice.style.display = 'none';
    }

    // Update feature breakdown details
    updateFeatureBreakdown();
}

function updateFeatureBreakdown() {
    const detailsContainer = document.querySelector('.feature-details-breakdown');
    if (!detailsContainer) return;

    let detailsHTML = '';
    state.selectedFeatures.forEach(feature => {
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
        } else {
            amount = CONFIG.featurePrices[feature] * state.songCount;
            calcText = `$${CONFIG.featurePrices[feature]} × ${state.songCount} songs`;
        }

        detailsHTML += `
            <div class="feature-detail-item">
                <span>${getFeatureName(feature)}</span>
                <div class="detail-right">
                    <div class="detail-calc">${calcText}</div>
                    <div class="amount">$${amount.toFixed(2)}</div>
                </div>
            </div>
        `;
    });

    detailsContainer.innerHTML = detailsHTML;
}

function getFeatureName(feature) {
    const names = {
        melodynePitchCorrection: 'Manual Pitch Correction',
        layerAlignment: 'Vocal Layer Alignment',
        artificialHarmonies: 'Artificial Harmonies',
        audioRestoration: 'Audio Restoration'
    };
    return names[feature] || feature;
}

function initializeSongSlider() {
    const songSlider = document.getElementById('songCount');
    const songOutput = songSlider.nextElementSibling;
    const sliderContainer = songSlider.parentElement;
    
    function updateSliderProgress(value) {
        // Update CSS variable for progress bar
        sliderContainer.style.setProperty('--slider-value', value);
        // Update text
        songOutput.textContent = value === '1' ? '1 song' : `${value} songs`;
        
        // Update state and price
        state.songCount = parseInt(value);
        if (state.selectedService) {
            updatePriceDisplay();
        }
    }
    
    // Initialize
    updateSliderProgress(songSlider.value);
    
    // Handle input events
    songSlider.addEventListener('input', (e) => {
        updateSliderProgress(e.target.value);
    });
    
    // Add touch/mouse drag support for the value display
    let isDragging = false;
    let startX, startLeft;
    
    songOutput.addEventListener('mousedown', startDragging);
    songOutput.addEventListener('touchstart', startDragging);
    
    function startDragging(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
        startLeft = songSlider.value;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('touchend', stopDragging);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const x = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
        const walk = (x - startX) * 0.1; // Adjust sensitivity
        let newValue = parseInt(startLeft) + Math.round(walk);
        
        // Clamp value
        newValue = Math.max(1, Math.min(20, newValue));
        songSlider.value = newValue;
        
        updateSliderProgress(newValue);
    }
    
    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchend', stopDragging);
    }
}

function initializeStemPrep() {
    const stemPrepOptions = document.querySelectorAll('input[name="stemPrep"]');
    const stemOptionCards = document.querySelectorAll('.stem-option');
    
    // Handle clicks on the entire card
    stemOptionCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const radio = card.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Trigger the change event manually
            const event = new Event('change');
            radio.dispatchEvent(event);
        });
    });
    
    stemPrepOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            state.stemPrep = e.target.value;
            state.stemOrgRequired = e.target.value === 'professionalPrep';
            
            // Update price breakdown
            const stemOrgPrice = document.getElementById('stemOrgPrice');
            const waivedNotice = document.querySelector('.waived-notice');
            
            if (state.stemPrep === 'selfPrep') {
                stemOrgPrice.textContent = '0';
                waivedNotice.style.display = 'inline';
            } else {
                stemOrgPrice.textContent = '20';
                waivedNotice.style.display = 'none';
            }
            
            updatePriceDisplay();
            
            // Automatically advance to features step
            setTimeout(() => {
                navigateToStep(2);
            }, 300); // Small delay for visual feedback
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

function initializeNavigation() {
    // Progress step navigation
    const progressSteps = document.querySelectorAll('.progress-step');
    if (progressSteps.length > 0) {
        progressSteps.forEach(step => {
            step.addEventListener('click', () => {
                const targetStep = parseInt(step.dataset.step);
                
                // Prevent navigation to features if no service selected
                if (targetStep > 0 && !state.selectedService) {
                    showError('Please select a mix type first');
                    return;
                }
                
                navigateToStep(targetStep);
            });
        });
    }
    
    const prevBtn = document.querySelector('.flow-progress .nav-btn.prev');
    const nextBtn = document.querySelector('.flow-progress .nav-btn.next');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            navigateToStep(state.currentStep - 1);
        });
        
        nextBtn.addEventListener('click', () => {
            // Prevent navigation to features if no service selected
            if (state.currentStep === 0 && !state.selectedService) {
                showError('Please select a mix type first');
                return;
            }
            navigateToStep(state.currentStep + 1);
        });
    }
}

function updateVocalFeatureAvailability(trackCount) {
    // Layer Alignment
    const layerAlignmentInput = document.querySelector('input[value="layerAlignment"]');
    if (layerAlignmentInput) {
        const layerAlignmentOption = layerAlignmentInput.closest('.feature-box');
        if (layerAlignmentOption) {
            if (trackCount <= 1) {
                layerAlignmentOption.classList.add('disabled');
                // If selected, deselect and collapse
                if (state.selectedFeatures.includes('layerAlignment')) {
                    state.selectedFeatures = state.selectedFeatures.filter(f => f !== 'layerAlignment');
                    layerAlignmentOption.classList.remove('selected', 'expanded');
                    layerAlignmentOption.querySelector('input[type="checkbox"]').checked = false;
                    const selectedTag = layerAlignmentOption.querySelector('.selected-tag');
                    if (selectedTag) selectedTag.style.display = 'none';
                    // Reset track count
                    state.featureTrackCounts.layerAlignment = 0;
                    updateFeatureTrackDisplay('layerAlignment');
                    updateFeaturePricePreview('layerAlignment');
                }
            } else {
                layerAlignmentOption.classList.remove('disabled');
            }
        }
    }

    // Pitch Correction and Harmonies
    const pitchCorrectionInput = document.querySelector('input[value="melodynePitchCorrection"]');
    const harmoniesInput = document.querySelector('input[value="artificialHarmonies"]');
    
    [pitchCorrectionInput, harmoniesInput].forEach(input => {
        if (input) {
            const option = input.closest('.feature-box');
            if (option) {
                if (trackCount === 0) {
                    option.classList.add('disabled');
                    // If selected, deselect and collapse
                    if (state.selectedFeatures.includes(input.value)) {
                        state.selectedFeatures = state.selectedFeatures.filter(f => f !== input.value);
                        option.classList.remove('selected', 'expanded');
                        option.querySelector('input[type="checkbox"]').checked = false;
                        const selectedTag = option.querySelector('.selected-tag');
                        if (selectedTag) selectedTag.style.display = 'none';
                        // Reset track count if applicable
                        if (input.value === 'melodynePitchCorrection') {
                            state.featureTrackCounts.melodynePitchCorrection = 0;
                            updateFeatureTrackDisplay('melodynePitchCorrection');
                            updateFeaturePricePreview('melodynePitchCorrection');
                        }
                    }
                } else {
                    option.classList.remove('disabled');
                }
            }
        }
    });
    
    updatePriceDisplay();
}

function initializeFeatureCounters() {
    const featureCounters = document.querySelectorAll('.feature-track-counter');
    
    featureCounters.forEach(counter => {
        const buttons = counter.querySelectorAll('.counter-btn');
        const feature = buttons[0]?.dataset.feature;
        if (!feature) return;
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent feature box toggle
                const action = btn.dataset.action;
                const currentValue = state.featureTrackCounts[feature] || 0;
                let newValue;
                
                if (action === 'increase' && currentValue < state.vocalTrackCount) {
                    newValue = currentValue + 1;
                } else if (action === 'decrease' && currentValue > 0) {
                    newValue = currentValue - 1;
                } else {
                    newValue = currentValue;
                }

                // Check if new value would make the feature invalid
                if ((feature === 'melodynePitchCorrection' && newValue === 0) ||
                    (feature === 'layerAlignment' && newValue <= 1)) {
                    // Find and deselect the feature box
                    const featureBox = btn.closest('.feature-box');
                    if (featureBox) {
                        state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                        featureBox.classList.remove('selected', 'expanded');
                        featureBox.querySelector('input[type="checkbox"]').checked = false;
                        const selectedTag = featureBox.querySelector('.selected-tag');
                        if (selectedTag) selectedTag.style.display = 'none';
                    }
                }

                state.featureTrackCounts[feature] = newValue;
                
                // Ensure minimum of 2 tracks for layer alignment when selected
                if (feature === 'layerAlignment' && state.selectedFeatures.includes(feature)) {
                    state.featureTrackCounts[feature] = Math.max(2, state.featureTrackCounts[feature]);
                }
                
                console.log(`Updated ${feature} count:`, state.featureTrackCounts[feature]);
                
                updateFeatureTrackDisplay(feature);
                updateFeaturePricePreview(feature);
                updatePriceDisplay();
            });
        });
    });
}

function updateFeatureTrackDisplay(feature) {
    if (feature === 'layerAlignment') {
        const totalCount = state.featureTrackCounts[feature];
        const alignedCount = Math.max(0, totalCount - 1);
        
        // Update the aligned tracks count
        const alignedDisplay = document.getElementById('layerAlignmentCount');
        if (alignedDisplay) {
            alignedDisplay.textContent = alignedCount;
        }
        
        // Update total tracks display
        const totalDisplay = document.getElementById('layerAlignmentTotal');
        if (totalDisplay) {
            totalDisplay.textContent = totalCount;
        }
    } else {
        // Handle other features normally
        const countDisplay = document.getElementById(`${feature}Count`);
        if (countDisplay) {
            countDisplay.textContent = state.featureTrackCounts[feature];
        }
    }
}

function updateFeaturePricePreview(feature) {
    const featureBox = document.querySelector(`input[value="${feature}"]`)?.closest('.feature-box');
    if (!featureBox) return; // Guard against null
    
    const pricePreview = featureBox.querySelector('.feature-total');
    if (pricePreview) {
        let total = 0;
        if (feature === 'layerAlignment') {
            const alignedTracks = Math.max(0, state.featureTrackCounts[feature] - 1);
            total = alignedTracks * CONFIG.featurePrices[feature] * state.songCount;
        } else {
            const trackCount = state.featureTrackCounts[feature];
            total = trackCount * CONFIG.featurePrices[feature] * state.songCount;
        }
        pricePreview.textContent = total.toFixed(2);
    }
}

function syncFeatureTracksWithMain() {
    const mainCount = state.vocalTrackCount;
    
    Object.keys(state.featureTrackCounts).forEach(feature => {
        const featureBox = document.querySelector(`input[value="${feature}"]`)?.closest('.feature-box');
        if (!featureBox) return;

        if (feature === 'layerAlignment') {
            if (mainCount <= 1) {
                // Deselect and collapse if track count becomes invalid
                if (state.selectedFeatures.includes(feature)) {
                    state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                    featureBox.classList.remove('selected', 'expanded');
                    featureBox.querySelector('input[type="checkbox"]').checked = false;
                    const selectedTag = featureBox.querySelector('.selected-tag');
                    if (selectedTag) selectedTag.style.display = 'none';
                    state.featureTrackCounts[feature] = 0;
                }
            } else if (state.selectedFeatures.includes(feature)) {
                // Auto-update track count to match main count
                state.featureTrackCounts[feature] = Math.max(2, mainCount);
            }
        } else if (feature === 'melodynePitchCorrection') {
            if (mainCount === 0) {
                // Deselect and collapse if track count becomes zero
                if (state.selectedFeatures.includes(feature)) {
                    state.selectedFeatures = state.selectedFeatures.filter(f => f !== feature);
                    featureBox.classList.remove('selected', 'expanded');
                    featureBox.querySelector('input[type="checkbox"]').checked = false;
                    const selectedTag = featureBox.querySelector('.selected-tag');
                    if (selectedTag) selectedTag.style.display = 'none';
                    state.featureTrackCounts[feature] = 0;
                }
            } else if (state.selectedFeatures.includes(feature)) {
                // Auto-update track count to match main count
                state.featureTrackCounts[feature] = mainCount;
            }
        }
        
        updateFeatureTrackDisplay(feature);
        updateFeaturePricePreview(feature);
    });
    
    updatePriceDisplay();
}