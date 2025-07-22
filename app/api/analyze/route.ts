import { NextRequest } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReadStream } from 'fs';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`🔍 API: Processing file: ${file.name}, size: ${file.size} bytes`);

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Dynamic import for node-fetch
    const { default: fetch } = await import('node-fetch');
    const FormData = (await import('form-data')).default;
    
    const form = new FormData();
    form.append('file', createReadStream(tempFilePath), {
      filename: file.name,
      contentType: file.type,
    });

    console.log('🔍 API: Forwarding to Python service...');

    // Forward to Python service
    const pythonResponse = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      body: form,
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python service error: ${pythonResponse.status}`);
    }

    const pythonResult = await pythonResponse.json() as any;
    
    // 🔍 DEBUG: Log what we received from Python
    console.log('🔍 API: Received from Python service:', pythonResult);
    console.log('🔍 API: Class distribution received:', pythonResult.results?.class_distribution);

    // 🚨 CRITICAL: Make sure we're forwarding ALL the data correctly
    const responseData = {
      total_records: pythonResult.total_records,
      anomalies_detected: pythonResult.anomalies_detected,
      normal_records: pythonResult.normal_records,
      anomaly_rate: pythonResult.anomaly_rate,
      processing_time: pythonResult.processing_time,
      results: {
        anomaly_scores_summary: pythonResult.results?.anomaly_scores_summary || {},
        class_distribution: pythonResult.results?.class_distribution || {},
        anomaly_scores: pythonResult.results?.anomaly_scores || [],
      }
    };

    // 🔍 DEBUG: Log what we're sending back to frontend
    console.log('🔍 API: Sending to frontend:', responseData);
    console.log('🔍 API: Class distribution forwarded:', responseData.results.class_distribution);

    return Response.json(responseData);

  } catch (error) {
    console.error('🔍 API: Analysis error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('🔍 API: Failed to cleanup temp file:', cleanupError);
      }
    }
  }
}