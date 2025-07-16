"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserScans, getUserStats } from "@/lib/firestore";
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
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalScans: 0,
    anomaliesDetected: 0,
    normalTraffic: 0,
    riskLevel: "Low" as "Low" | "Medium" | "High",
  });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [allScans, setAllScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const [userStats, userScans, allUserScans] = await Promise.all([
        getUserStats(user!.id),
        getUserScans(user!.id, 5), // Recent 5 scans
        getUserScans(user!.id, 50), // All scans for analytics
      ]);

      setStats(userStats);
      setRecentScans(
        userScans.map((scan) => ({
          id: scan.id,
          filename: scan.filename,
          date:
            scan.uploadDate instanceof Date
              ? scan.uploadDate.toISOString().split("T")[0]
              : scan.uploadDate.toDate().toISOString().split("T")[0],
          anomalies: scan.results.anomalies_detected,
          status: scan.status,
          riskLevel: scan.riskLevel,
        }))
      );
      setAllScans(allUserScans);
    } catch (error) {
      toast("Error loading user data");
      // Keep default values on error
    } finally {
      setIsLoading(false);
    }
  };

  // Generate threat distribution data from real scan results
  const generateThreatDistributionData = () => {
    if (allScans.length === 0) {
      return {
        labels: ["No Data Available"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(156, 163, 175, 0.8)"],
            borderWidth: 0,
          },
        ],
      };
    }

    const totalNormal = allScans.reduce(
      (sum, scan) => sum + (scan.results?.normal_records || 0),
      0
    );
    const totalAnomalies = allScans.reduce(
      (sum, scan) => sum + (scan.results?.anomalies_detected || 0),
      0
    );

    // Categorize anomalies by severity (based on anomaly rate)
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    allScans.forEach((scan) => {
      const anomalyRate = scan.results?.anomaly_rate || 0;
      const anomalies = scan.results?.anomalies_detected || 0;

      if (anomalyRate > 20) {
        highRisk += anomalies;
      } else if (anomalyRate > 10) {
        mediumRisk += anomalies;
      } else {
        lowRisk += anomalies;
      }
    });

    return {
      labels: [
        "Normal Traffic",
        "Low Risk Anomalies",
        "Medium Risk Anomalies",
        "High Risk Anomalies",
      ],
      datasets: [
        {
          data: [totalNormal, lowRisk, mediumRisk, highRisk],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Generate weekly trends from real data
  const generateWeeklyTrendsData = () => {
    if (allScans.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "No Data Available",
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: "rgb(156, 163, 175)",
            backgroundColor: "rgba(156, 163, 175, 0.1)",
            tension: 0.4,
          },
        ],
      };
    }

    // Group scans by day of the week for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyAnomalies = new Array(7).fill(0);
    const weeklyScans = new Array(7).fill(0);

    allScans.forEach((scan) => {
      const scanDate =
        scan.uploadDate instanceof Date
          ? scan.uploadDate
          : new Date(scan.uploadDate);
      const dayIndex = last7Days.findIndex(
        (date) => date.toDateString() === scanDate.toDateString()
      );

      if (dayIndex !== -1) {
        weeklyAnomalies[dayIndex] += scan.results?.anomalies_detected || 0;
        weeklyScans[dayIndex] += 1;
      }
    });

    return {
      labels: last7Days.map((date) => dayNames[date.getDay()]),
      datasets: [
        {
          label: "Anomalies Detected",
          data: weeklyAnomalies,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
        },
        {
          label: "Total Scans",
          data: weeklyScans,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        },
      ],
    };
  };

  // Generate system performance metrics from real data
  const generateSystemPerformanceData = () => {
    if (allScans.length === 0) {
      return {
        labels: [
          "Processing Speed",
          "Detection Rate",
          "Data Processed",
          "Scans Completed",
        ],
        datasets: [
          {
            label: "No Data Available",
            data: [0, 0, 0, 0],
            backgroundColor: ["rgba(156, 163, 175, 0.6)"],
            borderColor: ["rgb(156, 163, 175)"],
            borderWidth: 1,
          },
        ],
      };
    }

    // Calculate metrics from real data
    const avgProcessingTime =
      allScans.reduce(
        (sum, scan) => sum + (scan.results?.processing_time || 0),
        0
      ) / allScans.length;

    const totalRecords = allScans.reduce(
      (sum, scan) => sum + (scan.results?.total_records || 0),
      0
    );

    const avgDetectionRate =
      allScans.reduce(
        (sum, scan) => sum + (scan.results?.anomaly_rate || 0),
        0
      ) / allScans.length;

    // Convert to percentage values for display
    const processingSpeedScore = Math.max(
      0,
      Math.min(100, 100 - avgProcessingTime * 10)
    ); // Lower time = higher score
    const detectionRateScore = Math.min(100, avgDetectionRate * 5); // Scale anomaly rate
    const dataProcessedScore = Math.min(100, (totalRecords / 1000) * 10); // Scale based on total records
    const completionRate =
      (allScans.filter((scan) => scan.status === "completed").length /
        allScans.length) *
      100;

    return {
      labels: [
        "Processing Speed",
        "Detection Rate",
        "Data Processed",
        "Completion Rate",
      ],
      datasets: [
        {
          label: "Performance Metrics (%)",
          data: [
            Math.round(processingSpeedScore),
            Math.round(detectionRateScore),
            Math.round(dataProcessedScore),
            Math.round(completionRate),
          ],
          backgroundColor: [
            "rgba(34, 197, 94, 0.6)",
            "rgba(59, 130, 246, 0.6)",
            "rgba(251, 191, 36, 0.6)",
            "rgba(168, 85, 247, 0.6)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(251, 191, 36)",
            "rgb(168, 85, 247)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 py-6 md:p-10">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your network security and anomaly detection activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Scans
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalScans}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Anomalies Detected
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.anomaliesDetected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
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
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Normal Traffic
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.normalTraffic}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Risk Level
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(
                    stats.riskLevel
                  )}`}
                >
                  {stats.riskLevel}
                </span>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
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
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Threat Distribution
            </h3>
            <div className="h-64">
              <Doughnut
                data={generateThreatDistributionData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Weekly Trends
            </h3>
            <div className="h-64">
              <Line
                data={generateWeeklyTrendsData()}
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
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* System Performance and Recent Scans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              System Performance
            </h3>
            <div className="h-64">
              <Bar
                data={generateSystemPerformanceData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Scans
              </h3>
              {recentScans.length > 0 && (
                <Link
                  href="/history"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  See More
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {scan.filename}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {scan.date} • {scan.anomalies} anomalies
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                        scan.riskLevel
                      )}`}
                    >
                      {scan.riskLevel}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No scans performed yet</p>
                  <p className="text-sm">
                    Start by uploading a dataset to analyze
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/detect">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Scan
              </button>
            </Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              View Reports
            </button>
            {/* <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button> */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
