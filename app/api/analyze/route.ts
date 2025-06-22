export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log(`Processing file: ${file?.name}, Size: ${file?.size} bytes`);
    
    // Forward the request to your backend with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout
    
    const response = await fetch('https://intruscan.up.railway.app/api/analyze', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway error response:', errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Analysis completed successfully');
    
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json(
        { 
          error: 'Analysis timeout - Your file is being processed but it\'s taking longer than expected. This might be due to file size or complexity.' 
        },
        { status: 408 }
      );
    }
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return Response.json(
        { error: 'Unable to connect to analysis service. Please try again later.' },
        { status: 503 }
      );
    }
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze file. Please try again.' 
      },
      { status: 500 }
    );
  }
}