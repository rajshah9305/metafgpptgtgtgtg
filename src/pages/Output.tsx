import { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Bot, Brain, Zap, Play, Pause, RotateCw, MessageSquare, Eye, Download, Copy, Maximize2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";
import { streamingService, type StreamEvent } from '@/services/streamingService';



export default function Output() {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [messages, setMessages] = useState<StreamEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
  });

  useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLiveMode) return;
    
    const unsubscribe = streamingService.subscribe((event: StreamEvent) => {
      setMessages(prev => [...prev.slice(-49), event]);
    });
    
    setMessages(streamingService.getEvents());
    
    return unsubscribe;
  }, [isLiveMode]);

  const filteredMessages = selectedAgent === 'all' 
    ? messages 
    : messages.filter(msg => msg.agentId === selectedAgent);

  const getMessageIcon = (type: StreamEvent['type']) => {
    switch (type) {
      case 'thinking': return <Brain className="w-4 h-4 text-orange-500 animate-pulse" />;
      case 'output': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'function_call': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'error': return <RotateCw className="w-4 h-4 text-red-500" />;
      case 'system': return <Monitor className="w-4 h-4 text-gray-500" />;
      case 'agent_status': return <Bot className="w-4 h-4 text-blue-500" />;
    }
  };

  const getMessageStyle = (type: StreamEvent['type']) => {
    switch (type) {
      case 'thinking': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'output': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'function_call': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'system': return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'agent_status': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const exportOutput = () => {
    const output = filteredMessages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-output-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Output exported successfully");
  };

  const copyAllOutput = () => {
    const output = filteredMessages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    navigator.clipboard.writeText(output);
    toast.success("Output copied to clipboard");
  };

  return (
    <div className={`space-y-6 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="enterprise-accent-bg p-4 rounded-xl enterprise-shadow animate-pulse-professional">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="enterprise-heading-lg mb-2">Live Output Stream</h1>
            <p className="enterprise-body enterprise-text-secondary mb-3">Real-time agent conversations and processing</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLiveMode ? 'status-active' : 'status-idle'}`}></div>
                <span className="enterprise-caption font-semibold">{isLiveMode ? 'Live Streaming' : 'Paused'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="enterprise-caption font-semibold">{filteredMessages.length} messages</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by agent..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents?.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3" />
                    {agent.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          

          
          <div className="flex flex-wrap gap-3">
            <Button
              variant={isLiveMode ? 'outline' : 'default'}
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="px-6 py-2"
            >
              {isLiveMode ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isLiveMode ? 'Pause Stream' : 'Resume Stream'}
            </Button>
            
            <Button variant="outline" onClick={copyAllOutput} className="px-4 py-2">
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            
            <Button variant="outline" onClick={exportOutput} className="px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Export Log
            </Button>
            
            <Button variant="outline" onClick={() => setIsFullscreen(!isFullscreen)} className="px-4 py-2">
              <Maximize2 className="w-4 h-4 mr-2" />
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Stream */}
      <Card className="card border-l-4 border-l-orange-600">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-orange-600" />
            <span className="text-h3">Agent Activity Stream</span>
            {isLiveMode && (
              <Badge variant="success" className="animate-pulse px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="font-semibold">LIVE</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-96'} pr-2`}>
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No output yet. Start a task to see live agent activity.</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => {
                const agent = agents?.find(a => a.id === message.agentId);
                return (
                  <div 
                    key={message.id}
                    className={`p-4 rounded-lg border animate-slide-up ${getMessageStyle(message.type)}`}
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getMessageIcon(message.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {message.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {agent && (
                            <Badge variant="outline" className="text-xs">
                              <Bot className="w-3 h-3 mr-1" />
                              {agent.name}
                            </Badge>
                          )}
                          <span className="text-xs opacity-75">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          {message.type === 'output' ? (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          ) : (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast.success("Message copied");
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: filteredMessages.length, icon: MessageSquare, color: 'text-blue-600' },
          { label: 'Thinking Events', value: filteredMessages.filter(m => m.type === 'thinking').length, icon: Brain, color: 'text-orange-600' },
          { label: 'Function Calls', value: filteredMessages.filter(m => m.type === 'function_call').length, icon: Zap, color: 'text-purple-600' },
          { label: 'Active Agents', value: new Set(filteredMessages.map(m => m.agentId)).size, icon: Bot, color: 'text-green-600' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-lift animate-slide-up" style={{animationDelay: `${index * 100}ms`}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-black">{stat.value}</p>
                  </div>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}