export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Forward the request to your backend
    const response = await fetch('https://intruscan.up.railway.app/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: 'Failed to analyze file' },
      { status: 500 }
    );
  }
}