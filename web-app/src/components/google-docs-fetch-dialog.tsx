'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink } from 'lucide-react';
import { useGoogleDocs } from '@/hooks/use-google-docs';

interface GoogleDocsFetchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContentFetched: (content: string, title: string) => void;
}

export function GoogleDocsFetchDialog({ 
  isOpen, 
  onOpenChange, 
  onContentFetched 
}: GoogleDocsFetchDialogProps) {
  const [docUrl, setDocUrl] = useState('');
  const { fetchGoogleDoc, isFetching } = useGoogleDocs();

  const handleFetch = async () => {
    const result = await fetchGoogleDoc(docUrl);
    if (result) {
      onContentFetched(result.content, result.title);
      onOpenChange(false);
      setDocUrl(''); // Reset form
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFetch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Import from Google Docs</DialogTitle>
          <DialogDescription>
            Paste a publicly shared Google Docs link to import its content as a project file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-url">Google Docs URL</Label>
            <Input
              id="doc-url"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/your-document-id/edit"
              disabled={isFetching}
              autoFocus
            />
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-blue-900 text-sm">Make your Google Doc publicly accessible:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open your Google Doc</li>
              <li>Click "Share" in the top right</li>
              <li>Click "Change to anyone with the link"</li>
              <li>Set permission to "Viewer"</li>
              <li>Copy the link and paste it above</li>
            </ol>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isFetching}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFetch} 
            disabled={!docUrl.trim() || isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Import Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}