'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectFiles, CreateFileData, UpdateFileData } from '@/hooks/use-project-files'
import { formatDistanceToNow } from 'date-fns'
import {
  FileIcon,
  PlusIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  UploadIcon,
  FolderIcon,
  ArrowBigLeft,
  ArrowBigRight,
  School
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { FileDialog } from '@/components/file-dialog'
import { GoogleDocsFetchDialog } from '@/components/google-docs-fetch-dialog'
import { FileTypeMenu } from '@/components/file-type-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
import type { ProjectFile } from '@/types/app.types'

interface ProjectFilesSectionProps {
  projectId: string;
  isMobile?: boolean;
}



export function ProjectFilesSection({ projectId, isMobile = false }: ProjectFilesSectionProps) {
  const { files, isLoading, isError, createFile, updateFile, deleteFiles } = useProjectFiles(projectId);

  
  // Dialog states
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isGoogleDocsDialogOpen, setIsGoogleDocsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<ProjectFile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);


  // State for pre-filled content from Google Docs
  const [prefilledContent, setPrefilledContent] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const handleCreateTextFile = () => {
    setEditingFile(null);
    setPrefilledContent(null);
    setIsFileDialogOpen(true);
  };

  const handleImportGoogleDoc = () => {
    setIsGoogleDocsDialogOpen(true);
  };

  const handleGoogleDocContentFetched = (content: string, title: string) => {
    setPrefilledContent({ title, content });
    setEditingFile(null);
    setIsFileDialogOpen(true);
  };

  const handleEditFile = (file: ProjectFile) => {
    setEditingFile(file);
    setPrefilledContent(null);
    setIsFileDialogOpen(true);
  };

  const handleSaveFile = async (data: CreateFileData | UpdateFileData) => {
    if ('id' in data) {
      await updateFile(data);
    } else {
      await createFile(data);
    }
    setPrefilledContent(null); // Clear prefilled content after save
  };

  const handleDeleteFile = async () => {
    if (fileToDelete) {
      await deleteFiles([fileToDelete]);
      setShowDeleteConfirm(false);
      setFileToDelete(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 border border-border-300/25 rounded-lg">
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
          <FileIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Failed to load files</p>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="text-center py-8">
          <FileIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No files yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add files to provide context for your AI conversations.
          </p>
          <FileTypeMenu
            onCreateTextFile={handleCreateTextFile}
            onImportGoogleDoc={handleImportGoogleDoc}
          />
        </div>
      );
    }

    return (
      <div className='mb-2'>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3   gap-2 ">
          {files.map((file) => (
            <div
              key={file.id}
              className="group border border-border-300/25 bg-[#30302E] h-22 rounded-lg px-2 py-2 hover:shadow-sm transition-all duration-200 w-full flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleEditFile(file)}
                >
                  <h4 className="font-medium text-xs group-hover:text-primary transition-colors"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}>
                    {file.title || 'Untitled'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground ">
                    {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreHorizontalIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditFile(file)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setFileToDelete(file.id);
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




            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`flex flex-col `}>
        {/* Header */}
        <div className="flex flex-row justify-between mb-2 ">

          <div className="flex flex-row w-full justify-end items-center gap-1">
            <div>
              <h2 className="font-semibold">Project Knowledge</h2>
            </div>
            <FileTypeMenu
              onCreateTextFile={handleCreateTextFile}
              onImportGoogleDoc={handleImportGoogleDoc}
            />
          </div>


        </div>

        {/* Capacity indicator */}
        {/* <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">1% of project capacity used</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1">
            <div className="bg-primary h-1 rounded-full" style={{ width: '1%' }}></div>
          </div>
        </div> */}

        {/* Files List */}
        <div>
          {renderContent()}
        </div>
      </div>

      {/* File Create/Edit Dialog */}
      <FileDialog
        isOpen={isFileDialogOpen}
        onOpenChange={(open) => {
          setIsFileDialogOpen(open);
          if (!open) {
            setPrefilledContent(null); // Clear prefilled content when dialog closes
          }
        }}
        onSave={handleSaveFile}
        file={editingFile}
        // Pass prefilled content if available
        initialTitle={prefilledContent?.title}
        initialContent={prefilledContent?.content}
      />

      {/* Google Docs Fetch Dialog */}
      <GoogleDocsFetchDialog
        isOpen={isGoogleDocsDialogOpen}
        onOpenChange={setIsGoogleDocsDialogOpen}
        onContentFetched={handleGoogleDocContentFetched}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}