import Image from "next/image";

export default function Home() {
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
            Upload your network traffic datasets and leverage our advanced CNN
            model to detect and predict anomalies with high accuracy.
          </p>
        </div>

        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Dataset</h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
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
                Drag and drop your dataset here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                or
              </p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors">
                Browse Files
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Supported formats: CSV, PCAP, CICIDS-2017
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">How It Works</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our convolutional neural network (CNN) model analyzes network
              traffic patterns to identify anomalies and potential security
              threats in real-time. The model is trained on diverse datasets
              including CICIDS-2017 to provide high accuracy detection.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Supported Datasets</h3>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
              <li className="mb-2">CICIDS-2017</li>
              <li className="mb-2">NSL-KDD</li>
              <li className="mb-2">UNSW-NB15</li>
              <li>Custom network capture files (PCAP)</li>
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
