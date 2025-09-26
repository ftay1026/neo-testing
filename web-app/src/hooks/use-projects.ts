// src/hooks/use-projects.ts
'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import type { Project } from '@/types/app.types';

export interface CreateProjectData {
  name: string;
  description?: string;
  is_default?: boolean; // Keep for backend compatibility, but always false for new projects
}

export interface UpdateProjectData extends CreateProjectData {
  id: string; // Note: is_default should not be changed through UI anymore
}

async function fetcher(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}

// Main hook with optional initial data for hybrid server+client approach
export function useProjects(initialData?: Project[]) {
  const { data: projects = [], error, mutate, isLoading } = useSWR<Project[]>(
    '/api/projects',
    fetcher,
    {
      fallbackData: initialData, // Use server-side data as fallback
      revalidateOnMount: initialData ? false : true, // Don't revalidate if we have initial data
      dedupingInterval: 5000, // Dedupe requests for 5 seconds
      revalidateOnFocus: false, // Don't revalidate on window focus
      revalidateOnReconnect: true, // Revalidate when coming back online
    }
  );

  const createProject = async (data: CreateProjectData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create project');
      }

      const newProject = await response.json();
      
      // Optimistically update the cache
      mutate([...projects, newProject], false);
      
      toast.success('Project created successfully');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
      throw error;
    }
  };

  const updateProject = async (data: UpdateProjectData) => {
    try {
      const response = await fetch(`/api/projects/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update project');
      }

      const updatedProject = await response.json();
      
      // Optimistically update the cache
      mutate(
        projects.map(p => p.id === data.id ? updatedProject : p),
        false
      );
      
      toast.success('Project updated successfully');
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
      throw error;
    }
  };

  const deleteProjects = async (projectIds: string[]) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete projects');
      }

      // Optimistically update the cache
      mutate(
        projects.filter(p => !projectIds.includes(p.id)),
        false
      );
      
      toast.success(
        projectIds.length === 1 
          ? 'Project deleted successfully'
          : `${projectIds.length} projects deleted successfully`
      );
    } catch (error) {
      console.error('Error deleting projects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete projects');
      throw error;
    }
  };

  const isError = !!error;

  return {
    projects,
    isLoading,
    isError,
    createProject,
    updateProject,
    deleteProjects,
    mutate,
  };
}