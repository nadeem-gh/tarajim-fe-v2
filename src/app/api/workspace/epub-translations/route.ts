import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Get the token from cookies or Authorization header
  const token = request.cookies.get('access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the request body
  const body = await request.json();

  // Proxy the request to Django backend
  const response = await fetch(
    'http://localhost:8000/api/workspace/epub-translations/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to save translation' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
