from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import json
from typing import List, Dict
import io

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the model and scaler
model = IsolationForest(contamination=0.1, random_state=42)
scaler = StandardScaler()

# CICIDS-2017 important features
IMPORTANT_FEATURES = [
    ' Flow Duration', ' Total Fwd Packets', ' Total Backward Packets',
    ' Total Length of Fwd Packets', ' Total Length of Bwd Packets',
    ' Fwd Packet Length Mean', ' Bwd Packet Length Mean',
    ' Flow Bytes/s', ' Flow Packets/s', ' Flow IAT Mean',
    ' Fwd IAT Mean', ' Bwd IAT Mean', ' Fwd PSH Flags',
    ' Bwd PSH Flags', ' Fwd URG Flags', ' Bwd URG Flags',
    ' Fwd Header Length', ' Bwd Header Length', ' Fwd Packets/s',
    ' Bwd Packets/s', ' Min Packet Length', ' Max Packet Length',
    ' Packet Length Mean', ' Packet Length Std', ' Packet Length Variance',
    ' FIN Flag Count', ' SYN Flag Count', ' RST Flag Count',
    ' PSH Flag Count', ' ACK Flag Count', ' URG Flag Count',
    ' CWE Flag Count', ' ECE Flag Count', ' Down/Up Ratio',
    ' Average Packet Size', ' Avg Fwd Segment Size', ' Avg Bwd Segment Size',
    ' Fwd Header Length.1', ' Fwd Avg Bytes/Bulk', ' Fwd Avg Packets/Bulk',
    ' Fwd Avg Bulk Rate', ' Bwd Avg Bytes/Bulk', ' Bwd Avg Packets/Bulk',
    ' Bwd Avg Bulk Rate', ' Subflow Fwd Packets', ' Subflow Fwd Bytes',
    ' Subflow Bwd Packets', ' Subflow Bwd Bytes', ' Init_Win_bytes_forward',
    ' Init_Win_bytes_backward', ' act_data_pkt_fwd', ' min_seg_size_forward'
]

@app.post("/api/analyze")
async def analyze_traffic(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Clean column names (remove leading/trailing spaces)
        df.columns = df.columns.str.strip()
        
        # Select important features
        available_features = [col for col in IMPORTANT_FEATURES if col in df.columns]
        if not available_features:
            return {"error": "No matching features found in the dataset"}
        
        X = df[available_features].copy()
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Scale the features
        X_scaled = scaler.fit_transform(X)
        
        # Fit and predict using the model
        model.fit(X_scaled)
        predictions = model.predict(X_scaled)
        
        # Convert predictions to anomaly scores
        anomaly_scores = model.score_samples(X_scaled)
        
        # Calculate additional statistics
        total_records = len(df)
        anomalies_detected = int(np.sum(predictions == -1))
        normal_records = int(np.sum(predictions == 1))
        
        # Prepare detailed results
        results = {
            "total_records": total_records,
            "anomalies_detected": anomalies_detected,
            "normal_records": normal_records,
            "anomaly_rate": float(anomalies_detected / total_records * 100),
            "anomaly_scores": anomaly_scores.tolist(),
            "predictions": predictions.tolist(),
            "features_used": available_features,
            "feature_importance": dict(zip(available_features, 
                np.abs(model.feature_importances_) if hasattr(model, 'feature_importances_') 
                else [0] * len(available_features)))
        }
        
        return results
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"} 