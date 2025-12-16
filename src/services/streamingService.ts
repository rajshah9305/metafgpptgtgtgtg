interface StreamEvent {
  id: string;
  type: 'thinking' | 'output' | 'function_call' | 'error' | 'system' | 'agent_status';
  content: string;
  timestamp: Date;
  agentId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

type StreamListener = (event: StreamEvent) => void;

class StreamingService {
  private listeners: Set<StreamListener> = new Set();
  private events: StreamEvent[] = [];
  private maxEvents = 100;

  subscribe(listener: StreamListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: Omit<StreamEvent, 'id' | 'timestamp'>): void {
    const streamEvent: StreamEvent = {
      ...event,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(streamEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.listeners.forEach(listener => listener(streamEvent));
  }

  getEvents(): StreamEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  emitThinking(content: string, agentId?: string, taskId?: string): void {
    this.emit({ type: 'thinking', content, agentId, taskId });
  }

  emitOutput(content: string, agentId?: string, taskId?: string): void {
    this.emit({ type: 'output', content, agentId, taskId });
  }

  emitFunctionCall(functionName: string, params: any, agentId?: string, taskId?: string): void {
    this.emit({ 
      type: 'function_call', 
      content: `Calling ${functionName}()`, 
      agentId, 
      taskId,
      metadata: { function: functionName, params }
    });
  }

  emitAgentStatus(agentId: string, status: 'idle' | 'running' | 'paused'): void {
    this.emit({ 
      type: 'agent_status', 
      content: `Agent ${status}`, 
      agentId,
      metadata: { status }
    });
  }

  emitError(error: string, agentId?: string, taskId?: string): void {
    this.emit({ type: 'error', content: error, agentId, taskId });
  }
}

export const streamingService = new StreamingService();
export type { StreamEvent, StreamListener };