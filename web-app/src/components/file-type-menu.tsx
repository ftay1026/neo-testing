'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusIcon, FileTextIcon, ExternalLinkIcon } from 'lucide-react';

interface FileTypeMenuProps {
  onCreateTextFile: () => void;
  onImportGoogleDoc: () => void;
}

export function FileTypeMenu({ onCreateTextFile, onImportGoogleDoc }: FileTypeMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <PlusIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCreateTextFile}>
          <FileTextIcon className="h-4 w-4 mr-2" />
          Create Text File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportGoogleDoc}>
          <ExternalLinkIcon className="h-4 w-4 mr-2" />
          Import Google Doc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}