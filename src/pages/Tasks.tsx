import { useState, useCallback } from 'react';
import { base44, type Task } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import { Play, RotateCw, CheckCircle2, AlertCircle, Clock, Plus, Trash2, Bot, Copy, Link as LinkIcon, FileJson, Monitor, ExternalLink, X, Code } from "lucide-react";
import { Link } from 'react-router-dom';
import { streamingService } from '@/services/streamingService';
import { validateTaskData, validateGroqApiKey, sanitizeInput } from '@/utils/validation';

interface GroqResponse {
  choices: Array<{
    delta?: { content?: string };
    message?: { content?: string };
  }>;
  error?: { message: string };
}

class GroqAPIClient {
  private static instance: GroqAPIClient;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 100; // ms between requests

  static getInstance(): GroqAPIClient {
    if (!GroqAPIClient.instance) {
      GroqAPIClient.instance = new GroqAPIClient();
    }
    return GroqAPIClient.instance;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        this.lastRequestTime = Date.now();
      }
    }
    
    this.isProcessing = false;
  }

  async inference(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: {
      jsonMode?: boolean;
      onChunk?: (content: string) => void;
      onThinking?: (message: string | null) => void;
    } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeRequest(apiKey, model, messages, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async executeRequest(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    { jsonMode = false, onChunk, onThinking }: {
      jsonMode?: boolean;
      onChunk?: (content: string) => void;
      onThinking?: (message: string | null) => void;
    }
  ): Promise<string> {
    this.validateApiKey(apiKey);
    
    if (onThinking) onThinking("Connecting to Groq API...");

    const body = this.buildRequestBody(model, messages, jsonMode);
    
    if (onThinking) onThinking("Sending request to AI agent...");

    const response = await this.makeRequest(apiKey, body);
    
    if (onThinking) onThinking("Agent is thinking...");

    return this.processStreamResponse(response, onChunk, onThinking);
  }

  private validateApiKey(apiKey: string): void {
    if (!apiKey?.trim()) {
      throw new Error("Groq API Key is required. Please configure it in Settings.");
    }

    if (!apiKey.startsWith('gsk_') || apiKey.length < 40) {
      throw new Error("Invalid Groq API key format. Please check your API key.");
    }
  }

  private buildRequestBody(model: string, messages: Array<{ role: string; content: string }>, jsonMode: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: model === "moonshotai/kimi-k2-instruct-0905" ? 0.7 : 1,
      max_completion_tokens: this.getMaxTokens(model),
      top_p: 1,
      stream: true,
      stop: null
    };

    if (model === "openai/gpt-oss-120b") {
      body.reasoning_effort = "medium";
      body.tools = [{ type: "browser_search" }, { type: "code_interpreter" }];
    }

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    return body;
  }

  private getMaxTokens(model: string): number {
    const tokenLimits: Record<string, number> = {
      "meta-llama/llama-4-maverick-17b-128e-instruct": 8192,
      "meta-llama/llama-4-scout-17b-16e-instruct": 8192,
      "moonshotai/kimi-k2-instruct-0905": 16384,
      "llama-3.3-70b-versatile": 32768,
      "openai/gpt-oss-120b": 65536
    };
    return tokenLimits[model] || 32768;
  }

  private async makeRequest(apiKey: string, body: Record<string, unknown>): Promise<Response> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "RajAI/1.0.0"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return response;
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData: GroqResponse = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Use default error message if JSON parsing fails
    }

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your Groq API key in Settings.");
    }
    if (response.status >= 500) {
      throw new Error("Groq API is temporarily unavailable. Please try again later.");
    }

    throw new Error(errorMessage);
  }

  private async processStreamResponse(
    response: Response,
    onChunk?: (content: string) => void,
    onThinking?: (message: string | null) => void
  ): Promise<string> {
    if (!response.body) {
      throw new Error("No response body received from API");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullContent = "";
    let firstChunk = true;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line === 'data: [DONE]') {
            return fullContent;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const json: GroqResponse = JSON.parse(line.substring(6));
              const content = json.choices[0]?.delta?.content || "";
              
              if (content) {
                if (firstChunk && onThinking) {
                  onThinking(null);
                  firstChunk = false;
                }
                
                fullContent += content;
                onChunk?.(fullContent);
              }
            } catch {
              // Skip malformed JSON chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }
}

const groqClient = GroqAPIClient.getInstance();

const runGroqInference = async (
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  jsonMode = false,
  onChunk?: (content: string) => void,
  onThinking?: (message: string | null) => void
): Promise<string> => {
  return groqClient.inference(apiKey, model, messages, {
    jsonMode,
    onChunk,
    onThinking
  });
};

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    agent_id: '',
    parent_task_id: 'none',
    output_format: 'text'
  });
  
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'created_date'>) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({id, data}: {id: string, data: Partial<Task>}) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  });

  const handleRunTask = useCallback(async (task: Task) => {
    const apiKey = localStorage.getItem('groq_api_key');
    const keyValidation = validateGroqApiKey(apiKey ?? '');
    
    if (!keyValidation.isValid) {
      toast.error(keyValidation.error || "Please configure your Groq API Key in Settings first");
      return;
    }

    const agent = agents?.find(a => a.id === task.agent_id);
    if (!agent) {
      toast.error("Assigned agent not found");
      return;
    }

    setProcessingId(task.id);
    setStreamingContent("");
    setThinkingMessage("Initializing agent...");
    updateTaskMutation.mutate({ id: task.id, data: { status: 'in_progress', result: '' } });
    
    streamingService.emitAgentStatus(agent.id, 'running');
    streamingService.emitThinking("Task execution started", agent.id, task.id);

    try {
      let systemPrompt = agent.system_prompt;
      let userContent = task.description;

      if (task.parent_task_id) {
        const parentTask = tasks?.find(t => t.id === task.parent_task_id);
        if (parentTask) {
          if (parentTask.status !== 'done') {
            throw new Error(`Parent task "${parentTask.title}" is not completed yet.`);
          }
          setThinkingMessage("Loading context from parent task...");
          userContent = `[CONTEXT FROM PREVIOUS TASK "${parentTask.title}"]:\n${parentTask.result}\n\n[CURRENT TASK INSTRUCTIONS]:\n${task.description}`;
        }
      }

      if (task.output_format === 'json_object') {
        systemPrompt += "\n\nIMPORTANT: You must output valid JSON only.";
      }

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ];
      
      const result = await runGroqInference(
        apiKey!, 
        agent.model, 
        messages, 
        task.output_format === 'json_object',
        (chunk: string) => {
          setStreamingContent(chunk);
          streamingService.emitOutput(chunk, agent.id, task.id);
        },
        (thinking: string | null) => {
          setThinkingMessage(thinking || "");
          if (thinking) streamingService.emitThinking(thinking, agent.id, task.id);
        }
      );
      
      updateTaskMutation.mutate({ 
        id: task.id, 
        data: { 
          status: 'done', 
          result: result 
        } 
      });
      streamingService.emitOutput(`Task completed: ${task.title}`, agent.id, task.id);
      streamingService.emitAgentStatus(agent.id, 'idle');
      toast.success("Task completed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateTaskMutation.mutate({ 
        id: task.id, 
        data: { 
          status: 'failed', 
          result: `Error: ${errorMessage}` 
        } 
      });
      streamingService.emitError(`Task failed: ${errorMessage}`, agent.id, task.id);
      streamingService.emitAgentStatus(agent.id, 'idle');
      toast.error(`Task failed: ${errorMessage}`);
    } finally {
      setProcessingId(null);
      setStreamingContent("");
      setThinkingMessage("");
    }
  }, [agents, tasks, updateTaskMutation]);

  const statusConfig = {
    todo: { icon: Clock, color: "text-gray-600", bg: "bg-gray-100" },
    in_progress: { icon: RotateCw, color: "text-orange-600", bg: "bg-orange-100", spin: true },
    done: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="bg-orange-600 p-5 rounded-2xl shadow-md animate-pulse relative overflow-hidden">
              <Play className="h-10 w-10 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-80" />
            </div>
            <div className="flex-1">
              <h1 className="text-h1 mb-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Task Orchestration</h1>
              <p className="text-body-lg text-gray-600 mb-6 max-w-2xl">Build and execute intelligent agent workflows with advanced task chaining and real-time monitoring</p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="status-indicator">
                  <div className="status-dot bg-slate-400" />
                  <span className="text-body-sm font-semibold text-slate-700">{tasks?.filter(t => t.status === 'todo').length || 0} pending</span>
                </div>
                <div className="status-indicator">
                  <div className="status-dot bg-orange-500 animate-pulse" />
                  <span className="text-body-sm font-semibold text-slate-700">{tasks?.filter(t => t.status === 'in_progress').length || 0} running</span>
                </div>
                <div className="status-indicator">
                  <div className="status-dot bg-green-500" />
                  <span className="text-body-sm font-semibold text-slate-700">{tasks?.filter(t => t.status === 'done').length || 0} completed</span>
                </div>
                <div className="status-indicator">
                  <div className="status-dot bg-red-500" />
                  <span className="text-body-sm font-semibold text-slate-700">{tasks?.filter(t => t.status === 'failed').length || 0} failed</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setTaskFormData({
                    title: '',
                    description: '',
                    agent_id: '',
                    parent_task_id: 'none',
                    output_format: 'text'
                  });
                }
              }} 
              className={`btn btn-lg px-10 py-4 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                showForm 
                  ? 'bg-slate-500 hover:bg-slate-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
              }`}
            >
              {showForm ? (
                <>
                  <X className="w-5 h-5 mr-3" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-3" />
                  Create New Task
                </>
              )}
            </Button>
            {tasks && tasks.length > 0 && (
              <Button 
                variant="outline" 
                className="btn btn-outline btn-lg px-8 py-4 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold transition-all duration-300 hover:scale-105"
              >
                <Monitor className="w-5 h-5 mr-2" />
                View All Output
              </Button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <Card className="card-elevated animate-slide-up">
          <CardHeader className="pb-6 border-b border-slate-100">
            <CardTitle className="flex items-center gap-3 text-h3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              New Task Configuration
            </CardTitle>
            <p className="text-body-sm text-slate-600 mt-2">
              Configure a new task with detailed instructions and agent assignment
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              
              const sanitizedData = {
                title: sanitizeInput(taskFormData.title),
                description: sanitizeInput(taskFormData.description),
                agent_id: taskFormData.agent_id,
                parent_task_id: taskFormData.parent_task_id,
                output_format: taskFormData.output_format
              };

              const validation = validateTaskData(sanitizedData);
              if (!validation.isValid) {
                toast.error(validation.errors[0]);
                return;
              }

              try {
                createTaskMutation.mutate({
                  title: sanitizedData.title,
                  description: sanitizedData.description,
                  agent_id: sanitizedData.agent_id,
                  parent_task_id: !sanitizedData.parent_task_id || sanitizedData.parent_task_id === "none" ? null : sanitizedData.parent_task_id,
                  output_format: sanitizedData.output_format === 'json_object' ? 'json_object' : 'text',
                  status: 'todo',
                  result: ''
                });
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to create task");
              }
              
              setTaskFormData({
                title: '',
                description: '',
                agent_id: '',
                parent_task_id: 'none',
                output_format: 'text'
              });
            }} className="space-y-6">
              <div className="enterprise-grid enterprise-grid-2 gap-6">
                <div className="space-y-2">
                  <label className="text-body-sm font-semibold text-slate-700 flex items-center gap-2">
                    Task Title *
                    <span className="badge badge-info">Required</span>
                  </label>
                  <Input 
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Research market trends, Analyze user feedback, Generate report" 
                    className="form-input"
                    required 
                  />
                  <p className="text-caption text-slate-500">Provide a clear, descriptive title for this task</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-body-sm font-semibold text-slate-700 flex items-center gap-2">
                    Assign Agent *
                    <span className="badge badge-info">Required</span>
                  </label>
                  <Select 
                    value={taskFormData.agent_id}
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, agent_id: value }))}
                  >
                    <SelectTrigger className="form-select">
                      <SelectValue placeholder="Choose an agent..." />
                    </SelectTrigger>
                    <SelectContent className="card border-0 shadow-xl">
                      {agents?.map(agent => (
                        <SelectItem key={agent.id} value={agent.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-600 p-1.5 rounded-md">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold">{agent.name}</div>
                              <div className="text-caption text-slate-500">{agent.role}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-caption text-slate-500">Select the agent that will execute this task</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-body-sm font-semibold text-slate-700">Prerequisite Task</label>
                  <Select 
                    value={taskFormData.parent_task_id}
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, parent_task_id: value }))}
                  >
                    <SelectTrigger className="form-select">
                      <SelectValue placeholder="Link to previous task..." />
                    </SelectTrigger>
                    <SelectContent className="card border-0 shadow-xl">
                      <SelectItem value="none" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-400 p-1.5 rounded-md">
                            <X className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">No Dependency</div>
                            <div className="text-caption text-slate-500">This task runs independently</div>
                          </div>
                        </div>
                      </SelectItem>
                      {tasks?.map(task => (
                        <SelectItem key={task.id} value={task.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${
                              task.status === 'done' ? 'bg-green-500' : 
                              task.status === 'in_progress' ? 'bg-orange-500' :
                              task.status === 'failed' ? 'bg-red-500' : 'bg-slate-400'
                            }`}>
                              {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-white" /> : 
                               task.status === 'in_progress' ? <RotateCw className="w-4 h-4 text-white" /> :
                               task.status === 'failed' ? <AlertCircle className="w-4 h-4 text-white" /> :
                               <Clock className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-caption text-slate-500 capitalize">{task.status.replace('_', ' ')}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-caption text-slate-500">Optional: Chain this task to run after another completes</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-body-sm font-semibold text-slate-700">Output Format</label>
                  <Select 
                    value={taskFormData.output_format}
                    onValueChange={(value) => setTaskFormData(prev => ({ ...prev, output_format: value }))}
                  >
                    <SelectTrigger className="form-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="card border-0 shadow-xl">
                      <SelectItem value="text" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-1.5 rounded-md">
                            <FileJson className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Free Text / Markdown</div>
                            <div className="text-caption text-slate-500">Natural language output with formatting</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="json_object" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-1.5 rounded-md">
                            <Code className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Structured JSON</div>
                            <div className="text-caption text-slate-500">Machine-readable structured data</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-caption text-slate-500">Choose how the agent should format its response</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-body-sm font-semibold text-slate-700 flex items-center gap-2">
                  Task Instructions *
                  <span className="badge badge-info">Required</span>
                </label>
                <Textarea 
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed instructions for the agent. Be specific about what you want accomplished, any constraints, and the expected outcome..." 
                  className="form-textarea h-32 resize-none" 
                  required 
                />
                <p className="text-caption text-slate-500">Clear, detailed instructions help the agent produce better results</p>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setTaskFormData({
                      title: '',
                      description: '',
                      agent_id: '',
                      parent_task_id: 'none',
                      output_format: 'text'
                    });
                  }}
                  className="btn btn-outline px-6 py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-semibold"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!taskFormData.title || !taskFormData.description || !taskFormData.agent_id}
                  className="btn btn-primary px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tasksLoading ? (
          [1,2].map(i => (
            <Card key={i} className="h-64 animate-pulse">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg loading-skeleton" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded loading-skeleton" />
                    <div className="h-3 bg-gray-200 rounded w-3/4 loading-skeleton" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded loading-skeleton" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 loading-skeleton" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : !agents || agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-black mb-4">No agents available. Create agents first to start building tasks.</p>
            <Link to="/agents">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </Link>
          </div>
        ) : tasks?.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-gray-300">
            <div className="bg-orange-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 opacity-20">
              <Clock className="w-12 h-12 text-white mx-auto mt-3" />
            </div>
            <h3 className="text-h3 mb-3">No tasks created</h3>
            <p className="text-body text-gray-600 mb-6">Create your first task to begin orchestrating your AI workforce</p>
            <Button onClick={() => setShowForm(true)} className="px-8 py-3">
              <Plus className="w-5 h-5 mr-3" />
              Create Your First Task
            </Button>
          </Card>
        ) : (
          tasks?.map((task, index) => {
            const StatusIcon = statusConfig[task.status]?.icon || Clock;
            const agent = agents?.find(a => a.id === task.agent_id);
            const isProcessing = processingId === task.id || task.status === 'in_progress';

            return (
              <Card 
                key={task.id} 
                className="card border-l-4 border-l-orange-600 animate-scale-in hover:scale-[1.01] transition-all duration-300"
                style={{animationDelay: `${index * 50}ms`}}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className={`p-3 rounded-md ${statusConfig[task.status]?.bg || 'bg-gray-100'}`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig[task.status]?.color || 'text-gray-500'} ${(statusConfig[task.status] as any)?.spin ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          <span>{task.title}</span>
                          {task.output_format === 'json_object' && (
                            <Badge variant="outline" className="text-xs">
                              <FileJson className="w-3 h-3 mr-1" /> JSON
                            </Badge>
                          )}
                          {task.parent_task_id && (
                            <Badge variant="warning" className="text-xs">
                              <LinkIcon className="w-3 h-3 mr-1" /> Chained
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-3 h-3 text-orange-500" />
                            <span className="font-medium text-black">{agent?.name || 'Unknown Agent'}</span>
                          </div>
                          <span>•</span>
                          <span>{task.created_date ? new Date(task.created_date).toLocaleDateString() : 'N/A'}</span>
                          <Badge variant={
                            task.status === 'done' ? 'success' :
                            task.status === 'failed' ? 'error' :
                            task.status === 'in_progress' ? 'warning' :
                            'default'
                          } className="text-xs">
                            {task.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleRunTask(task)}
                        disabled={isProcessing}
                        variant={task.status === 'todo' ? 'default' : 'outline'}
                      >
                        {isProcessing ? (
                          <>
                            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {task.status === 'todo' ? 'Execute' : 'Rerun'}
                          </>
                        )}
                      </Button>
                      {isProcessing && processingId === task.id && (
                        <Link to="/output">
                          <Button size="sm" variant="outline">
                            <Monitor className="w-4 h-4 mr-2" />
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteTaskMutation.mutate(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-black mb-2">Task Instructions</h4>
                      <div className="text-sm text-black whitespace-pre-wrap bg-gray-50 p-4 rounded-md min-h-[120px] max-h-80 overflow-y-auto border border-gray-200">
                        {task.description}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-black">Agent Output</h4>
                        {task.status === 'done' && (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {isProcessing && processingId === task.id && (
                          <Badge variant="warning" className="text-xs animate-pulse">
                            <RotateCw className="w-3 h-3 mr-1 animate-spin" />
                            Streaming
                          </Badge>
                        )}
                      </div>
                      <div className={`text-sm p-4 rounded-md min-h-[120px] max-h-80 overflow-y-auto border ${
                        isProcessing && processingId === task.id
                          ? 'bg-black text-white border-orange-500' 
                          : 'bg-white text-black border-gray-200'
                      }`}>
                        {isProcessing && processingId === task.id ? (
                          <div className="space-y-3 animate-slide-up">
                            {thinkingMessage && !streamingContent && (
                              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-md border border-orange-500/30 animate-glow">
                                <RotateCw className="w-4 h-4 text-orange-400 animate-spin flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-orange-300 font-medium text-xs mb-1 flex items-center gap-2">
                                    Agent Status
                                    <div className="flex gap-1">
                                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                    </div>
                                  </div>
                                  <div className="text-orange-200 text-sm">{thinkingMessage}</div>
                                </div>
                              </div>
                            )}
                            {streamingContent ? (
                              <div className="font-mono text-sm whitespace-pre-wrap text-gray-100 leading-relaxed break-words">
                                {streamingContent}
                                <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse"/>
                              </div>
                            ) : !thinkingMessage && (
                              <div className="flex items-center gap-2 text-orange-300">
                                <RotateCw className="w-4 h-4 animate-spin" />
                                <span>Preparing agent...</span>
                                <div className="flex gap-1 ml-2">
                                  <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                  <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                  <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : task.result ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{task.result}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 italic">
                            <Clock className="w-4 h-4 mr-2" />
                            Awaiting execution...
                          </div>
                        )}
                      </div>
                      {task.result && !isProcessing && (
                        <div className="flex justify-end mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (task.result) navigator.clipboard.writeText(task.result);
                              toast.success("Result copied to clipboard");
                            }}
                          >
                            <Copy className="w-3 h-3 mr-2" />
                            Copy Output
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}