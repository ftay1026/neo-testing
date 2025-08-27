'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateFileData, UpdateFileData } from '@/hooks/use-project-files';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectFile } from '@/types/app.types';

interface FileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateFileData | UpdateFileData) => Promise<void>;
  file?: ProjectFile | null;
  isLoading?: boolean;
  initialTitle?: string;
  initialContent?: string;
}

export function FileDialog({ 
  isOpen, 
  onOpenChange, 
  onSave, 
  file, 
  isLoading = false,
  initialTitle,
  initialContent
}: FileDialogProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [isSaving, setIsSaving] = useState(false);
  // Add state to force re-renders when editor state changes
  const [editorState, setEditorState] = useState(0);

  const isEditMode = !!file;

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || '',
    immediatelyRender: false, // Important for Next.js SSR
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[250px] sm:min-h-[300px] p-3',
      },
    },
    onUpdate: ({ editor }) => {
      console.log('Editor content changed:', editor.getHTML());
      // Force re-render when content changes
      setEditorState(prev => prev + 1);
    },
    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes (this is the key fix!)
      setEditorState(prev => prev + 1);
    },
    onFocus: ({ editor }) => {
      // Force re-render when editor gains focus
      setEditorState(prev => prev + 1);
    },
  });

  // Reset form when dialog opens/closes or file changes
  useEffect(() => {
  if (isOpen) {
    // Priority: file content > initial props > empty
    setTitle(file?.title || initialTitle || '');
    
    // Set editor content
    if (editor) {
      // Priority: file content > initial content > empty
      const content = file?.content || initialContent || '';
      
      // If content looks like HTML, use it directly, otherwise wrap in paragraph
      const htmlContent = content.startsWith('<') ? content : `<p>${content}</p>`;
      editor.commands.setContent(htmlContent);
    }
  } else {
    setTitle('');
    if (editor) {
      editor.commands.setContent('');
    }
  }
}, [isOpen, file, editor, initialTitle, initialContent]); // Add initialTitle and initialContent to dependencies

  const handleSave = async () => {
    if (!title.trim() || !editor) {
      return; // Title is required
    }

    // Get content as HTML from editor
    const content = editor.getHTML();
    
    // Basic validation - check if editor has meaningful content
    const textContent = editor.getText().trim();
    if (!textContent) {
      return; // Content is required
    }

    setIsSaving(true);
    try {
      if (isEditMode && file) {
        await onSave({
          id: file.id,
          title: title.trim(),
          content: content,
        });
      } else {
        await onSave({
          title: title.trim(),
          content: content,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Helper function to get current heading level text
  const getCurrentHeadingText = () => {
    if (!editor) return 'T';
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'T';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] sm:max-w-[800px] max-h-[90vh] sm:max-h-[85vh] flex flex-col" 
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEditMode ? 'Edit File' : 'Create New File'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Make changes to your file. Click save when you\'re done.'
              : 'Create a new file with a title and content. You can edit it later.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Main content area with horizontal layout */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* Left side: Form fields (scrollable) */}
          <div className="flex-1 overflow-y-auto pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter file title..."
                  disabled={isSaving}
                  autoFocus
                />
              </div>
              
              <div className="grid gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  {editor && editor.getText().length > 1000 && (
                    <span className="text-xs text-muted-foreground">
                      {editor.getText().length.toLocaleString()} characters
                    </span>
                  )}
                </div>
                
                {/* Tiptap Editor Container - without toolbar and without overflow */}
                <div className="border border-input rounded-md min-h-[250px] sm:min-h-[300px]">
                  <EditorContent 
                    editor={editor} 
                    className="h-full prose prose-compact"
                  />
                </div>
                
                {editor && editor.getText().length > 5000 && (
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Very large files may take longer to save and load
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Vertical toolbar (fixed) */}
          <div className="flex flex-col pt-8 pl-2">
            <div className="border border-border rounded bg-muted/30 p-2 space-y-2 flex flex-col items-left">
              
              {/* Heading Dropdown */}
              {editor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 text-xs font-medium flex flex-col items-center justify-center p-1"
                    >
                      <span className="text-[10px] leading-tight">{getCurrentHeadingText()}</span>
                      <ChevronDown className="h-2 w-2 " />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => editor.chain().focus().setParagraph().run()}
                      className={editor.isActive('paragraph') ? 'bg-accent' : ''}
                    >
                      <span className="text-sm">Normal Text</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                    >
                      <span className="text-lg font-semibold">Heading 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                    >
                      <span className="text-base font-semibold">Heading 2</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                    >
                      <span className="text-sm font-semibold">Heading 3</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Separator */}
              <div className="h-px bg-border my-2"></div>
              
              {/* Bold Button */}
              {editor && (
                <Button
                  type="button"
                  variant={editor.isActive('bold') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={!editor.can().chain().focus().toggleBold().run()}
                  className="h-8 w-8 p-0"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              )}
              
              {/* Italic Button */}
              {editor && (
                <Button
                  type="button"
                  variant={editor.isActive('italic') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={!editor.can().chain().focus().toggleItalic().run()}
                  className="h-8 w-8 p-0"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              )}
              
              {/* Separator */}
              <div className="h-px bg-border my-2"></div>
              
              {/* Bullet List Button */}
              {editor && (
                <Button
                  type="button"
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  disabled={!editor.can().chain().focus().toggleBulletList().run()}
                  className="h-8 w-8 p-0"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
              )}
              
              {/* Ordered List Button */}
              {editor && (
                <Button
                  type="button"
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  disabled={!editor.can().chain().focus().toggleOrderedList().run()}
                  className="h-8 w-8 p-0"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              )}
              
            </div>
          
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || !editor?.getText().trim() || isSaving}
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create File')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
