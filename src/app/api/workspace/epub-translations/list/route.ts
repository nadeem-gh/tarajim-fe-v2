import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the token from cookies or Authorization header
  const token = request.cookies.get('access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('book_id');

  if (!bookId) {
    return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
  }

  // Proxy the request to Django backend
  const response = await fetch(
    `http://localhost:8000/api/workspace/epub-translations/list/?book_id=${bookId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
