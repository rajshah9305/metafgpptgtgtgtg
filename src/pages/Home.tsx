import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Zap, Sparkles, Users, CheckSquare, Monitor } from "lucide-react";

import ActivityDashboard from '@/components/ActivityDashboard';

export default function Home() {
  const [agentStatus, setAgentStatus] = useState<Record<string, 'idle' | 'running' | 'paused'>>({});

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const hasKey = !!localStorage.getItem('groq_api_key');

  useEffect(() => {
    if (agents && agents.length > 0) {
      const simulatedStatus: Record<string, 'idle' | 'running' | 'paused'> = {};
      agents.forEach((agent, index) => {
        simulatedStatus[agent.id] = index % 3 === 0 ? 'running' : index % 3 === 1 ? 'paused' : 'idle';
      });
      setAgentStatus(simulatedStatus);
    }
  }, [agents]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="card card-elevated p-8 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            <Zap className="w-4 h-4" />
            <span className="text-label font-medium">Enterprise AI Workforce Platform</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-display">
              <span className="block">AI Workforce</span>
              <span className="block text-orange-600">Orchestration</span>
            </h1>
            
            <p className="text-body-lg max-w-2xl mx-auto">
              Enterprise-grade platform for intelligent agent management. Real-time monitoring, advanced workflows, and production-scale performance.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/tasks">
              <button className="btn btn-primary btn-lg">
                <Sparkles className="w-5 h-5 mr-3" />
                Launch Control Center
                <ArrowRight className="w-5 h-5 ml-3" />
              </button>
            </Link>
            {!hasKey && (
              <Link to="/settings">
                <button className="btn btn-outline btn-lg">
                  Configure API Access
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {!hasKey && (
        <div className="card p-6 border-l-4 border-l-orange-500 bg-orange-50 animate-slide-up">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-h4 mb-2">System Configuration Required</h3>
              <p className="text-body mb-4">
                Configure your Groq API Key in settings to activate your AI workforce and unlock full platform capabilities.
              </p>
              <Link to="/settings">
                <button className="btn btn-primary">
                  Configure Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6">
        <Link to="/agents">
          <div className="card card-elevated p-6 hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-h5 mb-1">Manage Agents</h3>
                <p className="text-body-sm text-gray-600">Configure your AI workforce</p>
                <div className="status-indicator mt-2">
                  <div className="status-dot bg-green-500"></div>
                  <span className="text-caption font-medium">{agents?.length || 0} deployed</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/tasks">
          <div className="card card-elevated p-6 hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-h5 mb-1">Execute Tasks</h3>
                <p className="text-body-sm text-gray-600">Orchestrate workflows</p>
                <div className="status-indicator mt-2">
                  <div className="status-dot bg-yellow-500"></div>
                  <span className="text-caption font-medium">{tasks?.filter(t => t.status === 'in_progress').length || 0} running</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
        
        <Link to="/output">
          <div className="card card-elevated p-6 hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-h5 mb-1">Live Output</h3>
                <p className="text-body-sm text-gray-600">Monitor real-time activity</p>
                <div className="status-indicator mt-2">
                  <div className="status-dot bg-green-500 animate-pulse"></div>
                  <span className="text-caption font-medium">Live streaming</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Activity Dashboard */}
      <ActivityDashboard 
        agents={agents} 
        tasks={tasks} 
        agentStatus={agentStatus}
      />
    </div>
  );
}