// /hooks/use-chat-logs.ts
import { useState } from 'react';
import { toast } from 'sonner';
import type { UIMessage } from 'ai';
import type { InteractionLog } from '@/types/app.types';
import { isMessageAfterTime } from '@/lib/date-utils';

interface LogAnalysis {
  hasNewMessages: boolean;
  messageCount: number;
  lastLogDate: Date | null;
  hasSubstantialContent: boolean;
  recommendCreate: boolean;
}

interface LogDialogState {
  show: boolean;
  analysis: LogAnalysis | null;
}

export function useChatLogs(chatId: string) {
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [logDialogState, setLogDialogState] = useState<LogDialogState>({
    show: false,
    analysis: null,
  });

  // Analyze messages against last log time
  const analyzeMessagesForLog = (
    messages: UIMessage[], 
    lastLogTime: string | null
  ): LogAnalysis => {
    if (!lastLogTime || messages.length === 0) {
      return {
        hasNewMessages: true,
        messageCount: messages.length,
        lastLogDate: null,
        hasSubstantialContent: true,
        recommendCreate: messages.length > 0,
      };
    }

    // Find messages after the last log (timezone handled automatically)
    const newMessages = messages.filter(msg => 
      msg.createdAt && isMessageAfterTime(msg.createdAt, lastLogTime)
    );

    // Define "substantial content" criteria
    const hasSubstantialContent = newMessages.some(msg => {
      if (msg.role === 'assistant') return true; // Any AI response is substantial
      if (msg.role === 'user' && msg.content.length > 20) return true; // Meaningful user input
      return false;
    });

    // Recommend creation if there's substantial new content
    const recommendCreate = newMessages.length >= 2 || hasSubstantialContent;

    return {
      hasNewMessages: newMessages.length > 0,
      messageCount: newMessages.length,
      lastLogDate: new Date(lastLogTime),
      hasSubstantialContent,
      recommendCreate,
    };
  };

  // Check if log creation is warranted and show dialog
  const checkAndShowLogDialog = async (messages: UIMessage[]) => {
    if (messages.length === 0) {
      toast.error('No conversation to log');
      return;
    }

    try {
      // Fetch last log time only when needed
      const response = await fetch(`/api/chats/${chatId}/logs/last`);
      const data = response.ok ? await response.json() : { lastLogTime: null };
      
      const analysis = analyzeMessagesForLog(messages, data.lastLogTime);
      
      setLogDialogState({
        show: true,
        analysis,
      });
    } catch (error) {
      console.warn('Failed to fetch last log time:', error);
      // Still allow log creation if API fails
      setLogDialogState({
        show: true,
        analysis: {
          hasNewMessages: true,
          messageCount: messages.length,
          lastLogDate: null,
          hasSubstantialContent: true,
          recommendCreate: true,
        },
      });
    }
  };

  // Create the actual log
  const createLogForChat = async (): Promise<InteractionLog | null> => {
    setIsCreatingLog(true);
    try {
      toast.loading('Generating chat reflection...', { id: 'create-chat-log' });
      
      const response = await fetch(`/api/chats/${chatId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create log');
      }

      const newLog = await response.json();
      
      toast.success('Chat reflection created successfully', { id: 'create-chat-log' });
      
      // Close dialog and reset state
      setLogDialogState({ show: false, analysis: null });
      
      return newLog;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create log', { id: 'create-chat-log' });
      return null;
    } finally {
      setIsCreatingLog(false);
    }
  };

  const closeLogDialog = () => {
    setLogDialogState({ show: false, analysis: null });
  };

  return {
    // Original function
    createLogForChat,
    
    // Enhanced functions
    checkAndShowLogDialog,
    closeLogDialog,
    analyzeMessagesForLog,
    
    // State
    isCreatingLog,
    logDialogState,
  };
}