'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ContentRenderer } from '@/components/content-renderer';
import { formatToUserTimezone } from '@/lib/date-utils';
import type { InteractionLog } from '@/types/app.types';
import { BookOpen } from 'lucide-react';

interface InteractionLogPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  log: InteractionLog | null;
}

export function InteractionLogPreviewDialog({ 
  isOpen, 
  onOpenChange, 
  log 
}: InteractionLogPreviewDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="mb-1 leading-6">
            {log.title}
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Period:</span>{' '}
              {formatToUserTimezone(log.log_period_start, 'PPp')} -{' '}
              {formatToUserTimezone(log.log_period_end, 'PPp')}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 border rounded-lg bg-muted/20">
          <ContentRenderer content={log.content} />
        </div>
      </DialogContent>
    </Dialog>
  );
}