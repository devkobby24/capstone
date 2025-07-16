import { NextRequest } from 'next/server';
import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  let tempFilePath = '';
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Use dynamic import for node-fetch or http
    const { default: fetch } = await import('node-fetch');
    const FormData = (await import('form-data')).default;
    
    const form = new FormData();
    form.append('file', createReadStream(tempFilePath), {
      filename: file.name,
      contentType: file.type,
    });

    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Python service error: ${response.status} - ${errorText}`);
      throw new Error(`Python service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Analysis completed successfully');
    return Response.json(data);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(tempFilePath);
      } catch (e) {
        console.warn('Failed to cleanup temp file:', e);
      }
    }
  }
}