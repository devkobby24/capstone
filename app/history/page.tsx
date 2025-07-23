"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserScans } from "@/lib/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { toast } from "sonner";

export default function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [filteredScans, setFilteredScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadUserScans();
    }
  }, [user]);

  useEffect(() => {
    filterScans();
  }, [scans, searchTerm, filterStatus, filterRisk]);

  const loadUserScans = async () => {
    try {
      setIsLoading(true);
      const userScans = await getUserScans(user!.id, 100); // Get all scans

      const formattedScans = userScans.map((scan) => ({
        id: scan.id,
        filename: scan.filename,
        date:
          scan.uploadDate instanceof Date
            ? scan.uploadDate
            : scan.uploadDate.toDate(),
        anomalies: scan.results.anomalies_detected,
        totalRecords: scan.results.total_records,
        anomalyRate: scan.results.anomaly_rate,
        status: scan.status,
        riskLevel: scan.riskLevel,
        results: scan.results,
        processingTime: scan.results.processing_time,
      }));

      setScans(formattedScans);
    } catch (error) {
      toast("Error loading user scans");
    } finally {
      setIsLoading(false);
    }
  };

  const filterScans = () => {
    let filtered = scans;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((scan) =>
        scan.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((scan) => scan.status === filterStatus);
    }

    // Risk filter
    if (filterRisk !== "all") {
      filtered = filtered.filter(
        (scan) => scan.riskLevel.toLowerCase() === filterRisk
      );
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setFilteredScans(filtered);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900";
      case "low":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
      case "processing":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900";
      case "failed":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading scan history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Scan History
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage your previous network analysis scans
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Level
              </label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScans.length > 0 ? (
            filteredScans.map((scan) => (
              <Link key={scan.id} href={`/scan-result/${scan.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3
                        className="font-semibold text-gray-900 dark:text-white mb-2 truncate"
                        title={scan.filename}
                      >
                        {scan.filename}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(scan.date)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium text-center whitespace-nowrap ${getRiskLevelColor(
                          scan.riskLevel
                        )}`}
                      >
                        {scan.riskLevel}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium text-center whitespace-nowrap ${getStatusColor(
                          scan.status
                        )}`}
                      >
                        {scan.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Records
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">
                        {scan.totalRecords?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Anomalies
                      </span>
                      <span className="font-medium text-red-600 text-right">
                        {scan.anomalies?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Anomaly Rate
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">
                        {scan.anomalyRate?.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Processing Time
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                        {scan.processingTime
                          ? `${scan.processingTime.toFixed(2)}s`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No scans found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
