
// Cross-browser compatibility: Use chrome APIs (Edge supports them)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// List of suspicious keywords for demo
const SUSPICIOUS_KEYWORDS = [
  "malware", "phishing", "bad-site", "suspicious", "attack", "virus", "trojan",
  "scam", "fraud", "hack", "steal", "password", "banking-fake", "paypal-fake",
  "microsoft-fake", "google-fake", "login-steal", "credential", "exploit"
];

// Function to check URL for malicious content
function checkUrlForThreats(url) {
  const lowerUrl = url.toLowerCase();
  let detected = false;
  let matched = "";
  let threatLevel = "low";
  
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerUrl.includes(keyword)) {
      detected = true;
      matched = keyword;
      // Set threat level based on keyword severity
      if (["malware", "virus", "trojan", "hack", "steal"].includes(keyword)) {
        threatLevel = "high";
      } else if (["phishing", "scam", "fraud", "fake"].includes(keyword)) {
        threatLevel = "medium";
      }
      break;
    }
  }
  
  return { detected, matched, threatLevel };
}

// Function to update counters in storage
function updateCounters(threatDetected = false) {
  browserAPI.storage.local.get(['totalRequestsScanned', 'totalThreatsDetected'], (result) => {
    const newRequestCount = (result.totalRequestsScanned || 0) + 1;
    const newThreatCount = (result.totalThreatsDetected || 0) + (threatDetected ? 1 : 0);
    
    browserAPI.storage.local.set({
      totalRequestsScanned: newRequestCount,
      totalThreatsDetected: newThreatCount
    });
  });
}

// Listen for tab updates (URL changes) - Works on both Chrome and Edge
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const url = changeInfo.url;
    const threatInfo = checkUrlForThreats(url);
    
    // Update counters
    updateCounters(threatInfo.detected);
    
    // Store detection status in storage (works on both browsers)
    browserAPI.storage.local.set({
      lastCheckedUrl: url,
      isMalicious: threatInfo.detected,
      matchedKeyword: threatInfo.matched,
      threatLevel: threatInfo.threatLevel,
      lastCheckTime: new Date().toISOString(),
      tabId: tabId,
      currentTabUrl: url
    });
    
    if (threatInfo.detected) {
      // Show notification (works on both Chrome and Edge)
      browserAPI.notifications.create({
        type: 'basic',
        title: 'IntruScan Security Alert',
        message: `Malicious URL detected! Threat: "${threatInfo.matched}" - Level: ${threatInfo.threatLevel.toUpperCase()}`,
        priority: 2
      });
      
      // Set badge with threat indicator
      browserAPI.action.setBadgeText({
        text: '!',
        tabId: tabId
      });
      
      browserAPI.action.setBadgeBackgroundColor({
        color: threatInfo.threatLevel === 'high' ? '#dc2626' : 
               threatInfo.threatLevel === 'medium' ? '#f59e0b' : '#ef4444'
      });
    } else {
      // Clear badge if no threat
      browserAPI.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }
});

// Listen for tab activation (when user switches tabs)
browserAPI.tabs.onActivated.addListener((activeInfo) => {
  browserAPI.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      const threatInfo = checkUrlForThreats(tab.url);
      
      // Update current tab info and set badge accordingly
      browserAPI.storage.local.set({
        currentTabUrl: tab.url,
        currentTabThreat: threatInfo.detected,
        currentThreatLevel: threatInfo.threatLevel,
        isMalicious: threatInfo.detected,
        matchedKeyword: threatInfo.matched,
        threatLevel: threatInfo.threatLevel,
        lastCheckedUrl: tab.url,
        lastCheckTime: new Date().toISOString()
      });
      
      // Update badge for current tab
      if (threatInfo.detected) {
        browserAPI.action.setBadgeText({
          text: '!',
          tabId: activeInfo.tabId
        });
        
        browserAPI.action.setBadgeBackgroundColor({
          color: threatInfo.threatLevel === 'high' ? '#dc2626' : 
                 threatInfo.threatLevel === 'medium' ? '#f59e0b' : '#ef4444'
        });
      } else {
        browserAPI.action.setBadgeText({
          text: '',
          tabId: activeInfo.tabId
        });
      }
    }
  });
});
