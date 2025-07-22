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

interface ClassDistribution {
  [key: string]: number;
}

export default function DetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const { user, isLoaded } = useUser();

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
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);
    setResults(null);
    setAiAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("🔍 Frontend: Making request to /api/analyze");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      console.log("🔍 Frontend: Response status:", response.status);

      if (!response.ok) {
        throw new Error(
          `Backend error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setResults(data);

      // Generate AI analysis
      setIsGeneratingAI(true);
      try {
        console.log("🔍 Generating AI analysis...");

        const aiResponse = await fetch("/api/ai-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scanResults: data }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          setAiAnalysis(aiData.analysis);
          console.log("🔍 AI analysis generated successfully");

          // Save scan with AI analysis
          try {
            const riskLevel = calculateRiskLevel(data.anomaly_rate);

            const saveData = {
              userId: user.id,
              filename: file.name,
              uploadDate: new Date(),
              results: {
                anomaly_scores: data.results?.anomaly_scores || [],
                total_records: data.total_records || 0,
                anomalies_detected: data.anomalies_detected || 0,
                normal_records: data.normal_records || 0,
                anomaly_rate: data.anomaly_rate || 0,
                processing_time: data.processing_time || 0,
                anomaly_scores_summary:
                  data.results?.anomaly_scores_summary || {},
                class_distribution: data.results?.class_distribution || {},
              },
              riskLevel,
              status: "completed" as const,
              aiAnalysis: {
                analysis: aiData.analysis,
                prompt: aiData.prompt,
                generatedAt: new Date(),
              },
            };

            await saveUserScan(saveData);
            toast("Scan results and AI analysis saved successfully");
          } catch (firestoreError) {
            console.error("🔍 Firestore error:", firestoreError);
            toast("Scan completed but failed to save results");
          }
        } else {
          console.error("🔍 AI analysis failed");
          toast("Scan completed but AI analysis failed");

          // Save scan without AI analysis
          const riskLevel = calculateRiskLevel(data.anomaly_rate);
          const saveData = {
            userId: user.id,
            filename: file.name,
            uploadDate: new Date(),
            results: {
              anomaly_scores: data.results?.anomaly_scores || [],
              total_records: data.total_records || 0,
              anomalies_detected: data.anomalies_detected || 0,
              normal_records: data.normal_records || 0,
              anomaly_rate: data.anomaly_rate || 0,
              processing_time: data.processing_time || 0,
              anomaly_scores_summary:
                data.results?.anomaly_scores_summary || {},
              class_distribution: data.results?.class_distribution || {},
            },
            riskLevel,
            status: "completed" as const,
          };

          await saveUserScan(saveData);
          toast("Scan results saved successfully");
        }
      } catch (aiError) {
        console.error("🔍 AI generation error:", aiError);
        toast("Scan completed but AI analysis failed");
      } finally {
        setIsGeneratingAI(false);
      }
    } catch (err) {
      console.error("🔍 Frontend: Upload error:", err);
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

  const getClassLabel = (classKey: string): string => {
    const labels: { [key: string]: string } = {
      class_0: "Normal Traffic",
      class_1: "DoS/DDoS Attack", // 114,319 instances
      class_2: "Port Scan", // 1 instance
      class_3: "Bot Attack", // 52,833 instances
      class_4: "Infiltration", // 134,107 instances
      class_5: "Web Attack", // 34,268 instances
      class_6: "Brute Force", // 318,087 instances (highest!)
      class_7: "Heartbleed", // 45,100 instances
      class_8: "SQL Injection", // 0 instances (unused)
    };
    return labels[classKey] || classKey;
  };

  const getClassColor = (classKey: string): string => {
    const colors: { [key: string]: string } = {
      class_0: "#22c55e", // Green - Normal
      class_1: "#ef4444", // Red - DoS/DDoS
      class_2: "#f97316", // Orange - Port Scan
      class_3: "#eab308", // Yellow - Bot
      class_4: "#a855f7", // Purple - Infiltration
      class_5: "#ec4899", // Pink - Web Attack
      class_6: "#06b6d4", // Cyan - Brute Force
      class_7: "#be123c", // Rose - Heartbleed (critical vulnerability)
      class_8: "#8b5cf6", // Violet - SQL Injection
    };
    return colors[classKey] || "#6b7280";
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getClassDistributionChartData = (
    classDistribution: ClassDistribution
  ) => {
    const labels = Object.keys(classDistribution).map((key) =>
      getClassLabel(key)
    );
    const data = Object.values(classDistribution);
    const colors = Object.keys(classDistribution).map((key) =>
      getClassColor(key)
    );

    return {
      labels,
      datasets: [
        {
          label: "Attack Types",
          data,
          backgroundColor: colors.map((color) => color + "80"),
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  };

  // Show loading state if user data isn't loaded yet
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-140px)]">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4">
          <div className="text-center max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Anomaly Detection
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Upload your network traffic dataset to start the analysis and detect
            potential anomalies.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 lg:p-8 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">
            Upload Your Dataset
          </h2>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-12 h-12 md:w-16 md:h-16 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-base md:text-lg font-medium mb-2 px-4">
                {file ? file.name : "Drag and drop your dataset here"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.pcap"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-2 rounded-full transition-colors cursor-pointer text-sm md:text-base"
              >
                Browse Files
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Supported formats: CSV, PCAP
              </p>
            </div>
          </div>

          {/* Upload Button and Status */}
          {file && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isUploading ? "Analyzing..." : "Analyze Dataset"}
              </button>

              {isUploading && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    Processing your file... This may take several minutes for
                    large datasets.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              <p className="font-medium">Error:</p>
              <p className="break-words">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6 md:space-y-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-2">Total Records</p>
                <p className="text-xl md:text-2xl font-bold">
                  {results.total_records?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-2">Anomalies Detected</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  {results.anomalies_detected?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-2">Normal Records</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {results.normal_records?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-2">Anomaly Rate</p>
                <p className="text-xl md:text-2xl font-bold">
                  {results.anomaly_rate
                    ? results.anomaly_rate.toFixed(2)
                    : "0.00"}
                  %
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {/* Traffic Distribution Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-4">
                  Traffic Distribution
                </h3>
                <div className="h-64 md:h-80">
                  <Bar
                    data={distributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Anomaly Types Distribution */}
              {results.results?.class_distribution && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-semibold mb-4">
                    Anomaly Types Distribution
                  </h3>
                  <div className="h-64 md:h-80">
                    <Bar
                      data={getClassDistributionChartData(
                        results.results.class_distribution
                      )}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Breakdown */}
            {results.results?.class_distribution && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold mb-4">
                  Detailed Attack Types Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {Object.entries(results.results.class_distribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([classKey, count]) => (
                      <div
                        key={classKey}
                        className="flex justify-between items-center p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: getClassColor(classKey),
                            }}
                          />
                          <span className="font-medium text-sm md:text-base truncate">
                            {getClassLabel(classKey)}
                          </span>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <div className="font-bold text-sm md:text-base">
                            {(count as number).toLocaleString()}
                          </div>
                          <div className="text-xs md:text-sm text-gray-500">
                            {(
                              ((count as number) / results.total_records) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">
                Risk Assessment
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${getRiskLevelColor(
                    calculateRiskLevel(results.anomaly_rate)
                  )}`}
                >
                  {calculateRiskLevel(results.anomaly_rate)} Risk
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  Based on {results.anomaly_rate?.toFixed(2)}% anomaly rate
                </span>
              </div>

              {results.processing_time && (
                <p className="text-sm text-gray-500">
                  Analysis completed in {results.processing_time.toFixed(2)}{" "}
                  seconds
                </p>
              )}
            </div>

            {/* AI Security Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  🤖 AI Security Analysis
                </h3>
                {isGeneratingAI && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Generating...</span>
                  </div>
                )}
              </div>

              {isGeneratingAI ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-5/6"></div>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
                    AI is analyzing your scan results and generating security
                    recommendations...
                  </p>
                </div>
              ) : aiAnalysis ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                      {aiAnalysis}
                    </pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(aiAnalysis)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Copy Analysis
                    </button>
                    <button
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([aiAnalysis], {
                          type: "text/plain",
                        });
                        element.href = URL.createObjectURL(file);
                        const timestamp = new Date()
                          .toISOString()
                          .replace(/[:.]/g, "-");
                        element.download = `security-analysis-${timestamp}.txt`;
                        element.click();
                      }}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Download Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    AI analysis failed to generate. You can still review the
                    scan results above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* <Footer /> */}
    </div>
  );
}
