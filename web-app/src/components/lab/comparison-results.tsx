'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { ComparisonResultsProps, VoteResult } from '@/types/lab.types';

export function ComparisonResults({
  responseA,
  responseB,
  usageA,
  usageB,
  onVote,
  onSave,
  voteResult,
}: ComparisonResultsProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleVote = (result: VoteResult) => {
    onVote(result);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setNotes(''); // Clear notes after successful save
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Response A</span>
              {usageA && (
                <span className="text-sm font-normal text-muted-foreground">
                  {usageA.promptTokens + usageA.completionTokens} tokens
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {responseA}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Response B</span>
              {usageB && (
                <span className="text-sm font-normal text-muted-foreground">
                  {usageB.promptTokens + usageB.completionTokens} tokens
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {responseB}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant={voteResult === 'a' ? 'default' : 'outline'}
          onClick={() => handleVote('a')}
        >
          Vote A
        </Button>
        <Button
          variant={voteResult === 'b' ? 'default' : 'outline'}
          onClick={() => handleVote('b')}
        >
          Vote B
        </Button>
        <Button
          variant={voteResult === 'tie' ? 'default' : 'outline'}
          onClick={() => handleVote('tie')}
        >
          Vote Tie
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this comparison..."
          className="min-h-[100px]"
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!voteResult || isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Comparison'}
      </Button>
    </div>
  );
}