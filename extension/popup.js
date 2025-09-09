// Cross-browser compatibility (works on both Chrome and Edge)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

let requestCount = 0;
let threatCount = 0;

function updateStats() {
    document.getElementById('requests-scanned').textContent = requestCount;
    document.getElementById('threats-detected').textContent = threatCount;
}

function updateThreatLevel(level) {
    const threatLevelSpan = document.querySelector('.threat-level');
    const threatCard = document.querySelector('.status-card:last-of-type .status-description');

    // Remove existing threat level classes
    threatLevelSpan.classList.remove('threat-low', 'threat-medium', 'threat-high');

    switch (level) {
        case 'high':
            threatLevelSpan.classList.add('threat-high');
            threatLevelSpan.textContent = 'High';
            threatCard.textContent = '🚨 High-severity threats detected! Exercise extreme caution.';
            break;
        case 'medium':
            threatLevelSpan.classList.add('threat-medium');
            threatLevelSpan.textContent = 'Medium';
            threatCard.textContent = '⚠️ Moderate threats detected. Please verify website authenticity.';
            break;
        default:
            threatLevelSpan.classList.add('threat-low');
            threatLevelSpan.textContent = 'Low';
            // Dynamic message based on actual threat count
            if (threatCount > 0) {
                threatCard.textContent = `✅ ${threatCount} threat(s) previously detected. Currently monitoring safely.`;
            } else {
                threatCard.textContent = '✅ No anomalies detected in recent network activity.';
            }
    }
}

function showThreatAlert(keyword, threatLevel, url) {
    const alertCard = document.getElementById('alert-card');
    const normalCard = document.getElementById('normal-card');
    const alertKeyword = document.getElementById('alert-keyword');

    // Show alert card and hide normal card
    alertCard.style.display = 'block';
    alertCard.classList.add('alert-card');
    normalCard.style.display = 'none';

    // Truncate URL if too long to prevent overflow
    let displayUrl = url;
    if (displayUrl.length > 50) {
        displayUrl = displayUrl.substring(0, 47) + '...';
    }

    // Update alert content with proper styling to prevent overflow
    alertKeyword.innerHTML = `
        <strong>🚨 Threat:</strong> "${keyword}" detected<br>
        <small style="word-break: break-all; line-height: 1.3; display: block; margin-top: 4px;">
            URL: ${displayUrl}
        </small>
    `;

    // Update threat level in the main card
    updateThreatLevel(threatLevel);

    // Increment threat counter and save to storage
    incrementThreatCounter();
}

function hideThreatAlert() {
    const alertCard = document.getElementById('alert-card');
    const normalCard = document.getElementById('normal-card');

    alertCard.style.display = 'none';
    normalCard.style.display = 'block';

    // Reset to low threat level
    updateThreatLevel('low');
}

function checkCurrentThreatStatus() {
    browserAPI.storage.local.get(null, (result) => {
        console.log('All stored data:', result);

        // Get current tab to check if we're on a malicious site right now
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const currentUrl = tabs[0].url.toLowerCase();
                const suspiciousKeywords = ["malware", "phishing", "bad-site", "suspicious", "attack", "virus", "trojan", "scam", "fraud", "hack"];

                let currentThreat = false;
                let currentKeyword = "";
                let currentThreatLevel = "low";

                // Check if current tab has threats
                for (const keyword of suspiciousKeywords) {
                    if (currentUrl.includes(keyword)) {
                        currentThreat = true;
                        currentKeyword = keyword;
                        currentThreatLevel = ["malware", "virus", "trojan", "hack"].includes(keyword) ? "high" :
                            ["phishing", "scam", "fraud"].includes(keyword) ? "medium" : "low";
                        break;
                    }
                }

                // Update display based on current status
                if (currentThreat) {
                    showThreatAlert(currentKeyword, currentThreatLevel, tabs[0].url);
                    // Store current threat for persistence
                    browserAPI.storage.local.set({
                        isMalicious: true,
                        matchedKeyword: currentKeyword,
                        threatLevel: currentThreatLevel,
                        lastCheckedUrl: tabs[0].url,
                        lastCheckTime: new Date().toISOString()
                    });
                } else if (result.isMalicious && result.lastCheckedUrl) {
                    // Show alert for recently detected threat
                    showThreatAlert(
                        result.matchedKeyword || 'Unknown',
                        result.threatLevel || 'medium',
                        result.lastCheckedUrl || 'Unknown URL'
                    );
                } else {
                    hideThreatAlert();
                }

                // Update counters with real data
                updateCountersFromStorage(result);
            }
        });
    });
}

function updateCountersFromStorage(storageData) {
    // Use stored counters or initialize to 0
    threatCount = storageData.totalThreatsDetected || 0;
    requestCount = storageData.totalRequestsScanned || 0;

    updateStats();
}

function incrementThreatCounter() {
    browserAPI.storage.local.get(['totalThreatsDetected'], (result) => {
        const newCount = (result.totalThreatsDetected || 0) + 1;
        browserAPI.storage.local.set({ totalThreatsDetected: newCount });
        threatCount = newCount;
        updateStats();
    });
}

function incrementRequestCounter() {
    browserAPI.storage.local.get(['totalRequestsScanned'], (result) => {
        const newCount = (result.totalRequestsScanned || 0) + 1;
        browserAPI.storage.local.set({ totalRequestsScanned: newCount });
        requestCount = newCount;
        updateStats();
    });
}

// Listen for storage changes (real-time updates when user navigates)
browserAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);

        // Update counters if they changed
        if (changes.totalRequestsScanned) {
            requestCount = changes.totalRequestsScanned.newValue || 0;
        }
        if (changes.totalThreatsDetected) {
            threatCount = changes.totalThreatsDetected.newValue || 0;
        }

        // Update threat status if it changed
        if (changes.isMalicious || changes.matchedKeyword || changes.threatLevel || changes.currentTabThreat) {
            setTimeout(checkCurrentThreatStatus, 100); // Small delay to ensure all changes are stored
        }

        updateStats();
    }
});

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dashboard-btn').addEventListener('click', (e) => {
        e.preventDefault();
        browserAPI.tabs.create({ url: 'https://intruscan.vercel.app/dashboard' });
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        // Clear current threats and reset stats
        browserAPI.storage.local.clear();
        hideThreatAlert();
        threatCount = 0;
        requestCount = 0;

        // Clear badge on current tab
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                browserAPI.action.setBadgeText({
                    text: '',
                    tabId: tabs[0].id
                });
            }
        });

        updateStats();
        alert('🔄 Extension reset! Navigate to a URL containing "malware", "phishing", "virus", "scam", etc. to test threat detection.');
    });

    // Simulate ongoing activity counter and save to storage
    setInterval(() => {
        browserAPI.storage.local.get(['isMalicious'], (result) => {
            if (!result.isMalicious) {
                incrementRequestCounter();
            }
        });
    }, 4000);

    // Initial load - check current status
    checkCurrentThreatStatus();
});
