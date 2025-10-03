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
import { Save, Check, FileText } from 'lucide-react';
import { labModels } from '@/lib/ai/models';
import type { PromptPanelProps } from '@/types/lab.types';

export function PromptPanel({
  label,
  name,
  setName,
  prompt,
  setPrompt,
  model,
  setModel,
  savedPrompts,
  usedPrompt,
  onSave,
  onLoadSaved,
  onLoadDefault,
  onLoadUsed,
  onUsePrompt,
  promptType,
}: PromptPanelProps) {
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUsingPrompt, setIsUsingPrompt] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsePrompt = async () => {
    setIsUsingPrompt(true);
    try {
      await onUsePrompt();
    } finally {
      setIsUsingPrompt(false);
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
        <Label htmlFor={`prompt-${label}`}>Prompt Content</Label>
        <Textarea
          id={`prompt-${label}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter ${promptType.toLowerCase()} prompt...`}
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select
          value={selectedSavedId}
          onValueChange={(value) => {
            setSelectedSavedId(value);
            onLoadSaved(value);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Load saved..." />
          </SelectTrigger>
          <SelectContent>
            {savedPrompts.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No saved prompts
              </div>
            ) : (
              savedPrompts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

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