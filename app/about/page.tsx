"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About intruScan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Advanced network security solution powered by machine learning
          </p>
        </div>

        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-300">
                intruScan is dedicated to providing cutting-edge network
                security solutions that help organizations protect their digital
                assets from emerging threats. Our advanced anomaly detection
                system uses machine learning to identify potential security
                breaches before they can cause harm.
              </p>
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Real-time network traffic analysis</li>
                <li>Advanced anomaly detection using machine learning</li>
                <li>Comprehensive traffic visualization</li>
                <li>Detailed feature importance analysis</li>
                <li>Support for multiple data formats (CSV, PCAP)</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Frontend</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Built with Next.js, React, and Chart.js for powerful data
                    visualization
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Backend</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Python-based machine learning engine for accurate anomaly
                    detection
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Security</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    State-of-the-art encryption and secure data handling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Why Choose intruScan?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Advanced Security</h3>
              <p className="text-gray-600 dark:text-gray-300">
                State-of-the-art machine learning algorithms for threat
                detection
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Real-time Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Instant detection and response to network anomalies
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Detailed Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive visualization and analysis tools
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
