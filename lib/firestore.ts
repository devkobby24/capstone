// filepath: lib/firestore.ts
import { db } from '../firebaseconfig';
import { collection, addDoc, getDocs, query, where, orderBy, limit, getDoc, doc, Timestamp } from 'firebase/firestore';

export interface ScanResult {
  id?: string;
  userId: string;
  filename: string;
  uploadDate: Date | Timestamp;
  results: {
    anomaly_scores: never[];
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
}

export const saveUserScan = async (scanData: Omit<ScanResult, 'id'>) => {
  try {
    console.log("🔍 Firestore saveUserScan received:", scanData); // Debug line
    
    const docRef = await addDoc(collection(db, 'scans'), {
      ...scanData,
      uploadDate: scanData.uploadDate instanceof Date 
        ? Timestamp.fromDate(scanData.uploadDate)
        : scanData.uploadDate
    });
    
    console.log("🔍 Firestore document created with ID:", docRef.id); // Debug line
    return docRef.id;
  } catch (error) {
    console.error("Error saving scan:", error);
    throw error;
  }
};

export async function getScanById(scanId: string) {
  try {
    const scanDoc = await getDoc(doc(db, 'user_scans', scanId));

    if (!scanDoc.exists()) {
      console.log('Scan document not found');
      return null;
    }

    const data = scanDoc.data();
    console.log('Scan data loaded:', { id: scanDoc.id, userId: data.userId });

    return {
      id: scanDoc.id,
      ...data
    };
  } catch (error) {
    console.error('Error getting scan by ID:', error);
    throw error;
  }
}

export const getUserScans = async (userId: string, limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'user_scans'),
      where('userId', '==', userId),
      orderBy('uploadDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadDate: doc.data().uploadDate.toDate ? doc.data().uploadDate.toDate() : doc.data().uploadDate,
    })) as ScanResult[];
  } catch (error) {
    console.error('Error fetching user scans:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'user_scans'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const scans = querySnapshot.docs.map(doc => doc.data());

    const totalScans = scans.length;
    const totalAnomalies = scans.reduce((sum, scan) => sum + (scan.results?.anomalies_detected || 0), 0);
    const totalNormal = scans.reduce((sum, scan) => sum + (scan.results?.normal_records || 0), 0);

    // Calculate risk level based on recent scans
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
    console.error('Error fetching user stats:', error);
    throw error;
  }
};