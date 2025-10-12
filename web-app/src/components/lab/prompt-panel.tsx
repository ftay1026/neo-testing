'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Save,
  Check,
  FileText,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  CheckIcon,
} from 'lucide-react';
import { labModels } from '@/lib/ai/models';
import type { PromptPanelProps } from '@/types/lab.types';

export function PromptPanel({
  label,
  name,
  setName,
  prompt,
  setPrompt,
  primingPrompt,
  setPrimingPrompt,
  model,
  setModel,
  savedPrompts,
  usedPrompt,
  onSave,
  onLoadSaved,
  onLoadDefault,
  onLoadUsed,
  onUsePrompt,
  onDeletePrompt,
  onEditPromptName,
  promptType,
}: PromptPanelProps) {
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUsingPrompt, setIsUsingPrompt] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedSavedId(id);
    onLoadSaved(id);
  };

  const handleUsePrompt = async () => {
    setIsUsingPrompt(true);
    try {
      await onUsePrompt();
    } finally {
      setIsUsingPrompt(false);
    }
  };

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleEditName = async (id: string) => {
    if (!editValue.trim()) return;
    await onEditPromptName?.(id, editValue);
    setEditingId(null);
    setEditValue('');
  };


  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      await onDeletePrompt?.(id);

      // ✅ If the deleted prompt was selected, reset selection
      if (selectedSavedId === id) {
        setSelectedSavedId('');
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{label}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim() || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUsePrompt}
            disabled={!prompt.trim() || isUsingPrompt}
          >
            <Check className="w-4 h-4 mr-2" />
            {isUsingPrompt ? 'Using...' : 'Use This Prompt'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`name-${label}`}>Prompt Name</Label>
        <Input
          id={`name-${label}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter prompt name..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`prompt-${label}`}>System Prompt</Label>
        <Textarea
          id={`prompt-${label}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter ${promptType.toLowerCase()} prompt...`}
          className="min-h-[300px] font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`priming-${label}`}>Priming Prompt</Label>
        <Textarea
          id={`priming-${label}`}
          value={primingPrompt}
          onChange={(e) => setPrimingPrompt(e.target.value)}
          placeholder="Enter priming prompt..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>


      <div className="flex gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span className="truncate max-w-[150px] text-left">
                {selectedSavedId
                  ? savedPrompts.find((p) => p.id === selectedSavedId)?.name
                  : 'Load saved...'}
              </span>
              <ChevronDownIcon className="h-4 w-4 ml-2 shrink-0" />
            </Button>

          </PopoverTrigger>

          <PopoverContent className="w-[250px] p-2">
            {savedPrompts.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No saved prompts
              </div>
            ) : (
              <ul className="space-y-1">
                {savedPrompts.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted ${selectedSavedId === p.id ? 'bg-accent' : ''
                      }`}
                    onClick={() => handleSelect(p.id)}
                  >
                    {editingId === p.id ? (
                      <div className="flex w-full items-center justify-between gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm border rounded px-1 py-0.5 flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditName(p.id);
                          }}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(p.id, p.name);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={onLoadDefault}>
          <FileText className="w-4 h-4 mr-2" />
          Load Default
        </Button>

        {usedPrompt && (
          <Button variant="outline" size="sm" onClick={onLoadUsed}>
            <Check className="w-4 h-4 mr-2" />
            Load Current Used
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`model-${label}`}>Model</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger id={`model-${label}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {labModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
