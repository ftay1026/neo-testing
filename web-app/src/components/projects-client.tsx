// src/components/projects-client.tsx
'use client';

import { useState } from 'react';
import { ChatHeader } from "@/components/chat-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  FolderIcon, 
  MoreHorizontalIcon, 
  EditIcon, 
  TrashIcon 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useProjects, CreateProjectData, UpdateProjectData } from '@/hooks/use-projects';
import { ProjectDialog } from '@/components/project-dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@supabase/supabase-js';
import type { Project } from '@/types/app.types';
import { getProjectDisplayName } from '@/lib/utils';

interface ProjectsClientProps {
  initialProjects: Project[];
  user: User;
}

export function ProjectsClient({ initialProjects, user }: ProjectsClientProps) {
  // Use the hook with initial data - prevents loading state on first render
  const { 
    projects, 
    isLoading, 
    isError, 
    createProject, 
    updateProject, 
    deleteProjects 
  } = useProjects(initialProjects);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleSaveProject = async (data: CreateProjectData | UpdateProjectData) => {
    if ('id' in data) {
      await updateProject(data);
    } else {
      await createProject(data);
    }
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      await deleteProjects([projectToDelete]);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  // Check if there's already a default project (not needed anymore but keeping for compatibility)
  const hasDefaultProject = projects.some(p => p.is_default);

  // Only show loading if we're refetching and have no data
  if (isLoading && projects.length === 0) {
    return <ProjectsLoadingSkeleton />;
  }

  if (isError && projects.length === 0) {
    return <ProjectsErrorState onCreateProject={handleCreateProject} />;
  }

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId="projects"
          selectedVisibilityType="private"
          isReadonly={true}
        />

        {/* Header section */}
        <div className="">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Projects</h1>
            </div>
            <Button size="sm" onClick={handleCreateProject}>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className=" p-6 mx-auto max-w-7xl">
          {projects.length === 0 ? (
            <ProjectsEmptyState onCreateFirst={handleCreateProject} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={(id) => {
                    setProjectToDelete(id);
                    setShowDeleteConfirm(true);
                  }}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveProject}
        project={editingProject}
      />

      <DeleteConfirmDialog 
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteProject}
        projectName={projects.find(p => p.id === projectToDelete)?.name}
      />
    </>
  );
}

// Supporting components
function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: Project; 
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const displayName = getProjectDisplayName(project.name, project.is_default);
  const isDefaultProject = project.is_default && project.name === 'Default Project';
  
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/app/project/${project.id}`} className="flex-1">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {displayName}
              </CardTitle>
              {project.is_default && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {!project.is_default && (
                <DropdownMenuItem 
                  onClick={() => onDelete(project.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={`/app/project/${project.id}`}>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {project.description || 'No description'}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

function ProjectsEmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <div className="flex items-center justify-center flex-1">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <FolderIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first project to organize your chats and documents.
          </p>
          <Button onClick={onCreateFirst}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProjectsLoadingSkeleton() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId="projects"
        selectedVisibilityType="private"
        isReadonly={true}
      />

      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Projects</h1>
          </div>
          <Button size="sm" disabled>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsErrorState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId="projects"
        selectedVisibilityType="private"
        isReadonly={true}
      />

      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Projects</h1>
          </div>
          <Button size="sm" onClick={onCreateProject}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <FolderIcon className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-medium">Failed to load projects</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please refresh the page to try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  projectName 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectName?: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{projectName}" and all its associated chats and files. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete Project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}