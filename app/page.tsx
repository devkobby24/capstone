"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

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

  return (
    <div className="grid grid-rows-[80px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <header className="w-full flex justify-between items-center px-4 row-start-1">
        <div className="flex items-center gap-3">
          <Image
            src="/intruscan1.svg"
            alt="NetDefender Logo"
            width={100}
            height={100}
            priority
            className="h-10 w-auto"
          />
        </div>
        <nav className="hidden md:flex gap-6">
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Home
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            About
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Documentation
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Contact
          </a>
        </nav>
      </header>

      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Network Anomaly Detection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Upload your network traffic datasets and leverage our advanced model to detect and predict anomalies with high accuracy.
          </p>
        </div>

        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Dataset</h2>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
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
            <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold">{results.total_records}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Anomalies Detected</p>
                  <p className="text-2xl font-bold text-red-600">{results.anomalies_detected}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Normal Records</p>
                  <p className="text-2xl font-bold text-green-600">{results.normal_records}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500">Anomaly Rate</p>
                  <p className="text-2xl font-bold">
                    {results.anomaly_rate ? results.anomaly_rate.toFixed(2) : '0.00'}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">How It Works</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced anomaly detection model analyzes network traffic patterns
              to identify potential security threats in real-time. The model uses
              machine learning to detect unusual patterns and behaviors in your
              network data.
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

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center w-full text-sm text-gray-500 dark:text-gray-400">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
          href="#"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Documentation
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
          href="#"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          API Reference
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-blue-600 dark:hover:text-blue-400"
          href="#"
          rel="noopener noreferrer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Help Center
        </a>
      </footer>
    </div>
  );
}
