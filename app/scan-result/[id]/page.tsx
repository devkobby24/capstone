"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getScanById } from "@/lib/firestore";
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
import { Bar } from "react-chartjs-2";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface ScanData {
  id: string;
  userId: string;
  filename: string;
  uploadDate: any;
  status: string;
  riskLevel?: string;
  results: {
    total_records: number;
    anomalies_detected: number;
    normal_records: number;
    anomaly_rate: number;
    processing_time: number;
    anomaly_scores_summary?: {
      min: number;
      max: number;
      avg: number;
      count: number;
    };
    class_distribution?: ClassDistribution;
  };
  // ✅ Add AI analysis field
  aiAnalysis?: {
    analysis: string;
    prompt: string;
    generatedAt: any;
  };
}

export default function ScanResultPage() {
  const [scan, setScan] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }

    if (user && id) {
      loadScanResult();
    }
  }, [user, id, isLoaded, router]);

  const loadScanResult = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const scanData = await getScanById(id as string);

      if (!scanData) {
        setError("Scan not found");
        return;
      }

      // Check if the scan belongs to the current user
      if ((scanData as any).userId !== user!.id) {
        setError("You don't have permission to view this scan");
        return;
      }

      setScan(scanData as ScanData);
    } catch (error: any) {
      toast("Error loading scan result");

      if (error.code === "permission-denied") {
        setError("You don't have permission to view this scan");
      } else if (error.code === "not-found") {
        setError("Scan not found");
      } else {
        setError("Failed to load scan result. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
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
      class_1: "DoS/DDoS Attack",
      class_2: "Port Scan",
      class_3: "Bot Attack",
      class_4: "Infiltration", // ✅ Already included
      class_5: "Web Attack",
      class_6: "Brute Force",
      class_7: "Heartbleed", // ✅ Added
      class_8: "SQL Injection", // ✅ Moved from class_7
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

  const formatDate = (date: any) => {
    try {
      let dateObj: Date;

      // Handle Firestore Timestamp
      if (date && typeof date.toDate === "function") {
        dateObj = date.toDate();
      }
      // Handle Date object
      else if (date instanceof Date) {
        dateObj = date;
      }
      // Handle string date
      else if (typeof date === "string") {
        dateObj = new Date(date);
      }
      // Handle timestamp number
      else if (typeof date === "number") {
        dateObj = new Date(date);
      }
      // Handle Firestore Timestamp object structure
      else if (date && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } else {
        console.warn("Unknown date format:", date);
        return "Unknown Date";
      }

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn("Invalid date created from:", date);
        return "Invalid Date";
      }

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error, "Date value:", date);
      return "Invalid Date";
    }
  };

  // Show loading if user data is not loaded yet
  if (!isLoaded || (isLoaded && !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading scan result...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 text-center">
            <svg
              className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/history">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  Back to History
                </button>
              </Link>
              <button
                onClick={loadScanResult}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!scan) {
    return null;
  }

  const results = scan.results;
  const riskLevel = scan.riskLevel || calculateRiskLevel(results.anomaly_rate);

  // Prepare chart data
  const distributionData = {
    labels: ["Normal Traffic", "Anomalous Traffic"],
    datasets: [
      {
        label: "Traffic Distribution",
        data: [results.normal_records, results.anomalies_detected],
        backgroundColor: ["rgba(34, 197, 94, 0.6)", "rgba(239, 68, 68, 0.6)"],
        borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/history"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm md:text-base"
            >
              ← Back to History
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Scan Result Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
            {scan.filename} • {formatDate(scan.uploadDate)}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
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
              {results.anomaly_rate ? results.anomaly_rate.toFixed(2) : "0.00"}%
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
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
          {results.class_distribution && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">
                Anomaly Types Distribution
              </h3>
              <div className="h-64 md:h-80">
                <Bar
                  data={getClassDistributionChartData(
                    results.class_distribution
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

        {/* Detailed Breakdown - matching detect page */}
        {results.class_distribution && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold mb-4">
              Detailed Attack Types Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {Object.entries(results.class_distribution)
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

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Anomaly Scores Summary */}
          {results.anomaly_scores_summary && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">
                Anomaly Scores Summary
              </h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                    Minimum Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                    {results.anomaly_scores_summary.min?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                    Maximum Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                    {results.anomaly_scores_summary.max?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                    Average Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                    {results.anomaly_scores_summary.avg?.toFixed(4)}
                  </span>
                </div>
                {results.anomaly_scores_summary.count && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                      Sample Count
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                      {results.anomaly_scores_summary.count.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-4">
              Processing Information
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Processing Time
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                  {results.processing_time
                    ? `${results.processing_time.toFixed(2)}s`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Dataset Size
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                  {results.total_records
                    ? `${results.total_records.toLocaleString()} records`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Status
                </span>
                <span className="font-medium text-green-600 text-sm md:text-base capitalize">
                  {scan.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Scan Date
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                  {formatDate(scan.uploadDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">
            Risk Assessment
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${getRiskLevelColor(
                riskLevel
              )}`}
            >
              {riskLevel} Risk
            </div>
            <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
              Based on {results.anomaly_rate?.toFixed(2)}% anomaly rate
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <p>
              This scan analyzed {results.total_records?.toLocaleString()}{" "}
              records and detected{" "}
              {results.anomalies_detected?.toLocaleString()} anomalies (
              {results.anomaly_rate?.toFixed(2)}% of total traffic).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/detect">
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                Run New Analysis
              </button>
            </Link>
            <Link href="/history">
              <button className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors">
                View All Scans
              </button>
            </Link>
          </div>
        </div>

        {/* AI Analysis Section - New */}
        {scan.aiAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold mb-4">
              AI Analysis
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customizing the rendering of specific elements
                  h1: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-3 mb-1">
                      {children}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mt-2 mb-1">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  // Add more customizations as needed
                }}
              >
                {scan.aiAnalysis.analysis}
              </ReactMarkdown>
            </div>
            <div className="mt-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Analyzed using AI on {formatDate(scan.aiAnalysis.generatedAt)}
              </span>
            </div>
          </div>
        )}

        {/* AI Security Analysis */}
        {scan.aiAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                🤖 AI Security Analysis
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Generated: {formatDate(scan.aiAnalysis.generatedAt)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div
                className="prose prose-sm dark:prose-invert max-w-none 
                          prose-headings:text-gray-900 dark:prose-headings:text-white
                          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                          prose-strong:text-gray-900 dark:prose-strong:text-white
                          prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                          prose-li:text-gray-700 dark:prose-li:text-gray-300
                          prose-p:text-gray-700 dark:prose-p:text-gray-300
                          prose-code:bg-gray-200 dark:prose-code:bg-gray-600 
                          prose-code:text-red-600 dark:prose-code:text-red-400
                          prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ node, children, ...props }) => (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-l-4 border-red-500 shadow-sm">
                        <h2
                          className="text-lg font-bold text-red-600 dark:text-red-400 m-0 flex items-center gap-2"
                          {...props}
                        >
                          <span className="text-red-500">🚨</span>
                          {children}
                        </h2>
                      </div>
                    ),
                    h3: ({ node, children, ...props }) => (
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                        <h3
                          className="text-base font-semibold text-blue-600 dark:text-blue-400 m-0 flex items-center gap-2"
                          {...props}
                        >
                          <span className="text-blue-500">🔧</span>
                          {children}
                        </h3>
                      </div>
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="space-y-2 ml-4" {...props} />
                    ),
                    li: ({ node, children, ...props }) => (
                      <li
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        {...props}
                      >
                        <span className="text-green-500 mt-1">•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ node, children, ...props }) => (
                      <strong
                        className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded font-bold text-gray-900 dark:text-white"
                        {...props}
                      >
                        {children}
                      </strong>
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed"
                        {...props}
                      />
                    ),
                    code: ({ node, ...props }) => {
                      const isInline =
                        node?.position?.start.line === node?.position?.end.line;
                      return isInline ? (
                        <code
                          className="bg-gray-200 dark:bg-gray-600 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-sm"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-gray-800 text-green-400 p-3 rounded-lg text-sm overflow-x-auto"
                          {...props}
                        />
                      );
                    },
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4"
                        {...props}
                      />
                    ),
                  }}
                >
                  {scan.aiAnalysis.analysis}
                </ReactMarkdown>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(scan.aiAnalysis!.analysis);
                    toast("Analysis copied to clipboard!");
                  }}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Analysis
                </button>

                <button
                  onClick={() => {
                    const element = document.createElement("a");
                    const file = new Blob([scan.aiAnalysis!.analysis], {
                      type: "text/plain",
                    });
                    element.href = URL.createObjectURL(file);
                    const timestamp = new Date()
                      .toISOString()
                      .replace(/[:.]/g, "-");
                    element.download = `security-analysis-${scan.filename}-${timestamp}.txt`;
                    element.click();
                    toast("Analysis downloaded!");
                  }}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Report
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show message if no AI analysis available */}
        {!scan.aiAnalysis && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                🤖 AI Security Analysis
              </h3>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  AI security analysis is not available for this scan. This
                  feature was added after this scan was completed. Run a new
                  scan to get AI-powered security recommendations.
                </p>
              </div>
              <div className="mt-3">
                <Link href="/detect">
                  <button className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Run New Scan with AI Analysis
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
