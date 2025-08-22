import { useState } from 'react';
import { toast } from 'sonner';

interface FetchedDocData {
  content: string;
  title: string;
}

export function useGoogleDocs() {
  const [isFetching, setIsFetching] = useState(false);

  const fetchGoogleDoc = async (docUrl: string): Promise<FetchedDocData | null> => {
    if (!docUrl.trim()) {
      toast.error('Please enter a Google Docs URL');
      return null;
    }

    setIsFetching(true);
    try {
      const response = await fetch('/api/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch document');
      }

      const data = await response.json();
      toast.success('Google Doc content fetched successfully');
      return data;
    } catch (error) {
      console.error('Error fetching Google Doc:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch document');
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  return {
    fetchGoogleDoc,
    isFetching,
  };
}