"use client";

import { useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import Header from "./components/Header";
import Footer from "./components/Footer";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResults(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResults(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Sending file to backend:", file.name);
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze file");
      }

      const data = await response.json();
      console.log("Received results from backend:", data);
      setResults(data);
    } catch (err) {
      console.error("Error during file upload:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  // Prepare chart data
  const distributionData = {
    labels: ["Normal Traffic", "Anomalous Traffic"],
    datasets: [
      {
        label: "Traffic Distribution",
        data: results
          ? [results.normal_records, results.anomalies_detected]
          : [0, 0],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"],
        borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderWidth: 1,
      },
    ],
  };

  const anomalyScoresData = {
    labels: results
      ? Array.from({ length: results.anomaly_scores.length }, (_, i) => i + 1)
      : [],
    datasets: [
      {
        label: "Anomaly Scores",
        data: results ? results.anomaly_scores : [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const featureImportanceData = {
    labels: results ? Object.keys(results.feature_importance) : [],
    datasets: [
      {
        label: "Feature Importance",
        data: results ? Object.values(results.feature_importance) : [],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full ">
        <div className="text-center mb-8 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Network Anomaly Detection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Upload your network traffic datasets and leverage our advanced model
            to detect and predict anomalies with high accuracy.
          </p>
        </div>

        <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Dataset</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors w-full max-w-5xl"
          >
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium">
                {file ? file.name : "Drag and drop your dataset here"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                or
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.pcap"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors cursor-pointer"
              >
                Browse Files
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Supported formats: CSV, PCAP
              </p>
            </div>
          </div>

          {file && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors disabled:opacity-50"
              >
                {isUploading ? "Analyzing..." : "Analyze Dataset"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {results && (
            <div className="w-full flex flex-col max-w-5xl space-y-8">
              <div className="grid grid-cols-2 text-center gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold">{results.total_records}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Anomalies Detected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {results.anomalies_detected}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Normal Records</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.normal_records}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Anomaly Rate</p>
                  <p className="text-2xl font-bold">
                    {results.anomaly_rate
                      ? results.anomaly_rate.toFixed(2)
                      : "0.00"}
                    %
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Traffic Distribution
                  </h3>
                  <Bar
                    data={distributionData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                      },
                    }}
                  />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Anomaly Scores Over Time
                  </h3>
                  <Line
                    data={anomalyScoresData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>

                {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4">Feature Importance</h3>
                  <div className="h-96">
                    <Bar 
                      data={featureImportanceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div> */}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-7xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">How It Works</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced anomaly detection model analyzes network traffic
              patterns to identify potential security threats in real-time. The
              model uses machine learning to detect unusual patterns and
              behaviors in your network data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Supported Datasets</h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
              <li className="mb-2">Network traffic CSV files</li>
              <li className="mb-2">PCAP files</li>
              <li className="mb-2">Custom network capture files</li>
              <li>Standard network traffic datasets</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
