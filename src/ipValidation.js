export async function validateIP(ip) {
    const API_KEY = 'EdSmKQnDEO37q2o2TLzpG5y8ilpQ94ZB';
    const response = await fetch(
        `https://www.ipqualityscore.com/api/json/ip/${API_KEY}/${ip}`
    );
    const data = await response.json();
    
    return {
        isValid: data.fraud_score < 75 && !data.proxy && !data.vpn,
        fraudScore: data.fraud_score,
        isProxy: data.proxy,
        isVpn: data.vpn
    };
} 