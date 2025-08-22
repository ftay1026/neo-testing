'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, Icons } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType } from '@/types/app.types';
import HeaderAuthClient from '@/components/header-auth-client';
import { CreditsNavItem } from './credits-nav-item';

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  projectId,
  projectName,
  chatTitle,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  projectId?: string;
  projectName?: string;
  chatTitle?: string; // Optional chat title since ChatHeader can be used in different contexts
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {/* Project name and chat title display */}
      {projectName && projectId && (
        <div className="order-3 md:order-2 me-auto items-center gap-2 flex whitespace-nowrap">
          <Link href={`/app/project/${projectId}`}>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md">
              <Icons.FolderIcon size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {projectName}
              </span>
            </div>
          </Link>
          <div className="text-sm text-muted-foreground">
            {/* Show chat title if available, otherwise fall back to 'Untitled Chat' only if chat ID is available */}
            {` / ${chatTitle || (chatId ? 'Untitled Chat' : '')}`}
          </div>
        </div>
      )}

      <div className="md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto gap-2 items-center">
        <div className="hidden md:block"><CreditsNavItem /></div>
        <HeaderAuthClient />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);