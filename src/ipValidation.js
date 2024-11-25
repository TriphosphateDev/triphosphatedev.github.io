import { trackIPCheck } from '../src/monitoring.js';
import { config } from '../src/config.js';

console.log('Loading ipValidation module...');

export async function getUserIP() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
}

export async function validateIP(ip) {
    // Simplified validation that maintains our logging
    console.log('🔄 Starting IP validation for:', ip);
    
    try {
        // Basic validation result
        const result = {
            isValid: true,
            fraudScore: 0,
            isProxy: false,
            isVpn: false,
            provider: "Pending Cloudflare Integration"
        };

        // Keep tracking for analytics
        trackIPCheck(result);
        console.log('Validation result:', result);

        return result;
    } catch (error) {
        console.error('Error in validateIP:', error);
        return {
            isValid: true,
            fraudScore: 0,
            isProxy: false,
            isVpn: false,
            provider: "Error (Cloudflare Pending)"
        };
    }
}

export async function initializeSecurityButton(buttonId, defaultDestination) {
    try {
        console.log('🔍 Starting security button initialization...');
        
        // Create button with default behavior
        createButton(buttonId, defaultDestination);
        return true;
    } catch (error) {
        console.error('❌ Security initialization error:', error);
        createButton(buttonId, defaultDestination);
        return false;
    }
}

function createButton(buttonId, destination) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error('Button element not found:', buttonId);
        return;
    }
    
    // Clear any existing countdown
    if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
        window.countdownTimer = null;
    }
    
    console.log('🔄 Creating button with destination:', destination);
    
    // Update button properties
    setTimeout(() => {
        button.className = 'btn';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.disabled = false;
        button.textContent = 'Get Your Free Consultation';
        
        button.onclick = (e) => {
            e.preventDefault();
            window.location.href = destination;
        };
    }, 500);
}

// Maintain existing exports for compatibility
export async function validateIPWithCache(ip) {
    return await validateIP(ip);
}

export async function validateIPAndRedirect() {
    try {
        const ip = await getUserIP();
        const validation = await validateIP(ip);
        return true;
    } catch (error) {
        console.error('❌ IP validation error:', error);
        return false;
    }
} 