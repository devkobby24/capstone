// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
  GoogleGenAI,
} from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    thinkingConfig: {
      thinkingBudget: 0,
    },
    responseMimeType: 'text/plain',
  };
  const model = 'gemini-2.5-flash';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Analyze this network security scan and provide brief, actionable recommendations:

SCAN RESULTS:
• Total Traffic: 2,520,751 records analyzed
• Threat Level: HIGH (27.7% anomaly rate)
• Anomalies Detected: 698,715 incidents

ATTACK BREAKDOWN:
• Brute Force Attacks: 318,087 (45% of threats) - CRITICAL
• Infiltration Attempts: 134,107 (19% of threats) - HIGH
• DoS/DDoS Attacks: 114,319 (16% of threats) - HIGH  
• Heartbleed Exploits: 45,100 (6% of threats) - MEDIUM
• Bot Attacks: 52,833 (8% of threats) - MEDIUM
• Web Attacks: 34,268 (5% of threats) - MEDIUM
• Port Scans: 1 instance - LOW

IMMEDIATE ACTIONS NEEDED:
1. What should be done RIGHT NOW to address the 45% brute force attack volume?
2. How can we stop the infiltration attempts immediately?
3. What DDoS mitigation should be implemented?

PREVENTION STRATEGY:
4. What specific security controls prevent these attack types?
5. What monitoring should be enhanced?
6. What is the recommended incident response plan?

Provide concise, prioritized recommendations for a network security team to implement within 24-48 hours.`,
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: `This network scan indicates a significant and immediate threat. Here's a concise, prioritized plan:

## Analysis Summary:
* **Critical Threat Level:** 27.7% anomaly rate and nearly 700k incidents is extremely high.
* **Brute Force Dominance:** 45% of threats are brute force, indicating widespread credential compromise attempts. This is the top priority.
* **Diverse Attacks:** Infiltration, DoS/DDoS, and Heartbleed are also significant, showing multiple attack vectors.
* **Urgency:** The volume and nature of attacks demand immediate and decisive action.

## Brief, Actionable Recommendations:

### IMMEDIATE ACTIONS NEEDED (Within 0-4 Hours)

1.  **Brute Force Attacks (45%):**
    *   **Action:** Implement **Account Lockout Policies** for all critical systems (e.g., after 3-5 failed attempts). Immediately enable **Multi-Factor Authentication (MFA)** on all external-facing services, VPNs, and critical internal systems (starting with admin accounts).
    *   **Right Now:** Block IP addresses showing excessive failed login attempts. Reset passwords for high-privilege accounts and accounts showing suspicious login activity.
2.  **Infiltration Attempts (19%):**
    *   **Action:** Disconnect or isolate any systems showing signs of successful infiltration. Block all outbound connections from compromised internal IPs, except for necessary security tools.
    *   **Immediately:** Isolate/quarantine any identified compromised hosts or user accounts. Review firewall logs for suspicious outbound connections and block immediately.
3.  **DoS/DDoS Attacks (16%):**
    *   **Action:** Engage **ISP/Cloud Provider DDoS Mitigation services**. If not already using, enable and configure **Rate Limiting** on firewalls, web application firewalls (WAFs), and load balancers to critical services (e.g., limit connections per IP, requests per second).
    *   **Right Now:** Verify all public-facing services have adequate capacity.

### PREVENTION STRATEGY (Within 24-48 Hours)

4.  **Specific Security Controls to Prevent Attack Types:**
    *   **Brute Force:** Strong, unique passwords enforced; MFA (all users, all systems); Account Lockout Policies; CAPTCHA on login pages; IP whitelisting for admin access; honeypots for login forms.
    *   **Infiltration:** Network Segmentation (VLANs, micro-segmentation); Principle of Least Privilege; Endpoint Detection and Response (EDR); Application Whitelisting; Regular Vulnerability Scanning & Patch Management (especially for Heartbleed).
    *   **DoS/DDoS:** DDoS mitigation services (cloud-based always-on preferred); WAFs; Rate Limiting; Geoblocking if applicable; CDN usage.
    *   **Heartbleed:** Ensure all SSL/TLS-enabled services are patched (OpenSSL); Disable vulnerable versions of SSL/TLS.
    *   **Web Attacks:** Web Application Firewall (WAF); Input Validation; Secure Coding Practices (OWASP Top 10); Regular Web Application Penetration Testing.
    *   **Bot/Port Scans:** Intrusion Prevention System (IPS) rules; Firewall rules to block known malicious IPs/ranges; Network Access Control (NAC).
5.  **Enhanced Monitoring:**
    *   **Prioritize:** Centralized Security Information and Event Management (SIEM) system for real-time analysis of logs (firewall, authentication, application, VPN, DNS).
    *   **Specifics:**
        *   **Login Success/Failures:** Alert on high failed login attempts from single IPs/users, successful logins from unusual locations/times, and rapid changes in user activity.
        *   **Network Flow Data (NetFlow/IPFIX):** Identify unusual traffic patterns, large data transfers, or connections to suspicious external IPs.
        *   **System & Application Logs:** Look for unauthorized access attempts, configuration changes, and abnormal process execution.
        *   **WAF/IPS Alerts:** Monitor closely for active blocks and attempts.
        *   **Threat Intelligence Feeds:** Integrate and automate blocking of known malicious IPs.
6.  **Recommended Incident Response Plan:**
    *   **Develop/Refine:** Establish a clear, documented Incident Response Plan (IRP) with defined roles, responsibilities, and communication channels.
    *   **Key Stages:**
        *   **Preparation:** Regular backups, IR team training, pre-defined communication trees.
        *   **Identification:** Enhanced monitoring, alert triage.
        *   **Containment:** Isolate compromised systems, block attacker access.
        *   **Eradication:** Remove root causes (malware, vulnerabilities), apply patches.
        *   **Recovery:** Restore systems from clean backups, verify functionality.
        *   **Post-Incident Activity:** Lessons learned, report generation, process improvements.
    *   **Immediate Focus:** Ensure the IR team is activated and understands the current priorities (Brute Force, Infiltration, DDoS).
    *   **Communication:** Establish clear internal and, if necessary, external communication protocols.

This plan addresses the immediate threats while building a more resilient security posture to prevent future attacks. Communication and coordination among the security team are paramount during this critical period.`,
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          text: `INSERT_INPUT_HERE`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let fileIndex = 0;
  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();
