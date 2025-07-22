"use client";

import { toast } from "sonner";

interface PDFGeneratorProps {
  // Data props
  scanData: {
    filename?: string;
    uploadDate?: any;
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
      class_distribution?: { [key: string]: number };
      results?: any;
    };
    aiAnalysis?: {
      analysis: string;
      prompt: string;
      generatedAt: any;
    };
  };
  
  // UI props
  buttonText?: string;
  buttonClassName?: string;
  
  // Helper functions
  calculateRiskLevel: (anomalyRate: number) => "Low" | "Medium" | "High";
  getClassLabel: (classKey: string) => string;
  getClassColor: (classKey: string) => string;
}

export default function PDFGenerator({
  scanData,
  buttonText = "Download Complete PDF Report",
  buttonClassName = "flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors",
  calculateRiskLevel,
  getClassLabel,
  getClassColor,
}: PDFGeneratorProps) {
  
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      toast("Generating comprehensive PDF report...");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to check if we need a new page
      const checkNewPage = (neededSpace: number = 20) => {
        if (yPosition + neededSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(30, 64, 175);
      pdf.setFont("helvetica", "bold");
      pdf.text("IntruScan Security Analysis Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Subtitle
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, {
        align: "center",
      });
      pdf.text(
        `File: ${scanData.filename || "Unknown"}`,
        pageWidth / 2,
        yPosition + 5,
        { align: "center" }
      );
      yPosition += 20;

      // Executive Summary Box
      pdf.setDrawColor(220, 38, 38);
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(10, yPosition, pageWidth - 20, 45, 3, 3, "FD");

      pdf.setFontSize(14);
      pdf.setTextColor(220, 38, 38);
      pdf.setFont("helvetica", "bold");
      pdf.text("Executive Summary", 15, yPosition + 8);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      const riskLevel = calculateRiskLevel(scanData.results.anomaly_rate);
      pdf.text(`Risk Level: ${riskLevel}`, 15, yPosition + 18);
      pdf.text(
        `Total Records: ${scanData.results.total_records?.toLocaleString()}`,
        15,
        yPosition + 26
      );
      pdf.text(
        `Anomalies Detected: ${scanData.results.anomalies_detected?.toLocaleString()}`,
        15,
        yPosition + 34
      );
      pdf.text(
        `Anomaly Rate: ${scanData.results.anomaly_rate?.toFixed(2)}%`,
        100,
        yPosition + 18
      );
      pdf.text(
        `Processing Time: ${scanData.results.processing_time?.toFixed(2)}s`,
        100,
        yPosition + 26
      );
      pdf.text(
        `Analysis Date: ${new Date().toLocaleDateString()}`,
        100,
        yPosition + 34
      );
      pdf.text(`File Name: ${scanData.filename}`, 15, yPosition + 42);

      yPosition += 55;

      // Statistics Section
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setTextColor(30, 64, 175);
      pdf.setFont("helvetica", "bold");
      pdf.text("Key Statistics", 15, yPosition);
      yPosition += 10;

      const stats = [
        {
          label: "Total Records",
          value: scanData.results.total_records?.toLocaleString() || "0",
          color: [59, 130, 246] as [number, number, number],
        },
        {
          label: "Anomalies",
          value: scanData.results.anomalies_detected?.toLocaleString() || "0",
          color: [239, 68, 68] as [number, number, number],
        },
        {
          label: "Normal Records",
          value: scanData.results.normal_records?.toLocaleString() || "0",
          color: [34, 197, 94] as [number, number, number],
        },
        {
          label: "Anomaly Rate",
          value: `${scanData.results.anomaly_rate?.toFixed(2) || "0.00"}%`,
          color: [168, 85, 247] as [number, number, number],
        },
      ];

      const cardWidth = (pageWidth - 40) / 4;
      stats.forEach((stat, index) => {
        const x = 15 + index * (cardWidth + 5);
        pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2], 0.1);
        pdf.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.roundedRect(x, yPosition, cardWidth, 20, 2, 2, "FD");

        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(stat.label, x + 2, yPosition + 6);

        pdf.setFontSize(12);
        pdf.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.setFont("helvetica", "bold");
        pdf.text(stat.value, x + 2, yPosition + 15);
      });

      yPosition += 30;

      // ✅ SIMPLIFIED: Direct chart capture method
      const captureChartDirectly = async (canvas: HTMLCanvasElement) => {
        try {
          // Get the chart data directly from the canvas
          return canvas.toDataURL("image/png");
        } catch (error) {
          console.error("Direct canvas capture failed:", error);
          return null;
        }
      };

      // Alternative: Capture chart container with minimal processing
      const captureChartContainer = async (canvas: HTMLCanvasElement) => {
        try {
          // Find the parent container
          const chartContainer = canvas.closest('.bg-white, [class*="bg-white"]') as HTMLElement;
          if (!chartContainer) return null;

          // Simple capture with minimal options
          const capturedCanvas = await html2canvas(chartContainer, {
            scale: 1,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            allowTaint: true,
            // Simplified options to avoid color parsing issues
          });

          return capturedCanvas.toDataURL("image/png");
        } catch (error) {
          console.error("Container capture failed:", error);
          return null;
        }
      };

      // Capture Charts with fallback methods
      const charts = document.querySelectorAll("canvas");

      if (charts.length > 0) {
        checkNewPage(70);
        
        // Try to capture first chart
        let chartImg = await captureChartDirectly(charts[0]);
        if (!chartImg) {
          chartImg = await captureChartContainer(charts[0]);
        }

        if (chartImg) {
          try {
            pdf.setFontSize(12);
            pdf.setTextColor(30, 64, 175);
            pdf.setFont("helvetica", "bold");
            pdf.text("Traffic Distribution Analysis", 15, yPosition);
            yPosition += 10;

            const chartWidth = 85;
            const chartHeight = 65;
            pdf.addImage(chartImg, "PNG", 15, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 15;
          } catch (error) {
            console.error("Failed to add chart to PDF:", error);
            // Add fallback text
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text("Chart display failed - data available in tables below", 15, yPosition);
            yPosition += 10;
          }
        } else {
          // Create data table instead of chart
          pdf.setFontSize(12);
          pdf.setTextColor(30, 64, 175);
          pdf.setFont("helvetica", "bold");
          pdf.text("Traffic Distribution Analysis (Data Table)", 15, yPosition);
          yPosition += 10;

          // Add basic traffic data
          if (scanData.results.class_distribution) {
            const entries = Object.entries(scanData.results.class_distribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5);

            entries.forEach(([classKey, count]) => {
              checkNewPage(6);
              pdf.setFontSize(9);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont("helvetica", "normal");
              const percentage = (((count as number) / scanData.results.total_records) * 100).toFixed(1);
              pdf.text(`${getClassLabel(classKey)}: ${(count as number).toLocaleString()} (${percentage}%)`, 20, yPosition);
              yPosition += 6;
            });
          }
          yPosition += 10;
        }
      }

      // Second chart if available
      if (charts.length > 1) {
        checkNewPage(70);
        
        // Try to capture second chart
        let chartImg = await captureChartDirectly(charts[1]);
        if (!chartImg) {
          chartImg = await captureChartContainer(charts[1]);
        }

        if (chartImg) {
          try {
            pdf.setFontSize(12);
            pdf.setTextColor(30, 64, 175);
            pdf.setFont("helvetica", "bold");
            pdf.text("Anomaly Types Distribution", 15, yPosition);
            yPosition += 10;

            const chartWidth = 85;
            const chartHeight = 65;
            pdf.addImage(chartImg, "PNG", 15, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 15;
          } catch (error) {
            console.error("Failed to add second chart to PDF:", error);
            // Add fallback text
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text("Chart display failed - data available in tables below", 15, yPosition);
            yPosition += 10;
          }
        } else {
          // Create data table for anomaly types
          pdf.setFontSize(12);
          pdf.setTextColor(30, 64, 175);
          pdf.setFont("helvetica", "bold");
          pdf.text("Anomaly Types Distribution (Data Table)", 15, yPosition);
          yPosition += 10;

          // Add anomaly data (exclude normal traffic)
          if (scanData.results.class_distribution) {
            const anomalies = Object.entries(scanData.results.class_distribution)
              .filter(([key, count]) => key !== 'class_0' && (count as number) > 0)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5);

            if (anomalies.length > 0) {
              anomalies.forEach(([classKey, count]) => {
                checkNewPage(6);
                pdf.setFontSize(9);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont("helvetica", "normal");
                const percentage = (((count as number) / scanData.results.anomalies_detected) * 100).toFixed(1);
                pdf.text(`${getClassLabel(classKey)}: ${(count as number).toLocaleString()} (${percentage}% of threats)`, 20, yPosition);
                yPosition += 6;
              });
            } else {
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text("No anomaly types detected", 20, yPosition);
              yPosition += 6;
            }
          }
          yPosition += 10;
        }
      }

      // Attack Types Breakdown Table
      if (scanData.results.class_distribution) {
        checkNewPage(50);
        pdf.setFontSize(14);
        pdf.setTextColor(30, 64, 175);
        pdf.setFont("helvetica", "bold");
        pdf.text("Detailed Attack Types Breakdown", 15, yPosition);
        yPosition += 15;

        const tableData = Object.entries(scanData.results.class_distribution)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 10);

        const headers = ["Attack Type", "Count", "Percentage", "Category"];
        const colWidths = [70, 30, 25, 25];
        const rowHeight = 8;

        // Table headers
        pdf.setFillColor(59, 130, 246, 0.2);
        pdf.setDrawColor(59, 130, 246);
        pdf.rect(15, yPosition, colWidths.reduce((a, b) => a + b), rowHeight, "FD");

        pdf.setFontSize(9);
        pdf.setTextColor(59, 130, 246);
        pdf.setFont("helvetica", "bold");
        let currentX = 15;
        headers.forEach((header, index) => {
          pdf.text(header, currentX + 2, yPosition + 6);
          currentX += colWidths[index];
        });
        yPosition += rowHeight;

        // Table rows
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        tableData.forEach(([classKey, count], rowIndex) => {
          checkNewPage(rowHeight + 5);

          if (rowIndex % 2 === 0) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(15, yPosition, colWidths.reduce((a, b) => a + b), rowHeight, "F");
          }

          const row = [
            getClassLabel(classKey),
            (count as number).toLocaleString(),
            `${(((count as number) / scanData.results.total_records) * 100).toFixed(2)}%`,
            classKey === "class_0" ? "Normal" : "Threat",
          ];

          currentX = 15;
          row.forEach((cell, cellIndex) => {
            pdf.setFontSize(8);
            const maxCellWidth = colWidths[cellIndex] - 4;
            const cellLines = pdf.splitTextToSize(cell, maxCellWidth);
            pdf.text(cellLines[0] || cell, currentX + 2, yPosition + 6);
            currentX += colWidths[cellIndex];
          });
          yPosition += rowHeight;
        });

        yPosition += 10;
      }

      // ✅ ENHANCED AI ANALYSIS SECTION - FIXED EMOJI ENCODING
      if (scanData.aiAnalysis?.analysis) {
        pdf.addPage();
        yPosition = 20;

        // AI Analysis Header (remove emojis that cause encoding issues)
        pdf.setFontSize(16);
        pdf.setTextColor(5, 150, 105);
        pdf.setFont("helvetica", "bold");
        pdf.text("AI Security Analysis & Recommendations", 15, yPosition);
        yPosition += 15;

        // Parse and format the AI analysis
        const analysisText = scanData.aiAnalysis.analysis;
        const lines = analysisText.split("\n");

        lines.forEach((line: string) => {
          const trimmedLine = line.trim();

          if (!trimmedLine) {
            yPosition += 3;
            return;
          }

          checkNewPage();

          // Main headers (##) - Remove emojis
          if (trimmedLine.startsWith("##")) {
            yPosition += 5;
            checkNewPage(15);
            const headerText = trimmedLine.replace(/^#+\s*/, "").trim();

            // Add colored background for headers
            pdf.setFillColor(220, 38, 38, 0.1);
            pdf.setDrawColor(220, 38, 38);
            const headerHeight = 12;
            pdf.roundedRect(15, yPosition - 3, pageWidth - 30, headerHeight, 2, 2, "FD");

            pdf.setFontSize(12);
            pdf.setTextColor(220, 38, 38);
            pdf.setFont("helvetica", "bold");
            // Remove emojis and special characters that cause encoding issues
            const cleanHeaderText = headerText.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            pdf.text(`CRITICAL: ${cleanHeaderText}`, 18, yPosition + 6);
            yPosition += headerHeight + 5;
          }

          // Sub headers (###) - Remove emojis
          else if (trimmedLine.startsWith("###")) {
            yPosition += 3;
            checkNewPage(12);
            const subHeaderText = trimmedLine.replace(/^#+\s*/, "").trim();

            pdf.setFillColor(30, 64, 175, 0.1);
            pdf.setDrawColor(30, 64, 175);
            const subHeaderHeight = 10;
            pdf.roundedRect(15, yPosition - 2, pageWidth - 30, subHeaderHeight, 1, 1, "FD");

            pdf.setFontSize(10);
            pdf.setTextColor(30, 64, 175);
            pdf.setFont("helvetica", "bold");
            // Remove emojis and special characters
            const cleanSubHeaderText = subHeaderText.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
            pdf.text(`RECOMMENDATION: ${cleanSubHeaderText}`, 18, yPosition + 5);
            yPosition += subHeaderHeight + 3;
          }

          // Bullet points
          else if (
            trimmedLine.match(/^\d+\.\s/) ||
            trimmedLine.startsWith("*") ||
            trimmedLine.startsWith("-")
          ) {
            checkNewPage(8);
            let bulletText = trimmedLine;

            // Clean up bullet formatting and emojis
            bulletText = bulletText.replace(/^\d+\.\s*/, "");
            bulletText = bulletText.replace(/^[\*\-]\s*/, "");
            bulletText = bulletText.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");

            // Add bullet point (use simple text bullet)
            pdf.setTextColor(34, 197, 94);
            pdf.text("•", 20, yPosition);

            // Add bullet text with proper wrapping
            pdf.setTextColor(0, 0, 0);
            const bulletLines = pdf.splitTextToSize(bulletText, pageWidth - 45);
            bulletLines.forEach((bulletLine: string, index: number) => {
              checkNewPage();
              pdf.text(bulletLine, 25, yPosition);
              if (index < bulletLines.length - 1) yPosition += 5;
            });
            yPosition += 6;
          }

          // Bold text (starts with **)
          else if (trimmedLine.includes("**")) {
            checkNewPage(8);
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);

            // Split by ** to handle bold formatting and remove emojis
            const cleanLine = trimmedLine.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
            const parts = cleanLine.split("**");

            parts.forEach((part, index) => {
              if (index % 2 === 1) {
                // Bold text
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(139, 69, 19);
              } else {
                // Normal text
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0, 0, 0);
              }

              if (part.trim()) {
                const partLines = pdf.splitTextToSize(part, pageWidth - 30);
                partLines.forEach((partLine: string) => {
                  checkNewPage();
                  pdf.text(partLine, 15, yPosition);
                  yPosition += 5;
                });
              }
            });
            yPosition += 2;
          }

          // Regular paragraphs
          else {
            checkNewPage(8);
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");

            // Remove emojis from regular text
            const cleanText = trimmedLine.replace(/[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
            const paragraphLines = pdf.splitTextToSize(cleanText, pageWidth - 30);
            paragraphLines.forEach((paragraphLine: string) => {
              checkNewPage();
              pdf.text(paragraphLine, 15, yPosition);
              yPosition += 5;
            });
            yPosition += 3;
          }
        });
      }

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
        pdf.text("Generated by IntruScan", 15, pageHeight - 10);
        pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      // Save the PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      pdf.save(`IntruScan-Professional-Report-${timestamp}.pdf`);

      toast("Professional PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast("PDF generation failed. Please try again.");
    }
  };

  return (
    <button onClick={generatePDF} className={buttonClassName}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      {buttonText}
    </button>
  );
}