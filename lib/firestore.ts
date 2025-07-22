// filepath: lib/firestore.ts
import { db } from '../firebaseconfig';
import { collection, addDoc, getDocs, query, where, orderBy, limit, getDoc, doc, Timestamp } from 'firebase/firestore';

export interface ScanResult {
  id?: string;
  userId: string;
  filename: string;
  uploadDate: Date | Timestamp;
  results: {
    anomaly_scores?: number[];
    total_records: number;
    anomalies_detected: number;
    normal_records: number;
    anomaly_rate: number;
    processing_time: number;
    anomaly_scores_summary?: {
      count: number;
      min: number;
      max: number;
      avg: number;
    };
    class_distribution?: {
      [key: string]: number;
    };
  };
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'completed' | 'processing' | 'failed';
  aiAnalysis?: {
    analysis: string;
    prompt: string;
    generatedAt: Date | Timestamp;
  };
}

export const saveUserScan = async (scanData: Omit<ScanResult, 'id'>) => {
  try {
    console.log("🔍 Firestore saveUserScan received:", scanData);
    console.log("🔍 Firestore userId:", scanData.userId);
    console.log("🔍 Firestore class_distribution:", scanData.results.class_distribution);
    console.log("🔍 AI Analysis included:", !!scanData.aiAnalysis);
    
    // Ensure userId is properly set
    if (!scanData.userId) {
      throw new Error("User ID is required for saving scan data");
    }
    
    const docData = {
      ...scanData,
      uploadDate: scanData.uploadDate instanceof Date 
        ? Timestamp.fromDate(scanData.uploadDate)
        : scanData.uploadDate,
      // Ensure userId is at the top level for security rules
      userId: scanData.userId,
      aiAnalysis: scanData.aiAnalysis ? {
        ...scanData.aiAnalysis,
        generatedAt: scanData.aiAnalysis.generatedAt instanceof Date
          ? Timestamp.fromDate(scanData.aiAnalysis.generatedAt)
          : scanData.aiAnalysis.generatedAt
      } : undefined
    };
    
    console.log("🔍 Final document to save:", JSON.stringify(docData, null, 2));
    
    const docRef = await addDoc(collection(db, 'user_scans'), docData);
    
    console.log("🔍 Firestore document created with ID:", docRef.id);
    
    // Verify what was actually saved
    try {
      const savedDoc = await getDoc(docRef);
      const savedData = savedDoc.data();
      console.log("🔍 Verified saved data:", savedData);
      console.log("🔍 Verified class_distribution:", savedData?.results?.class_distribution);
    } catch (verifyError) {
      console.warn("🔍 Could not verify saved data:", verifyError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error("🔍 Error saving scan:", error);
    if (error instanceof Error) {
      console.error("🔍 Error message:", error.message);
      console.error("🔍 Error code:", (error as any).code);
    }
    throw error;
  }
};

export async function getScanById(scanId: string) {
  try {
    const scanDoc = await getDoc(doc(db, 'user_scans', scanId));

    if (!scanDoc.exists()) {
      console.log('🔍 Scan document not found');
      return null;
    }

    const data = scanDoc.data();
    console.log('🔍 Scan data loaded:', { id: scanDoc.id, userId: data.userId });
    console.log('🔍 Raw uploadDate from Firestore:', data.uploadDate);
    console.log('🔍 AI Analysis available:', !!data.aiAnalysis);

    // Handle the uploadDate properly
    let uploadDate = data.uploadDate;
    if (uploadDate && typeof uploadDate.toDate === 'function') {
      uploadDate = uploadDate.toDate();
    }

    // Handle AI analysis date if it exists
    let aiAnalysis = data.aiAnalysis;
    if (aiAnalysis && aiAnalysis.generatedAt && typeof aiAnalysis.generatedAt.toDate === 'function') {
      aiAnalysis = {
        ...aiAnalysis,
        generatedAt: aiAnalysis.generatedAt.toDate()
      };
    }

    return {
      id: scanDoc.id,
      ...data,
      uploadDate: uploadDate,
      aiAnalysis: aiAnalysis
    };
  } catch (error) {
    console.error('🔍 Error getting scan by ID:', error);
    throw error;
  }
}

export const getUserScans = async (userId: string, limitCount: number = 10) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    console.log("🔍 Getting scans for userId:", userId);
    
    const q = query(
      collection(db, 'user_scans'),
      where('userId', '==', userId),
      orderBy('uploadDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scans = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadDate: doc.data().uploadDate?.toDate ? doc.data().uploadDate.toDate() : doc.data().uploadDate,
    })) as ScanResult[];
    
    console.log('🔍 getUserScans loaded scans:', scans.length);
    scans.forEach((scan, index) => {
      console.log(`🔍 Scan ${index} class_distribution:`, scan.results?.class_distribution);
    });
    
    return scans;
  } catch (error) {
    console.error('🔍 Error fetching user scans:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    const q = query(
      collection(db, 'user_scans'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const scans = querySnapshot.docs.map(doc => doc.data());

    const totalScans = scans.length;
    const totalAnomalies = scans.reduce((sum, scan) => sum + (scan.results?.anomalies_detected || 0), 0);
    const totalNormal = scans.reduce((sum, scan) => sum + (scan.results?.normal_records || 0), 0);

    const recentScans = scans.slice(0, 5);
    const avgAnomalyRate = recentScans.length > 0
      ? recentScans.reduce((sum, scan) => sum + (scan.results?.anomaly_rate || 0), 0) / recentScans.length
      : 0;

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (avgAnomalyRate > 20) riskLevel = 'High';
    else if (avgAnomalyRate > 10) riskLevel = 'Medium';

    return {
      totalScans,
      anomaliesDetected: totalAnomalies,
      normalTraffic: totalNormal,
      riskLevel,
    };
  } catch (error) {
    console.error('🔍 Error fetching user stats:', error);
    throw error;
  }
};