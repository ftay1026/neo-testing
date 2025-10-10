'use client';

import { useState, useEffect } from 'react';
import { PromptPanel } from './prompt-panel';
import { ComparisonResults } from './comparison-results';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePrompts, useComparisons } from '@/hooks/use-lab';
import { systemPrompt } from '@/lib/ai/prompts';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  VoteResult,
  ComparisonRunResult,
  Prompt,
} from '@/types/lab.types';

export function LabClient() {
  const [promptType, setPromptType] = useState('system');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  // Panel A
  const [nameA, setNameA] = useState('');
  const [promptA, setPromptA] = useState('');
  const [modelA, setModelA] = useState('claude-sonnet-4-20250514');

  // Panel B
  const [nameB, setNameB] = useState('');
  const [promptB, setPromptB] = useState('');
  const [modelB, setModelB] = useState('claude-sonnet-4-20250514');

  // Comparison
  const [userPrompt, setUserPrompt] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonRunResult | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Saved prompt IDs for comparison saving
  const [promptAId, setPromptAId] = useState<string>('');
  const [promptBId, setPromptBId] = useState<string>('');

  // Saved Priming Prompt
  const [primingPromptA, setPrimingPromptA] = useState('');
  const [primingPromptB, setPrimingPromptB] = useState('');


  const { prompts, createPrompt, updatePrompt, deletePrompt } = usePrompts(promptType);
  const { saveComparison, runComparison } = useComparisons();

  const usedPrompt: Prompt | undefined = prompts.find((p) => p.used);

  // Load used prompt on mount
  useEffect(() => {
    if (usedPrompt && !promptA) {
      setPromptA(usedPrompt.prompt);
      setNameA(usedPrompt.name);
      setPromptAId(usedPrompt.id);
    }
  }, [usedPrompt]);


  const handleDeletePrompt = async (panel: 'a' | 'b', id: string) => {
    try {
      await deletePrompt(id); // call the delete route via hook
      toast.success('Prompt deleted successfully');

      // clear the panel if the deleted prompt was loaded there
      if (panel === 'a' && promptAId === id) {
        setPromptA('');
        setNameA('');
        setPromptAId('');
      } else if (panel === 'b' && promptBId === id) {
        setPromptB('');
        setNameB('');
        setPromptBId('');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleEditPromptName = async (panel: 'a' | 'b', id: string, newName: string) => {
    try {
      await updatePrompt(id, { name: newName });
      toast.success('Prompt name updated successfully');
    } catch (error) {
      console.error('Error updating prompt name:', error);
      toast.error('Failed to update prompt name');
    }
  };


  const handleSavePrompt = async (panel: 'a' | 'b') => {
    const name = panel === 'a' ? nameA : nameB;
    const prompt = panel === 'a' ? promptA : promptB;
    const primingPrompt = panel ==='a' ? primingPromptA : primingPromptB;

    const newPrompt = await createPrompt({
      type: promptType,
      name,
      prompt,
      primingPrompt,
      used: false,
    });

    if (panel === 'a') {
      setPromptAId(newPrompt.id);
    } else {
      setPromptBId(newPrompt.id);
    }
  };

  const handleLoadSaved = (panel: 'a' | 'b', id: string) => {
    const saved = prompts.find((p) => p.id === id);
    if (!saved) return;

    if (panel === 'a') {
      setPromptA(saved.prompt);
      setNameA(saved.name);
      setPromptAId(saved.id);
      setPrimingPromptA(saved.primingPrompt)
    } else {
      setPromptB(saved.prompt);
      setNameB(saved.name);
      setPromptBId(saved.id);
      setPrimingPromptB(saved.primingPrompt)
    }
  };

  const handleLoadDefault = (panel: 'a' | 'b') => {
    const defaultPrompt = systemPrompt('coach');
    if (panel === 'a') {
      setPromptA(defaultPrompt);
      setNameA('Default System Prompt');
      setPromptAId('');
      setPrimingPromptA('')
    } else {
      setPromptB(defaultPrompt);
      setNameB('Default System Prompt');
      setPromptBId('');
      setPrimingPromptB('')
    }
  };

  const handleLoadUsed = (panel: 'a' | 'b') => {
    if (!usedPrompt) return;

    if (panel === 'a') {
      setPromptA(usedPrompt.prompt);
      setNameA(usedPrompt.name);
      setPromptAId(usedPrompt.id);
      setPrimingPromptA(usedPrompt.primingPrompt)
    } else {
      setPromptB(usedPrompt.prompt);
      setNameB(usedPrompt.name);
      setPromptBId(usedPrompt.id);
      setPrimingPromptA(usedPrompt.primingPrompt)
    }
  };

  const handleUsePrompt = async (panel: 'a' | 'b') => {
    const prompt = panel === 'a' ? promptA : promptB;
    const name = panel === 'a' ? nameA : nameB;
    let promptId = panel === 'a' ? promptAId : promptBId;
    const primingPrompt = panel === 'a' ? primingPromptA : primingPromptB;

    if (!prompt.trim()) {
      toast.error('Prompt cannot be empty');
      return;
    }

    // First save if doesn't exist
    const existing = prompts.find((p) => p.prompt === prompt);

    if (existing) {
      promptId = existing.id;
    } else {
      const newPrompt = await createPrompt({
        type: promptType,
        name: name || 'Unnamed Prompt',
        prompt,
        primingPrompt,
        used: false,
      });
      promptId = newPrompt.id;

      if (panel === 'a') {
        setPromptAId(newPrompt.id);
      } else {
        setPromptBId(newPrompt.id);
      }
    }

    // Then mark as used
    await updatePrompt(promptId, { used: true, type: promptType });
  };

  const handleRunComparison = async () => {
    if (!promptA || !promptB || !userPrompt || !primingPromptA || !primingPromptB) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsRunning(true);
    setComparisonResult(null);
    setVoteResult(null);

    try {
      const result = await runComparison({
        promptA,
        promptB,
        primingPromptA,
        primingPromptB,
        modelA,
        modelB,
        temperature,
        maxTokens,
        userPrompt,
      });

      setComparisonResult(result);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveComparison = async (notes: string) => {
    if (!voteResult || !comparisonResult) {
      toast.error('Please vote before saving');
      return;
    }

    // Ensure prompts are saved first and we have their IDs
    let finalPromptAId = promptAId;
    let finalPromptBId = promptBId;

    if (!finalPromptAId) {
      const existingA = prompts.find((p) => p.prompt === promptA);
      if (existingA) {
        finalPromptAId = existingA.id;
        setPromptAId(existingA.id);
      } else {
        const newPromptA = await createPrompt({
          type: promptType,
          name: nameA || 'Unnamed Prompt A',
          prompt: promptA,
          primingPrompt: primingPromptA,
          used: false,
        });
        finalPromptAId = newPromptA.id;
        setPromptAId(newPromptA.id);
      }
    }

    if (!finalPromptBId) {
      const existingB = prompts.find((p) => p.prompt === promptB);
      if (existingB) {
        finalPromptBId = existingB.id;
        setPromptBId(existingB.id);
      } else {
        const newPromptB = await createPrompt({
          type: promptType,
          name: nameB || 'Unnamed Prompt B',
          prompt: promptB,
          primingPrompt:primingPromptB,
          used: false,
        });
        finalPromptBId = newPromptB.id;
        setPromptBId(newPromptB.id);
      }
    }

    await saveComparison({
      prompt_a_id: finalPromptAId,
      prompt_b_id: finalPromptBId,
      model_a: modelA,
      model_b: modelB,
      temperature,
      max_tokens: maxTokens,
      user_prompt: userPrompt,
      response_a: comparisonResult.responseA,
      response_b: comparisonResult.responseB,
      vote_result: voteResult,
      notes,
    });

    // Reset comparison state after saving
    setComparisonResult(null);
    setVoteResult(null);
    setUserPrompt('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prompt Lab</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="temperature">Temperature:</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="max-tokens">Max Tokens:</Label>
            <Input
              id="max-tokens"
              type="number"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 100)}
              className="w-24"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PromptPanel
          label="Panel A"
          name={nameA}
          setName={setNameA}
          prompt={promptA}
          setPrompt={setPromptA}
          primingPrompt={primingPromptA}
          setPrimingPrompt={setPrimingPromptA}
          model={modelA}
          setModel={setModelA}
          savedPrompts={prompts}
          usedPrompt={usedPrompt}
          onSave={() => handleSavePrompt('a')}
          onLoadSaved={(id) => handleLoadSaved('a', id)}
          onLoadDefault={() => handleLoadDefault('a')}
          onLoadUsed={() => handleLoadUsed('a')}
          onUsePrompt={() => handleUsePrompt('a')}
          onDeletePrompt={(id) => handleDeletePrompt('a', id)}
          onEditPromptName={(id, newName) => handleEditPromptName('a', id, newName)}
          promptType={promptType}
        />

        <PromptPanel
          label="Panel B"
          name={nameB}
          setName={setNameB}
          prompt={promptB}
          setPrompt={setPromptB}
          primingPrompt={primingPromptB}
          setPrimingPrompt={setPrimingPromptB}
          model={modelB}
          setModel={setModelB}
          savedPrompts={prompts}
          usedPrompt={usedPrompt}
          onSave={() => handleSavePrompt('b')}
          onLoadSaved={(id) => handleLoadSaved('b', id)}
          onLoadDefault={() => handleLoadDefault('b')}
          onLoadUsed={() => handleLoadUsed('b')}
          onUsePrompt={() => handleUsePrompt('b')}
          onDeletePrompt={(id) => handleDeletePrompt('b', id)}
          onEditPromptName={(id, newName) => handleEditPromptName('b', id, newName)}
          promptType={promptType}
        />
      </div>

      <div className="space-y-4 border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="user-prompt">User Prompt</Label>
          <Textarea
            id="user-prompt"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter the prompt to test both configurations..."
            className="min-h-[120px]"
          />
        </div>

        <Button
          onClick={handleRunComparison}
          disabled={isRunning || !promptA || !promptB || !userPrompt}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Comparison...
            </>
          ) : (
            'Run Comparison'
          )}
        </Button>

        {comparisonResult && (
          <ComparisonResults
            responseA={comparisonResult.responseA}
            responseB={comparisonResult.responseB}
            usageA={comparisonResult.usageA}
            usageB={comparisonResult.usageB}
            onVote={setVoteResult}
            onSave={handleSaveComparison}
            voteResult={voteResult}
          />
        )}
      </div>
    </div>
  );
}