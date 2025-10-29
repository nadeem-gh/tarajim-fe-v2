import React, { useRef, useEffect, useState } from 'react';
import { Book } from '@/types/translation';

interface EpubViewerProps {
  book: Book;
  onTextClick: (event: MouseEvent, doc: Document) => void;
  onTextSelection: (event: Event) => void;
  onContentLoad: (doc: Document) => void;
  onHighlighting: (doc: Document) => void;
  isLoading: boolean;
  error?: string;
}

export const EpubViewer: React.FC<EpubViewerProps> = ({
  book,
  onTextClick,
  onTextSelection,
  onContentLoad,
  onHighlighting,
  isLoading,
  error
}) => {
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [isLoadingEpub, setIsLoadingEpub] = useState(true);
  const [epubError, setEpubError] = useState<string>('');

  // Use direct backend URL for EPUB file
  const epubUrl = `http://localhost:8000/api/workspace/books/${book.id}/epub-file/`;

  useEffect(() => {
    if (!book.id) return;

    // Prevent multiple simultaneous loads
    let isLoaded = false;
    let isDestroyed = false;

    const loadEpub = async () => {
      if (isLoaded || isDestroyed) return;
      isLoaded = true;

      try {
        setIsLoadingEpub(true);
        setEpubError('');

        // Check if epubjs is available
        if (typeof window === 'undefined' || !(window as any).ePub) {
          throw new Error('epubjs library not loaded');
        }

        // Only create new instance if we don't have one
        if (!bookRef.current) {
          console.log('📚 Creating new EPUB book instance with URL:', epubUrl);
          const ePub = (window as any).ePub;
          
          // Create book instance
          const bookInstance = ePub(epubUrl);
          
          // Try to override the request method after a short delay
          setTimeout(() => {
            if (bookInstance.archiver && typeof bookInstance.archiver.request === 'function') {
              console.log('✅ Overriding archiver request method');
              const originalRequest = bookInstance.archiver.request;
              bookInstance.archiver.request = function(url: string) {
                console.log('📥 EPUB requesting:', url);
                // Convert relative URLs to backend API URLs
                if (url.startsWith('/') || !url.includes('://')) {
                  const baseUrl = `http://localhost:8000/api/workspace/books/${book.id}/epub-file`;
                  // Remove leading slash to avoid double slashes
                  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
                  const fullUrl = `${baseUrl}/${cleanPath}`;
                  console.log('🔄 Converted to backend URL:', fullUrl);
                  
                  return fetch(fullUrl)
                    .catch(error => {
                      console.warn(`Failed to load EPUB resource: ${url}`, error);
                      // Return a minimal response for missing files
                      if (url.includes('com.apple.ibooks.display-options.xml')) {
                        return new Response('<?xml version="1.0" encoding="UTF-8"?><display_options><platform name="*"><option name="specified-fonts">true</option></platform></display_options>', {
                          status: 200,
                          headers: { 'Content-Type': 'application/xml' }
                        });
                      }
                      // For other missing files, return empty content
                      return new Response('', {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain' }
                      });
                    });
                }
                return originalRequest.call(this, url);
              };
            } else {
              console.warn('❌ Archiver not available for request override');
            }
          }, 100);
          
          // Configure the URL resolver to use the backend API
          bookInstance.loaded.metadata.then((metadata: any) => {
            console.log('EPUB metadata loaded:', metadata);
          });
          
          bookRef.current = bookInstance;
        } else {
          console.log('📚 Reusing existing EPUB book instance');
        }

        // Set up book event handlers
        bookRef.current.ready.then(() => {
          if (isDestroyed) return;
          console.log('EPUB book ready');
          
          // Check if the epub-viewer element exists
          const epubViewerElement = document.getElementById('epub-viewer');
          if (!epubViewerElement) {
            console.error('❌ epub-viewer element not found in DOM');
            setEpubError('EPUB viewer element not found');
            return;
          }
          
          console.log('✅ epub-viewer element found, rendering EPUB');
          const rendition = bookRef.current.renderTo(epubViewerElement, {
            width: '100%',
            height: '100%',
            spread: 'none',
            overflow: 'auto',
            allowScriptedContent: true,
            allowPopups: false,
            manager: 'default'
          });
          renditionRef.current = rendition;

          // Set up rendition event handlers
          rendition.on('relocated', (location: any) => {
            console.log('EPUB relocated to:', location);
            setIsLoadingEpub(false);
            setEpubError('');
          });

          rendition.on('displayed', (section: any) => {
            console.log('EPUB section displayed:', section);
            setIsLoadingEpub(false);
            setEpubError('');
            
            // Reapply overflow constraints when new content is displayed
            setTimeout(() => {
              const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
              if (iframe && iframe.contentDocument) {
                const doc = iframe.contentDocument;
                applyOverflowConstraints(doc);
              }
            }, 50);
          });

          rendition.on('error', (error: any) => {
            console.error('Rendition error:', error);
            setEpubError(`Rendition error: ${error.message || 'Unknown error'}`);
            setIsLoadingEpub(false);
          });

          // Set up content hooks for text selection and highlighting
          rendition.hooks.content.register((contents: any) => {
            console.log('EPUB content loaded');
            const doc = contents.document;
            
            // Apply CSS constraints to prevent horizontal overflow
            applyOverflowConstraints(doc);
            
            // Also apply constraints after a short delay to ensure all content is loaded
            setTimeout(() => applyOverflowConstraints(doc), 100);
            
            // Add text selection handler
            const handleTextSelection = (event: Event) => {
              console.log('Text selection event triggered');
              
              // Try to get selection from the iframe first
              try {
                const iframeWindow = contents.window;
                const iframeSelection = iframeWindow.getSelection();
                const selectedText = iframeSelection ? iframeSelection.toString().trim() : '';
                
                console.log('Iframe selection text:', selectedText);
                if (selectedText) {
                  console.log('Selected text from iframe:', selectedText);
                  onTextSelection(event);
                  return;
                }
              } catch (e) {
                console.log('Iframe selection failed:', e);
              }
              
              // Fallback to main window selection
              try {
                const mainSelection = window.getSelection();
                const selectedText = mainSelection ? mainSelection.toString().trim() : '';
                
                console.log('Main window selection text:', selectedText);
                if (selectedText) {
                  console.log('Selected text from main window:', selectedText);
                  onTextSelection(event);
                } else {
                  console.log('No text selected, trying click handler instead');
                  // If no text is selected, try to use the click event
                  if (event.type === 'mouseup' || event.type === 'dblclick') {
                    onTextClick(event as MouseEvent, doc);
                  }
                }
              } catch (e) {
                console.log('Main window selection failed:', e);
              }
            };
            
            // Add event listeners for text selection and click
            doc.addEventListener('mouseup', handleTextSelection);
            doc.addEventListener('dblclick', handleTextSelection);
            doc.addEventListener('click', (e: Event) => {
              console.log('Click event listener triggered on doc');
              e.preventDefault();
              e.stopPropagation();
              onTextClick(e as MouseEvent, doc);
            });
            doc.addEventListener('keyup', (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setTimeout(handleTextSelection, 100); // Small delay to ensure selection is complete
              }
            });
            
            // Add click listeners to all text elements
            const textElements = doc.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li');
            textElements.forEach((element: Element) => {
              element.addEventListener('click', (e: Event) => {
                console.log('Click event triggered on element:', element.tagName, element.textContent?.substring(0, 50));
                e.preventDefault();
                e.stopPropagation();
                onTextClick(e as MouseEvent, doc);
              });
            });
            
            // Also add a global selection change listener
            if (contents.window) {
              contents.window.addEventListener('selectionchange', handleTextSelection);
            }
            
            // Notify parent component that content is loaded
            onContentLoad(doc);
          });

          // Start rendering
          rendition.display().then(() => {
            setIsLoadingEpub(false);
            
            // Force resize to ensure proper dimensions
            setTimeout(() => {
              if (renditionRef.current) {
                renditionRef.current.resize();
              }
            }, 100);
          });
        });

        bookInstance.on('error', (error: any) => {
          console.error('Book error:', error);
          setEpubError(`Book error: ${error.message || 'Unknown error'}`);
          setIsLoadingEpub(false);
        });

      } catch (error) {
        console.error('Error loading EPUB:', error);
        setEpubError(`Failed to load EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoadingEpub(false);
      }
    };

    loadEpub();

    // Add window resize handler
    const handleResize = () => {
      if (renditionRef.current) {
        renditionRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      isDestroyed = true;
      window.removeEventListener('resize', handleResize);
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }
      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }
    };
  }, [book.id]); // Only depend on book.id, not functions

  // Apply overflow constraints to prevent horizontal scrolling
  const applyOverflowConstraints = (doc: Document) => {
    // Add a style element to the document head
    let styleElement = doc.getElementById('epub-overflow-constraints');
    if (!styleElement) {
      styleElement = doc.createElement('style');
      styleElement.id = 'epub-overflow-constraints';
      doc.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      table {
        max-width: 100% !important;
        table-layout: fixed !important;
      }
      pre {
        max-width: 100% !important;
        overflow-x: auto !important;
        white-space: pre-wrap !important;
      }
      div, p, span, h1, h2, h3, h4, h5, h6 {
        max-width: 100% !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
      body {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
      }
      html {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 100vh !important;
      }
      body {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 100vh !important;
        padding-bottom: 2rem !important;
      }
      /* Translation selection styles */
      .translation-selected {
        background-color: #fef3c7 !important;
        border: 2px solid #f59e0b !important;
        border-radius: 4px !important;
        padding: 2px !important;
      }
      .translation-translated {
        background-color: #dcfce7 !important;
        border: 1px solid #16a34a !important;
        border-radius: 4px !important;
        padding: 2px !important;
      }
    `;
  };

  // Navigation functions
  const goToPrevious = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
      // Reapply constraints after navigation
      setTimeout(() => {
        const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          applyOverflowConstraints(doc);
          onHighlighting(doc);
        }
      }, 100);
    }
  };

  const goToNext = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
      // Reapply constraints after navigation
      setTimeout(() => {
        const iframe = document.querySelector('#epub-viewer iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          applyOverflowConstraints(doc);
          onHighlighting(doc);
        }
      }, 100);
    }
  };

  const displayError = error || epubError;

  return (
    <>
      <style jsx global>{`
        #epub-viewer {
          max-width: 100% !important;
        }
        #epub-viewer iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          max-width: 100% !important;
        }
        #epub-viewer .epub-container {
          max-width: 100% !important;
        }
        #epub-viewer .epub-container > div {
          max-width: 100% !important;
        }
        #epub-viewer .epub-container iframe {
          max-width: 100% !important;
        }
        /* Constrain EPUB content to prevent horizontal overflow */
        #epub-viewer * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        #epub-viewer img {
          max-width: 100% !important;
          height: auto !important;
        }
        #epub-viewer table {
          max-width: 100% !important;
          table-layout: fixed !important;
        }
        #epub-viewer pre {
          max-width: 100% !important;
          overflow-x: auto !important;
          white-space: pre-wrap !important;
        }
        #epub-viewer div, #epub-viewer p, #epub-viewer span {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
      `}</style>
      
      <div className="flex-1 relative min-w-0 min-h-screen">
        <div className="h-full min-h-screen">
          {displayError && displayError.trim() ? (
            <div className="flex items-center justify-center h-full bg-gray-50" data-testid="epub-error">
              <div className="text-center">
                <div className="text-red-600 text-lg font-medium mb-2">Error loading book</div>
                <div className="text-gray-600 text-sm mb-4">{displayError}</div>
                <button
                  onClick={() => {
                    setEpubError('');
                    setIsLoadingEpub(true);
                    // Reload the EPUB
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              {(isLoading || isLoadingEpub) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading EPUB...</p>
                  </div>
                </div>
              )}
              <div 
                id="epub-viewer" 
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
