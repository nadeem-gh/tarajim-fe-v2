import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if backend server is running using the health endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${backendUrl}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        status: 'healthy', 
        backend: 'connected',
        message: data.message || 'Server is running',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        status: 'unhealthy', 
        backend: 'error',
        error: `Backend responded with status ${response.status}`,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      backend: 'disconnected',
      error: error.message || 'Backend server is not responding',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
