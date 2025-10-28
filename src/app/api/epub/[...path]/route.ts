import { NextRequest, NextResponse } from 'next/server';

// Disable caching for this route to handle large EPUB files
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path;
  
  // Extract book ID from the path
  const bookId = path[0];
  const resourcePath = path.slice(1).join('/');
  
  // If this is the main EPUB file (no resource path)
  if (!resourcePath) {
    const token = request.cookies.get('access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `http://localhost:8000/api/workspace/books/${bookId}/epub-file/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch EPUB' }, { status: response.status });
    }

    const blob = await response.blob();
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
  
  // For internal EPUB resources, redirect to Django backend
  return NextResponse.redirect(`http://localhost:8000/api/workspace/books/${bookId}/epub-file/${resourcePath}`);
}
