// src/components/sidebar-recent-projects.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { memo, useEffect } from 'react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';

import { FolderIcon, MoreHorizontalIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { fetcher } from '@/lib/utils';
import type { Project } from '@/types/app.types';
import { getProjectDisplayName } from '@/lib/utils';

interface RecentProject extends Project {
  last_activity?: string; // When the project was last accessed
  chat_count?: number; // Number of chats in this project
}

const PureRecentProjectItem = ({
  project,
  isActive,
  setOpenMobile,
}: {
  project: RecentProject;
  isActive: boolean;
  setOpenMobile: (open: boolean) => void;
}) => {
  const displayName = getProjectDisplayName(project.name, project.is_default);
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="py-6">
        <Link href={`/app/project/${project.id}`} onClick={() => setOpenMobile(false)}>
          <FolderIcon size={16} />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {project.chat_count !== undefined && (
                <span>{project.chat_count} chats</span>
              )}
              {project.last_activity && (
                <span>
                  {formatDistanceToNow(new Date(project.last_activity), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export const RecentProjectItem = memo(PureRecentProjectItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.project.id !== nextProps.project.id) return false;
  return true;
});

export function SidebarRecentProjects({ user }: { user: User | null }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  
  const {
    data: recentProjects,
    isLoading,
    mutate,
  } = useSWR<Array<RecentProject>>(
    user ? '/api/projects/recent' : null, 
    fetcher, 
    {
      fallbackData: [],
      refreshInterval: 0, // Only refresh on demand
    }
  );

  useEffect(() => {
    // Refresh recent projects when pathname changes (when user navigates to different projects)
    if (pathname.startsWith('/app/project/')) {
      mutate();
    }
  }, [pathname, mutate]);

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-6 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to see your recent projects!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Recent Projects
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col space-y-1">
            {[44, 32, 28, 64].map((width, index) => (
              <div
                key={index}
                className="rounded-md h-12 flex gap-2 px-2 items-center" // Updated height to h-12 to match py-6 buttons
              >
                <div className="h-4 w-4 rounded-md bg-sidebar-accent-foreground/10" />
                <div className="flex flex-col gap-1 flex-1">
                  <div
                    className="h-3 rounded-md bg-sidebar-accent-foreground/10"
                    style={
                      {
                        width: `${width}%`,
                      } as React.CSSProperties
                    }
                  />
                  <div className="h-2 rounded-md bg-sidebar-accent-foreground/10 w-16" />
                </div>
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Filter out the default project from recent projects since it's shown in navigation
  const filteredProjects = recentProjects?.filter(project => 
    !(project.is_default && project.name === 'Default Project')
  ) || [];

  if (filteredProjects.length === 0) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Recent Projects
        </div>
        <SidebarGroupContent>
          <div className="px-2 py-6 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Start working on projects to see them here!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Extract current project ID from pathname if we're on a project page
  const currentProjectId = pathname.startsWith('/app/project/') 
    ? pathname.split('/app/project/')[1] 
    : null;

  return (
    <SidebarGroup>
      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
        Recent Projects
      </div>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {filteredProjects.map((project) => (
            <RecentProjectItem
              key={project.id}
              project={project}
              isActive={project.id === currentProjectId}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}