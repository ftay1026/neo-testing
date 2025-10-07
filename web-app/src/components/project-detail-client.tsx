// src/components/project-detail-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from "@/components/chat-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  MessageSquareIcon, 
  FileIcon, 
  FolderIcon,
  ArrowLeftIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ProjectChat } from '@/components/project-chat';
import { ProjectFilesSection } from '@/components/project-files-section';
import { ProjectDialog } from '@/components/project-dialog';
import { useProjects, UpdateProjectData, CreateProjectData } from '@/hooks/use-projects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { Project, ProjectFile } from '@/types/app.types';
import { ProjectInteractionLogsSection } from '@/components/project-interaction-logs-section';
import { getProjectDisplayName } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  visibility: string;
}

interface ProjectDetailClientProps {
  initialProject: Project;
  initialChats: Chat[];
  initialDocuments: ProjectFile[];
  user: User;
}

export function ProjectDetailClient({ 
  initialProject, 
  initialChats, 
  initialDocuments, 
  user 
}: ProjectDetailClientProps) {
  const router = useRouter();
  const { projects, updateProject, deleteProjects } = useProjects();
  
  // State management
  const [project, setProject] = useState(initialProject);
  const [chats, setChats] = useState(initialChats);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayName = getProjectDisplayName(project.name, project.is_default);
  const isDefaultProject = project.is_default && project.name === 'Default Project';

  const handleEditProject = () => {
    setIsDialogOpen(true);
  };

  const handleSaveProject = async (data: CreateProjectData | UpdateProjectData) => {
    try {
      if ('id' in data) {
        // Update existing project
        const updatedProject = await updateProject(data);
        setProject(updatedProject); // Update local state
        toast.success('Project updated successfully');
      } else {
        // Create new project (though this won't happen in project detail page)
        console.warn('Create project not supported in detail view');
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteProject = async () => {
    if (project && !project.is_default) {
      try {
        await deleteProjects([project.id]);
        toast.success('Project deleted successfully');
        router.push('/app/projects');
      } catch (error) {
        // Error is already handled in the hook
      }
    }
    setShowDeleteConfirm(false);
  };

  // Check if there are other default projects (not needed anymore but keeping for compatibility)
  const hasOtherDefaultProject = projects.some(p => p.is_default && p.id !== project.id);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* Fixed ChatHeader */}
        <ChatHeader
          chatId={`project-${project.id}`}
          selectedVisibilityType="private"
          isReadonly={true}
        />

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          {/* Header section */}
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
            <div className="flex h-12 items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/app/projects">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-5 w-5 text-muted-foreground" />
                  <h1 className="text-lg font-semibold">{displayName}</h1>
                  {project.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Project Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditProject}>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  {!project.is_default && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {project.description && (
              <div className="">
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>  
            )}
          </div>

          {/* Main content - responsive layout */}
          <div className="flex-1">
            {/* Desktop/Tablet Layout */}
            <div className="hidden lg:flex mx-auto max-w-7xl p-6 space-x-6">
              {/* Left side - Chats */}
              <div className="flex-1 flex flex-col">
                {/* New Chat Section */}
                <section className="mb-8">
                  <ProjectChat
                    projectId={project.id}
                    projectName={displayName}
                  />
                </section>

                {/* Chats Section */}
                <section className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquareIcon className="h-5 w-5" />
                      Chats ({chats.length})
                    </h2>
                  </div>
                  
                  {chats.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <MessageSquareIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-1">No chats yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start your first conversation in this project.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      {chats.map((chat) => (
                        <Link key={chat.id} href={`/app/chat/${chat.id}`}>
                          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer chat-card-custom-bg">
                            <CardHeader className="pb-0">
                              <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                {chat.title}
                              </CardTitle>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                                </p>
                                {chat.visibility === 'public' && (
                                  <Badge variant="outline" className="text-xs">
                                    Public
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right sidebar - Project Files */}
              <div className="w-80 space-y-6">
                <div className="border border-border/40 bg-background/50 rounded-lg">
                  <ProjectFilesSection projectId={project.id} />
                </div>

                <div className="border border-border/40 bg-background/50 rounded-lg">
                  <ProjectInteractionLogsSection projectId={project.id} />
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden flex flex-col p-6 space-y-8">
              {/* New Chat Section */}
              <section>
                <ProjectChat
                  projectId={project.id}
                  projectName={displayName}
                />
              </section>

              {/* Chats Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquareIcon className="h-5 w-5" />
                    Chats ({chats.length})
                  </h2>
                </div>
                
                {chats.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <MessageSquareIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-1">No chats yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start your first conversation in this project.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {chats.map((chat) => (
                      <Link key={chat.id} href={`/app/chat/${chat.id}`}>
                        <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
                          <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {chat.title}
                            </CardTitle>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                              </p>
                              {chat.visibility === 'public' && (
                                <Badge variant="outline" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Project Files Section - Mobile */}
              <section>
                <div className="border border-border/40 bg-background/50 rounded-lg">
                  <ProjectFilesSection projectId={project.id} isMobile />
                </div>
              </section>

              {/* Interaction Logs Section - Mobile */}
              <section>
                <div className="border border-border/40 bg-background/50 rounded-lg">
                  <ProjectInteractionLogsSection projectId={project.id} isMobile />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Project Edit Dialog */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveProject}
        project={project}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{displayName}" and all its associated chats and files. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}