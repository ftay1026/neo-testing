// /hooks/use-project-files.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProjectFile } from '@/types/app.types';

export interface CreateFileData {
  title: string;
  content: string;
}

export interface UpdateFileData {
  id: number;
  title: string;
  content: string;
}

export function useProjectFiles(projectId: string) {
  const { data, error, mutate, isLoading } = useSWR<ProjectFile[]>(
    projectId ? `/api/projects/${projectId}/files` : null, 
    fetcher, 
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  const createFile = async (fileData: CreateFileData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData),
      });

      if (!response.ok) {
        throw new Error('Failed to create file');
      }

      const newFile = await response.json();
      
      // Optimistically update the cache
      mutate(
        (currentFiles) => [newFile, ...(currentFiles || [])],
        false
      );
      
      toast.success('File created successfully');
      return newFile;
    } catch (error) {
      toast.error('Failed to create file');
      throw error;
    }
  };

  const updateFile = async (fileData: UpdateFileData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: fileData.title,
          content: fileData.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      const updatedFile = await response.json();
      
      // Optimistically update the cache
      mutate(
        (currentFiles) =>
          currentFiles?.map((file) =>
            file.id === fileData.id ? updatedFile : file
          ) || [],
        false
      );
      
      toast.success('File updated successfully');
      return updatedFile;
    } catch (error) {
      toast.error('Failed to update file');
      throw error;
    }
  };

  const deleteFiles = async (fileIds: number[]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete files');
      }

      // Optimistically update the cache
      mutate(
        (currentFiles) =>
          currentFiles?.filter((file) => !fileIds.includes(file.id)) || [],
        false
      );
      
      toast.success(`${fileIds.length} file${fileIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete files');
      throw error;
    }
  };

  return {
    files: data ?? [],
    isLoading,
    isError: error,
    mutate,
    refetch: () => mutate(),
    createFile,
    updateFile,
    deleteFiles,
  };
}