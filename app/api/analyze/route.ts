import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}`);

    // Forward to Python service
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
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
  }
}