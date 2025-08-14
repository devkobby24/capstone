// This script runs in the background and handles network requests.

// The URL for your backend analysis endpoint
const ANALYSIS_API_URL = "http://127.0.0.1:8000/api/extension-analyze";

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // We only want to analyze main frame requests for now to avoid noise.
    if (details.type === "main_frame") {
      console.log("Intercepted main frame request:", details);

      // Send the request details to the backend for analysis
      fetch(ANALYSIS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // We can send more details if the model supports them
        body: JSON.stringify({
          url: details.url,
          method: details.method,
          timeStamp: details.timeStamp
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Analysis result:', data);
        if (data.status === 'anomaly') {
          // If an anomaly is detected, create a notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Security Alert: Anomaly Detected',
            message: `A potential threat was detected from: ${data.url}. Reason: ${data.reason}`,
            priority: 2
          });
        }
      })
      .catch(error => {
        console.error('Error sending data for analysis:', error);
      });
    }
  },
  {urls: ["<all_urls>"]}, // Intercept all URLs
  [] // No blocking, just monitoring
);
