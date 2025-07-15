from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import pandas as pd
import numpy as np
import os
import time

app = Flask(__name__)
CORS(app)

model = None

# Define the custom focal loss function
def focal_loss_fn(y_true, y_pred, alpha=0.25, gamma=2.0):
    """
    Focal Loss function for handling class imbalance
    """
    # Convert to tensors
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.cast(y_pred, tf.float32)
    
    # Clip predictions to prevent log(0)
    epsilon = tf.keras.backend.epsilon() # type: ignore
    y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
    
    # Calculate focal loss
    ce_loss = -y_true * tf.math.log(y_pred) # type: ignore
    p_t = y_true * y_pred + (1 - y_true) * (1 - y_pred) # type: ignore
    alpha_t = y_true * alpha + (1 - y_true) * (1 - alpha) # type: ignore
    focal_loss = alpha_t * tf.pow(1 - p_t, gamma) * ce_loss
    
    return tf.reduce_mean(focal_loss)

def load_model():
    global model
    if model is None:
        try:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'FINAL_CICIDS_MODEL.keras')
            
            print(f"Loading model from: {model_path}")
            
            # Check if file exists first
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at: {model_path}")
            
            # Load model with custom objects - try different approaches
            try:
                # First try with custom_objects
                model = tf.keras.models.load_model( # type: ignore
                    model_path, 
                    custom_objects={'focal_loss_fn': focal_loss_fn}
                )
            except Exception as e1:
                print(f"First attempt failed: {e1}")
                try:
                    # Second try: load without compiling
                    model = tf.keras.models.load_model(model_path, compile=False) # type: ignore
                    print("Model loaded without compilation")
                    
                    # Recompile with a standard loss for inference
                    model.compile(
                        optimizer='adam',
                        loss='binary_crossentropy',
                        metrics=['accuracy']
                    )
                    print("Model recompiled for inference")
                except Exception as e2:
                    print(f"Second attempt failed: {e2}")
                    raise e2
            
            print("Model loaded successfully")
            print(f"Model input shape: {model.input_shape}")
            print(f"Model output shape: {model.output_shape}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e
    return model

@app.route('/analyze', methods=['POST'])
def analyze():
    start_time = time.time()
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        print(f"Processing file: {file.filename}")
        
        # Read CSV
        df = pd.read_csv(file) # type: ignore
        total_records = len(df)
        print(f"Dataset shape: {df.shape}")
        
        # Load model
        loaded_model = load_model()
        
        # Preprocess data
        processed_data = preprocess_data(df)
        print(f"Processed data shape: {processed_data.shape}")
        
        # Make predictions
        predictions = loaded_model.predict(processed_data)
        print(f"Predictions shape: {predictions.shape}")
        
        # Process results for multi-class classification
        # Get the class with highest probability for each sample
        predicted_classes = np.argmax(predictions, axis=1)
        
        # Assuming class 0 is 'normal' and classes 1-6 are different types of anomalies
        normal_class = 0
        anomalies = predicted_classes != normal_class
        
        # Get anomaly scores (max probability for non-normal classes)
        anomaly_scores = 1 - predictions[:, normal_class]  # 1 - probability of normal class
        
        anomalies_detected = int(np.sum(anomalies))
        normal_records = total_records - anomalies_detected
        anomaly_rate = float(np.mean(anomalies) * 100)
        
        results = {
            'total_records': total_records,
            'anomalies_detected': anomalies_detected,
            'normal_records': normal_records,
            'anomaly_rate': anomaly_rate,
            'anomaly_scores': anomaly_scores.tolist(),
            'processing_time': time.time() - start_time,
            'results': {
                'anomaly_scores_summary': {
                    'min': float(np.min(anomaly_scores)),
                    'max': float(np.max(anomaly_scores)),
                    'avg': float(np.mean(anomaly_scores))
                },
                'class_distribution': {
                    f'class_{i}': int(np.sum(predicted_classes == i)) 
                    for i in range(7)
                }
            }
        }
        
        print(f"Analysis completed in {time.time() - start_time:.2f} seconds")
        return jsonify(results)
        
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

def preprocess_data(df):
    """
    Preprocess the dataframe for the CICIDS model.
    This needs to match exactly how you preprocessed data during training.
    """
    try:
        # Remove non-numeric columns if any
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df_numeric = df[numeric_columns]
        
        # Handle missing values
        df_numeric = df_numeric.fillna(0)
        
        # Handle infinite values
        df_numeric = df_numeric.replace([np.inf, -np.inf], 0)
        
        # Convert to numpy array
        processed_data = df_numeric.values
        
        # Standardize the data
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        processed_data = scaler.fit_transform(processed_data)
        
        # CRITICAL: Reshape to match model input shape (None, 10, 2)
        # Your model expects sequences of length 10 with 2 features each
        
        # Take first 20 features to reshape into (10, 2)
        if processed_data.shape[1] >= 20:
            # Take first 20 features
            processed_data = processed_data[:, :20]
        else:
            # Pad with zeros if less than 20 features
            num_features = processed_data.shape[1]
            padding = np.zeros((processed_data.shape[0], 20 - num_features))
            processed_data = np.concatenate([processed_data, padding], axis=1)
        
        # Reshape to (batch_size, 10, 2)
        processed_data = processed_data.reshape(processed_data.shape[0], 10, 2)
        
        print(f"Final processed data shape: {processed_data.shape}")
        return processed_data
        
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        raise e

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy', 
        'model_loaded': model is not None,
        'tensorflow_version': tf.__version__
    })

@app.route('/debug', methods=['GET'])
def debug():
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'FINAL_CICIDS_MODEL.keras')
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    
    debug_info = {
        'current_directory': os.getcwd(),
        'script_directory': os.path.dirname(__file__),
        'expected_model_path': model_path,
        'models_directory': models_dir,
        'models_dir_exists': os.path.exists(models_dir),
        'model_file_exists': os.path.exists(model_path),
        'models_dir_contents': os.listdir(models_dir) if os.path.exists(models_dir) else [],
        'tensorflow_version': tf.__version__,
    }
    
    return jsonify(debug_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)