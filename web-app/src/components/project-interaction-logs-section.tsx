// /components/project-interaction-logs-section.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useInteractionLogs } from '@/hooks/use-interaction-logs'
import {
  FileTextIcon,
  MoreHorizontalIcon,
  TrashIcon,
  BookOpenIcon,
  ArrowBigRight,
  ArrowBigLeft,
  BookOpenText
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { InteractionLogPreviewDialog } from '@/components/interaction-log-preview-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { InteractionLog } from '@/types/app.types'
import { formatToUserTimezone, TimeDisplay } from '@/lib/date-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface ProjectInteractionLogsSectionProps {
  projectId: string;
  isMobile?: boolean;
}

export function ProjectInteractionLogsSection({ projectId, isMobile = false }: ProjectInteractionLogsSectionProps) {
  const {logs, isLoading, isError, deleteLog, lastLoggedAt } = useInteractionLogs(projectId);

 
  // Dialog states
  const [selectedLog, setSelectedLog] = useState<InteractionLog | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);


  const handleViewLog = (log: InteractionLog) => {
    setSelectedLog(log);
  };

  const handleDeleteLog = async () => {
    if (logToDelete) {
      await deleteLog(logToDelete);
      setShowDeleteConfirm(false);
      setLogToDelete(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 border border-border/40 rounded-lg">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-8">
          <FileTextIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load logs</p>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <div className="text-center py-8">
          <BookOpenIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No interaction logs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start chatting and create logs to track your AI interaction journey.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the "Log Now" button in any chat to create reflections.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group h-20 border border-border/40 rounded-lg p-3 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between ">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleViewLog(log)}
              >
                <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {formatToUserTimezone(log.log_period_start, 'MMM d')} - {formatToUserTimezone(log.log_period_end, 'MMM d')}
                </h4>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <MoreHorizontalIcon className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewLog(log)}>
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLogToDelete(log.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col text-xs text-muted-foreground">
              {/* Show log period with tooltip */}
              <div className='line-clamp-1 '>
                {log.title}
              </div>
              {/* Use timezone-aware time display */}
              <TimeDisplay timestamp={log.created_at} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={`flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between mb-2`}>
          <div className={`flex items-center gap-2`}>
            <h2 className="font-semibold">Interaction Logs</h2>
          </div>
          
        </div>

        {/* Last logged info */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {lastLoggedAt
              ? `Last logged: ${formatToUserTimezone(lastLoggedAt)}`
              : 'No logs created yet'
            }
          </p>
        </div>

        {/* Logs List */}
        <div>
          {renderContent()}
        </div>
      </div>

      {/* View Log Dialog - Reuse FileDialog but read-only */}
      {selectedLog && (
        <InteractionLogPreviewDialog
          isOpen={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
          log={selectedLog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this interaction log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}