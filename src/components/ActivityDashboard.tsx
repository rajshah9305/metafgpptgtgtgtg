import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Agent, Task } from '@/api/base44Client';
import { streamingService, type StreamEvent } from '@/services/streamingService';

interface ActivityDashboardProps {
  agents?: Agent[];
  tasks?: Task[];
  agentStatus?: Record<string, 'idle' | 'running' | 'paused'>;
}

export default function ActivityDashboard({ agents = [], tasks = [], agentStatus = {} }: ActivityDashboardProps) {
  const [realtimeEvents, setRealtimeEvents] = useState<StreamEvent[]>([]);
  
  useEffect(() => {
    const unsubscribe = streamingService.subscribe((event: StreamEvent) => {
      setRealtimeEvents(prev => [...prev.slice(-10), event]);
    });
    
    setRealtimeEvents(streamingService.getEvents().slice(-10));
    
    return unsubscribe;
  }, []);
  
  const runningAgents = Object.values(agentStatus).filter(status => status === 'running').length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const pendingTasks = tasks.filter(task => task.status === 'todo').length;
  const failedTasks = tasks.filter(task => task.status === 'failed').length;
  
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const recentActivity = realtimeEvents.length > 0 ? realtimeEvents : tasks
    .filter(task => task.created_date)
    .sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime())
    .slice(0, 5);

  const metrics = [
    {
      title: 'Active Agents',
      value: runningAgents,
      total: agents.length,
      icon: Zap,
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: '+12%'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: '+5%'
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      trend: '-3%'
    },
    {
      title: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: '+18%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="hover-lift glass-effect animate-slide-up" style={{animationDelay: `${index * 100}ms`}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-black">{metric.value}</p>
                      {metric.total && (
                        <span className="text-sm text-gray-500">/ {metric.total}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-green-600 font-medium">{metric.trend}</span>
                      <span className="text-xs text-gray-500">vs last week</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.bg}`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((item, index) => {
                if ('type' in item) {
                  // StreamEvent
                  const event = item as StreamEvent;
                  const agent = agents.find(a => a.id === event.agentId);
                  const typeConfig = {
                    thinking: { color: 'text-orange-600', bg: 'bg-orange-100', icon: Activity },
                    output: { color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
                    function_call: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Activity },
                    error: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
                    system: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
                    agent_status: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Activity },
                  };
                  const config = typeConfig[event.type];
                  const StatusIcon = config.icon;

                  return (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-black truncate">{event.content.slice(0, 50)}...</p>
                          <Badge variant="outline" className="text-xs">
                            {agent?.name || 'System'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  // Task
                  const task = item as Task;
                  const agent = agents.find(a => a.id === task.agent_id);
                  const statusConfig = {
                    todo: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
                    in_progress: { color: 'text-orange-600', bg: 'bg-orange-100', icon: Activity },
                    done: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
                    failed: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
                  };
                  const config = statusConfig[task.status];
                  const StatusIcon = config.icon;

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-black truncate">{task.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {agent?.name || 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {task.created_date ? new Date(task.created_date).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">Agent Performance</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Excellent</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '92%'}}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">Task Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600">{completionRate}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: `${completionRate}%`}}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">API Response Time</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-orange-600">Fast</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{width: '78%'}}></div>
              </div>
            </div>

            {failedTasks > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    {failedTasks} task{failedTasks > 1 ? 's' : ''} need attention
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}