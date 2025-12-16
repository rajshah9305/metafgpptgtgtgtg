import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Bot, Trash2, Edit2, Sparkles, Play, Pause, ArrowLeft, Save, X, Settings, Zap, Brain, Code, Database } from "lucide-react";
import type { Agent, CreateAgentInput } from "@/api/base44Client";
import { streamingService } from '@/services/streamingService';
import { validateAgentData, sanitizeInput } from '@/utils/validation';

export default function Agents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentStatus, setAgentStatus] = useState<Record<string, 'idle' | 'running' | 'paused'>>({});
  
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentInput) => base44.entities.Agent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsDialogOpen(false);
      setEditingAgent(null);
      setFormData({
        name: '',
        role: '',
        model: 'openai/gpt-oss-120b',
        functions: '',
        capabilities: '',
        system_prompt: ''
      });
      toast.success("Agent created successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create agent");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({id, data}: {id: string, data: Partial<Agent>}) => base44.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsDialogOpen(false);
      setEditingAgent(null);
      setFormData({
        name: '',
        role: '',
        model: 'openai/gpt-oss-120b',
        functions: '',
        capabilities: '',
        system_prompt: ''
      });
      toast.success("Agent updated successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update agent");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Agent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success("Agent deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete agent");
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    model: 'openai/gpt-oss-120b',
    functions: '',
    capabilities: '',
    system_prompt: ''
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const sanitizedData = {
      name: sanitizeInput(formData.name.trim()),
      role: sanitizeInput(formData.role.trim()),
      system_prompt: sanitizeInput(formData.system_prompt.trim()),
      model: formData.model,
      functions: sanitizeInput(formData.functions.trim()),
      capabilities: sanitizeInput(formData.capabilities.trim())
    };

    const validation = validateAgentData({
      name: sanitizedData.name,
      role: sanitizedData.role,
      system_prompt: sanitizedData.system_prompt,
      model: sanitizedData.model
    });

    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    // Build enhanced system prompt
    const promptParts = [sanitizedData.system_prompt];
    if (sanitizedData.functions) {
      promptParts.push(`\n\nAVAILABLE FUNCTIONS: ${sanitizedData.functions}`);
    }
    if (sanitizedData.capabilities) {
      promptParts.push(`\n\nCAPABILITIES: ${sanitizedData.capabilities}`);
    }
    const enhancedPrompt = promptParts.join('');

    const agentData: CreateAgentInput = { 
      name: sanitizedData.name, 
      role: sanitizedData.role, 
      system_prompt: enhancedPrompt, 
      model: sanitizedData.model 
    };

    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: agentData });
    } else {
      createMutation.mutate(agentData);
    }
  };

  useEffect(() => {
    if (isDialogOpen && editingAgent) {
      // Parse the system prompt to extract functions and capabilities
      const basePart = editingAgent.system_prompt.split('\n\nAVAILABLE FUNCTIONS:')[0] || '';
      const functionsMatch = editingAgent.system_prompt.match(/AVAILABLE FUNCTIONS:\s*([^\n]+)/);
      const capabilitiesMatch = editingAgent.system_prompt.match(/CAPABILITIES:\s*([\s\S]*?)$/);
      
      setFormData({
        name: editingAgent.name,
        role: editingAgent.role,
        model: editingAgent.model,
        functions: functionsMatch ? functionsMatch[1].trim() : '',
        capabilities: capabilitiesMatch ? capabilitiesMatch[1].trim() : '',
        system_prompt: basePart.trim()
      });
    } else if (isDialogOpen) {
      // Reset form when opening dialog for new agent
      setFormData({
        name: '',
        role: '',
        model: 'openai/gpt-oss-120b',
        functions: '',
        capabilities: '',
        system_prompt: ''
      });
    }
  }, [isDialogOpen, editingAgent]);

  const predefinedAgents = [
    { 
      name: "Product Manager", 
      role: "Manager", 
      system_prompt: "You are an experienced Product Manager. Break down complex requirements into clear, actionable tasks and user stories. Focus on user value and feasibility.\n\nAVAILABLE FUNCTIONS: Requirements analysis, User story creation, Roadmap planning, Stakeholder communication\n\nCAPABILITIES: Strategic thinking, Market analysis, Feature prioritization, Cross-functional collaboration", 
      model: "openai/gpt-oss-120b" 
    },
    { 
      name: "Software Architect", 
      role: "Architect", 
      system_prompt: "You are a Senior Software Architect. Design robust system architectures and suggest scalable solutions. Prefer maintainable and efficient designs.\n\nAVAILABLE FUNCTIONS: System design, Architecture review, Technology selection, Performance optimization\n\nCAPABILITIES: Distributed systems, Microservices, Cloud architecture, Security patterns", 
      model: "meta-llama/llama-4-maverick-17b-128e-instruct" 
    },
    { 
      name: "Python Expert", 
      role: "Engineer", 
      system_prompt: "You are a Python expert. Write clean, efficient, and well-documented Python code following best practices and PEP 8 standards.\n\nAVAILABLE FUNCTIONS: Code generation, Code review, Testing, Debugging, Package management\n\nCAPABILITIES: Django/Flask, FastAPI, Data science libraries, Async programming, Database integration", 
      model: "llama-3.3-70b-versatile" 
    },
  ];

  const addPredefined = async () => {
    try {
      for (const agent of predefinedAgents) {
        await base44.entities.Agent.create(agent);
      }
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success("Default team added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add default team");
    }
  };

  const toggleAgentStatus = (agentId: string) => {
    const currentStatus = agentStatus[agentId] || 'idle';
    const newStatus = currentStatus === 'idle' ? 'running' : currentStatus === 'running' ? 'paused' : 'idle';
    setAgentStatus(prev => ({ ...prev, [agentId]: newStatus }));
    
    streamingService.emitAgentStatus(agentId, newStatus);
    
    const statusMessages = {
      running: 'Agent activated',
      paused: 'Agent paused',
      idle: 'Agent stopped'
    };
    toast.success(statusMessages[newStatus]);
  };

  const getAgentIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager': return Settings;
      case 'architect': return Database;
      case 'engineer': return Code;
      default: return Bot;
    }
  };

  if (selectedAgent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button className="btn btn-secondary" onClick={() => setSelectedAgent(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-3 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-h2">{selectedAgent.name}</h1>
              <p className="text-body-sm text-gray-600">Agent Configuration & Management</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h3 className="text-h4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Agent Details
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label">Name</label>
                  <p className="text-h5">{selectedAgent.name}</p>
                </div>
                <div>
                  <label className="text-label">Role</label>
                  <p className="text-h5">{selectedAgent.role}</p>
                </div>
                <div>
                  <label className="text-label">Model</label>
                  <p className="text-body-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {selectedAgent.model.includes('/') ? selectedAgent.model.split('/').pop() : selectedAgent.model}
                  </p>
                </div>
                <div>
                  <label className="text-label">Status</label>
                  <div className="status-indicator">
                    <div className={`status-dot ${
                      agentStatus[selectedAgent.id] === 'running' ? 'bg-green-500 animate-pulse' :
                      agentStatus[selectedAgent.id] === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-body-sm font-medium capitalize">
                      {agentStatus[selectedAgent.id] || 'idle'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-label">System Prompt</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <pre className="text-body-sm text-gray-700 whitespace-pre-wrap">{selectedAgent.system_prompt}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-h4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Agent Controls
              </h3>
            </div>
            <div className="card-content space-y-4">
              <button 
                className="btn btn-primary w-full" 
                onClick={() => toggleAgentStatus(selectedAgent.id)}
              >
                {agentStatus[selectedAgent.id] === 'running' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Agent
                  </>
                ) : agentStatus[selectedAgent.id] === 'paused' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Agent
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Agent
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-secondary w-full"
                onClick={() => {
                  setEditingAgent(selectedAgent);
                  setIsDialogOpen(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Configuration
              </button>
              
              <button 
                className="btn btn-secondary w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if(window.confirm('Delete this agent?')) {
                    deleteMutation.mutate(selectedAgent.id);
                    setSelectedAgent(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="bg-orange-600 p-4 rounded-xl shadow-sm">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-h1 mb-3">AI Agent Management</h1>
            <p className="text-body-lg text-gray-600 mb-6 max-w-2xl">Configure and deploy your specialized AI workforce with advanced capabilities and real-time monitoring</p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="status-indicator">
                <div className="status-dot bg-blue-500"></div>
                <span className="text-body-sm font-medium">{agents?.length || 0} agents deployed</span>
              </div>
              <div className="status-indicator">
                <div className="status-dot bg-green-500 animate-pulse"></div>
                <span className="text-body-sm font-medium">{Object.values(agentStatus).filter(s => s === 'running').length} active</span>
              </div>
              <div className="status-indicator">
                <div className="status-dot bg-yellow-500"></div>
                <span className="text-body-sm font-medium">{Object.values(agentStatus).filter(s => s === 'paused').length} paused</span>
              </div>
            </div>
          </div>
        </div>
      
        <div className="flex flex-col sm:flex-row gap-4">
          {(!agents || agents.length === 0) && (
            <button 
              className="btn btn-outline btn-lg"
              onClick={addPredefined}
            >
              <Sparkles className="w-5 h-5 mr-3" />
              Deploy Default Team
            </button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAgent(null);
              setFormData({
                name: '',
                role: '',
                model: 'openai/gpt-oss-120b',
                functions: '',
                capabilities: '',
                system_prompt: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <button className="btn btn-primary btn-lg">
                <Plus className="w-5 h-5 mr-3" />
                Create New Agent
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-6 border-b border-gray-100">
                <DialogTitle className="text-h3 flex items-center gap-3">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  {editingAgent ? 'Edit Agent Configuration' : 'Create New Agent'}
                </DialogTitle>
                <p className="text-body-sm text-gray-600 mt-2">
                  {editingAgent ? 'Modify your agent\'s configuration and capabilities' : 'Configure a new AI agent with specialized skills and functions'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">
                      Agent Name *
                      <span className="badge badge-info ml-2">Required</span>
                    </label>
                    <input 
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Code Wizard, Data Analyst, Content Creator"
                      required 
                    />
                    <p className="form-helper">Choose a descriptive name for your agent</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Role *
                      <span className="badge badge-info ml-2">Required</span>
                    </label>
                    <input 
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g. Senior Engineer, Product Manager, Designer"
                      required 
                    />
                    <p className="form-helper">Define the agent's primary role</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    AI Model *
                    <span className="badge badge-info ml-2">Required</span>
                  </label>
                  <Select 
                    value={formData.model}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger className="form-input form-select">
                      <SelectValue placeholder="Select an AI model..." />
                    </SelectTrigger>
                    <SelectContent className="card border-0 shadow-xl">
                      <SelectItem value="openai/gpt-oss-120b" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-600 p-1.5 rounded-md">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-label">GPT-OSS-120B</div>
                            <div className="text-caption">Recommended • Advanced reasoning</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="meta-llama/llama-4-maverick-17b-128e-instruct" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-1.5 rounded-md">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-label">Llama 4 Maverick</div>
                            <div className="text-caption">8K context • Fast responses</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-1.5 rounded-md">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-label">Llama 4 Scout</div>
                            <div className="text-caption">8K context • Efficient</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="moonshotai/kimi-k2-instruct-0905" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500 p-1.5 rounded-md">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-label">Kimi K2</div>
                            <div className="text-caption">16K context • Multilingual</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile" className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-500 p-1.5 rounded-md">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-label">Llama 3.3 70B</div>
                            <div className="text-caption">32K context • Versatile</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="form-helper">Choose the AI model that best fits your agent's requirements</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Available Functions</label>
                    <input 
                      className="form-input"
                      value={formData.functions}
                      onChange={(e) => setFormData(prev => ({ ...prev, functions: e.target.value }))}
                      placeholder="e.g. Code generation, Testing, Debugging, Analysis"
                    />
                    <p className="form-helper">Comma-separated list of functions this agent can perform</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Capabilities</label>
                    <input 
                      className="form-input"
                      value={formData.capabilities}
                      onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
                      placeholder="e.g. Python, React, Database design, Machine Learning"
                    />
                    <p className="form-helper">Technologies and skills this agent specializes in</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    System Prompt *
                    <span className="badge badge-info ml-2">Required</span>
                  </label>
                  <textarea 
                    className="form-input form-textarea h-40 resize-none"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    placeholder="Define how this agent should behave, its personality, communication style, and approach to tasks..."
                    required 
                  />
                  <p className="form-helper">Core instructions that define the agent's behavior, personality, and approach to tasks</p>
                </div>
                
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!formData.name || !formData.role || !formData.system_prompt}
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Agent Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="card h-96 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-6">
                <div className="loading-skeleton w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <div className="loading-skeleton h-5 w-3/4 mb-2" />
                  <div className="loading-skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="loading-skeleton h-3 w-full" />
                <div className="loading-skeleton h-3 w-4/5" />
                <div className="loading-skeleton h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {!agents || agents.length === 0 ? (
            <div className="col-span-full text-center py-16 card card-elevated">
              <div className="bg-orange-600 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 opacity-20">
                <Bot className="w-8 h-8 text-white mx-auto mt-2" />
              </div>
              <h3 className="text-h3 mb-3">No agents deployed</h3>
              <p className="text-body text-gray-600 mb-6 max-w-md mx-auto">Create your first AI agent to begin building your intelligent workforce</p>
              <button 
                onClick={() => setIsDialogOpen(true)}
                className="btn btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-3" />
                Create Your First Agent
              </button>
            </div>
          ) : agents.map((agent, index) => {
            const AgentIcon = getAgentIcon(agent.role);
            const status = agentStatus[agent.id] || 'idle';
            
            return (
              <div 
                key={agent.id} 
                className="card card-elevated h-[420px] flex flex-col cursor-pointer group hover:scale-[1.02] transition-all animate-scale-in"
                onClick={() => setSelectedAgent(agent)}
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="card-header pb-4 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="bg-orange-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-all shadow-sm">
                        <AgentIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-h5 mb-3 truncate group-hover:text-orange-600 transition-colors">
                          {agent.name}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="badge badge-info">
                              {agent.role}
                            </span>
                            <span className="badge badge-neutral font-mono text-xs">
                              {agent.model.includes('/') ? (agent.model.split('/').pop() || '').substring(0, 12) + '...' : agent.model}
                            </span>
                          </div>
                          <div className="status-indicator">
                            <div className={`status-dot ${
                              status === 'running' ? 'bg-green-500 animate-pulse' :
                              status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-body-sm font-medium capitalize">{status}</span>
                            {status === 'running' && (
                              <div className="flex items-center gap-1 ml-2">
                                <div className="w-1 h-3 bg-green-400 rounded animate-bounce" />
                                <div className="w-1 h-2 bg-green-400 rounded animate-bounce" style={{animationDelay: '150ms'}} />
                                <div className="w-1 h-4 bg-green-400 rounded animate-bounce" style={{animationDelay: '300ms'}} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgentStatus(agent.id);
                        }}
                      >
                        {status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAgent(agent);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if(window.confirm('Delete this agent?')) deleteMutation.mutate(agent.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-content pt-0 flex-1 flex flex-col">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1 overflow-hidden">
                    <p className="text-body-sm text-gray-700 line-clamp-6 leading-relaxed">
                      {agent.system_prompt.split('\n\nAVAILABLE FUNCTIONS:')[0]}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="status-indicator">
                      <div className="status-dot bg-orange-400 animate-pulse"></div>
                      <span className="text-caption font-medium">Click to configure</span>
                    </div>
                    <div className="flex gap-2">
                      {agent.system_prompt.includes('AVAILABLE FUNCTIONS:') && (
                        <span className="badge badge-success">Functions</span>
                      )}
                      {agent.system_prompt.includes('CAPABILITIES:') && (
                        <span className="badge badge-info">Skills</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}