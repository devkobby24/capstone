// filepath: lib/firestore.ts
import { db } from '../firebaseconfig';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface ScanResult {
    id?: string;
    userId: string;
    filename: string;
    uploadDate: Date;
    results: {
        total_records: number;
        anomalies_detected: number;
        normal_records: number;
        anomaly_rate: number;
        anomaly_scores: number[];
        processing_time: number;
    };
    riskLevel: 'Low' | 'Medium' | 'High';
    status: 'completed' | 'processing' | 'failed';
}

export const saveUserScan = async (scanData: Omit<ScanResult, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'user_scans'), {
            ...scanData,
            uploadDate: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving scan:', error);
        throw error;
    }
};

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
        const avgAnomalyRate = recentScans.reduce((sum, scan) => sum + (scan.results?.anomaly_rate || 0), 0) / recentScans.length;

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