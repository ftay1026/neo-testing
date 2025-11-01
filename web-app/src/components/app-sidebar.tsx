'use client';

import type { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { FolderIcon } from 'lucide-react';
import { SidebarRecentProjects } from '@/components/sidebar-recent-projects';
import { BrainIcon } from 'lucide-react';
import { getUserDefaultProject } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export function AppSidebar({ user }: { user: User | null }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const [defaultProject, setDefaultProject] = useState<any>(null);

  useEffect(() => {
    const fetchDefaultProject = async () => {
      if (user) {
        const supabase = createClient();
        try {
          const project = await getUserDefaultProject(supabase);
          setDefaultProject(project);
        } catch (error) {
          console.error('Error fetching default project:', error);
        }
      }
    };

    fetchDefaultProject();
  }, [user]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="font-heading font-bold text-xl px-2 hover:bg-muted rounded-md cursor-pointer">
                NEO
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <GoogleDriveConnector /> */}
        
        {/* Navigation Section - without label, but show General Chats first */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* General Chats (Default Project) - Always visible first */}
              {defaultProject && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === `/app/project/${defaultProject.id}`}>
                    <Link
                      href={`/app/project/${defaultProject.id}`}
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <FolderIcon size={16} />
                      <span>General Chats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {/* All Projects */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/app/projects'}>
                  <Link
                    href="/app/projects"
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                  >
                    <FolderIcon size={16} />
                    <span>All Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {/* Memories */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/app/memories'}>
                  <Link
                    href="/app/memories"
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                  >
                    <BrainIcon size={16} />
                    <span>Memories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarRecentProjects user={user} />
        <SidebarHistory user={user} />
      </SidebarContent>
    </Sidebar>
  );
}