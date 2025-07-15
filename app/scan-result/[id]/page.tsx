"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getScanById } from "@/lib/firestore";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

interface ScanData {
  id: string;
  userId: string;
  filename: string;
  uploadDate: any;
  status: string;
  results: {
    total_records: number;
    anomalies_detected: number;
    normal_records: number;
    anomaly_rate: number;
    processing_time: number;
    results?: {
      anomaly_scores_summary?: {
        min: number;
        max: number;
        avg: number;
      };
      class_distribution?: { [key: string]: number };
    };
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
      router.push('/sign-in');
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
      
      console.log('Loading scan with ID:', id);
      console.log('Current user ID:', user?.id);

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
      console.error('Error loading scan result:', error);
      
      if (error.code === 'permission-denied') {
        setError("You don't have permission to view this scan");
      } else if (error.code === 'not-found') {
        setError("Scan not found");
      } else {
        setError("Failed to load scan result. Please try again.");
      }
    } finally {
      setIsLoading(false);
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

  const calculateRiskLevel = (anomalyRate: number) => {
    if (anomalyRate > 20) return "High";
    if (anomalyRate > 10) return "Medium";
    return "Low";
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

  const formatDate = (date: any) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
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
  const riskLevel = calculateRiskLevel(results.anomaly_rate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/history"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to History
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Scan Result Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {scan.filename} • {formatDate(scan.uploadDate)}
          </p>
        </div>

        {/* Result Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analysis Summary
            </h2>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getRiskLevelColor(
                riskLevel
              )}`}
            >
              {riskLevel} Risk
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {results.total_records?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Records
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {results.anomalies_detected?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Anomalies Detected
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {results.normal_records?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Normal Records
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {results.anomaly_rate?.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Anomaly Rate
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Anomaly Scores Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Anomaly Scores Summary
            </h3>
            {results.results?.anomaly_scores_summary && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Minimum Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {results.results.anomaly_scores_summary.min?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Maximum Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {results.results.anomaly_scores_summary.max?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Average Score
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {results.results.anomaly_scores_summary.avg?.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Processing Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Processing Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Processing Time
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.processing_time
                    ? `${results.processing_time.toFixed(2)}s`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  File Size
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {results.total_records
                    ? `${results.total_records.toLocaleString()} records`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="font-medium text-green-600">
                  {scan.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Class Distribution (if available) */}
        {results.results?.class_distribution && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Class Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(results.results.class_distribution).map(
                ([className, count]) => (
                  <div key={className} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {(count as number).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {className.replace("_", " ").toUpperCase()}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Actions
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/detect">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                Run New Analysis
              </button>
            </Link>
            <Link href="/history">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors">
                View All Scans
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
