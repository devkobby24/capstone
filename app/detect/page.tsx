"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { saveUserScan } from "@/lib/firestore";
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
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "sonner";

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

export default function DetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  // // Move useEffect here - BEFORE any conditional returns
  // useEffect(() => {
  //   console.log("Firebase app:", db);
  //   console.log("Environment variables:");
  //   console.log(
  //     "API Key:",
  //     process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Missing"
  //   );
  //   console.log(
  //     "Project ID:",
  //     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Missing"
  //   );
  // }, []);

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
    // Check if user is loaded and authenticated
    if (!isLoaded) {
      setError("Please wait, loading user information...");
      return;
    }

    if (!user) {
      setError("You must be signed in to analyze files");
      return;
    }

    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {

      // Call your backend API
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Backend error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // console.log("Received results from backend:", data);

      // Validate backend response structure
      if (!data || typeof data.anomaly_rate === "undefined") {
        throw new Error("Invalid response from backend");
      }

      setResults(data);

      // Save to Firestore
      try {
        const riskLevel = calculateRiskLevel(data.anomaly_rate);
        await saveUserScan({
          userId: user.id, // Clerk user ID
          filename: file.name,
          uploadDate: new Date(),
          results: {
            total_records: data.total_records || 0,
            anomalies_detected: data.anomalies_detected || 0,
            normal_records: data.normal_records || 0,
            anomaly_rate: data.anomaly_rate || 0,
            anomaly_scores: data.anomaly_scores || [],
            processing_time: data.processing_time || 0,
          },
          riskLevel,
          status: "completed",
        });

        toast("Scan results saved successfully");
      } catch (firestoreError) {
        toast("Failed to save scan results");
        // console.warn("Results displayed but not saved to history");
      }
    } catch (err) {
      toast("An error occurred during analysis");
      setError(
        err instanceof Error ? err.message : "An error occurred during analysis"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const calculateRiskLevel = (
    anomalyRate: number
  ): "Low" | "Medium" | "High" => {
    if (anomalyRate > 20) return "High";
    if (anomalyRate > 10) return "Medium";
    return "Low";
  };

  // Show loading state if user data isn't loaded yet
  if (!isLoaded) {
    return (
      <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <Header />
        <main className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <Header />
        <main className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please sign in to access the anomaly detection feature.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  // In your detect page, update the anomaly scores chart data:
  const anomalyScoresData = {
    labels: results?.results?.anomaly_scores_summary
      ? ["Min Score", "Average Score", "Max Score"]
      : [],
    datasets: [
      {
        label: "Anomaly Score Statistics",
        data: results?.results?.anomaly_scores_summary
          ? [
              results.results.anomaly_scores_summary.min,
              results.results.anomaly_scores_summary.avg,
              results.results.anomaly_scores_summary.max,
            ]
          : [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
    ],
  };

  return (
    <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full">
        <div className="text-center mb-8 max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Anomaly Detection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Upload your network traffic dataset to start the analysis and detect
            potential anomalies.
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Analyzing..." : "Analyze Dataset"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg max-w-2xl">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {results && (
            <div className="w-full flex flex-col max-w-5xl space-y-8 mt-8">
              <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold">
                    {results.total_records || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Anomalies Detected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {results.anomalies_detected || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">Normal Records</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.normal_records || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6">
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

                {/* New section for anomaly score statistics */}
                {/* <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Anomaly Score Statistics
                  </h3>
                  <Bar
                    data={anomalyScoresData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                      },
                    }}
                  />
                </div> */}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
