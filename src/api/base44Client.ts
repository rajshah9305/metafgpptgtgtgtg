interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  model: string;
  created_date?: string;
}

type CreateAgentInput = Omit<Agent, 'id' | 'created_date'>;

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'failed';
  result?: string;
  agent_id: string;
  parent_task_id?: string | null;
  output_format?: 'text' | 'json_object';
  created_date?: string;
}

class Base44Client {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();

  constructor() {
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedAgents = localStorage.getItem('base44_agents');
      const storedTasks = localStorage.getItem('base44_tasks');
      
      if (storedAgents) {
        const agents = JSON.parse(storedAgents);
        if (Array.isArray(agents)) {
          agents.forEach((agent: Agent) => {
            if (agent && agent.id) {
              this.agents.set(agent.id, agent);
            }
          });
        }
      }
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        if (Array.isArray(tasks)) {
          tasks.forEach((task: Task) => {
            if (task && task.id) {
              this.tasks.set(task.id, task);
            }
          });
        }
      }
    } catch (error) {
      try {
        localStorage.removeItem('base44_agents');
        localStorage.removeItem('base44_tasks');
      } catch {
      }
    }
  }

  private saveToStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const agentsData = Array.from(this.agents.values());
        const tasksData = Array.from(this.tasks.values());
        
        if (agentsData.length > 0) {
          localStorage.setItem('base44_agents', JSON.stringify(agentsData));
        }
        if (tasksData.length > 0) {
          localStorage.setItem('base44_tasks', JSON.stringify(tasksData));
        }
        resolve();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          try {
            const agentsData = Array.from(this.agents.values());
            const tasksData = Array.from(this.tasks.values());
            if (agentsData.length > 100) {
              const sorted = agentsData.sort((a, b) => {
                const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
                const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
                return dateA - dateB;
              });
              sorted.slice(0, -50).forEach(agent => this.agents.delete(agent.id));
            }
            if (tasksData.length > 100) {
              const sorted = tasksData.sort((a, b) => {
                const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
                const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
                return dateA - dateB;
              });
              sorted.slice(0, -50).forEach(task => this.tasks.delete(task.id));
            }
            this.saveToStorage().then(resolve).catch(reject);
          } catch (innerError) {
            reject(innerError);
          }
        } else {
          reject(error);
        }
      }
    });
  }

  entities = {
    Agent: {
      list: async (sort?: string): Promise<Agent[]> => {
        const agents = Array.from(this.agents.values());
        if (sort === '-created_date') {
          return agents.sort((a, b) => {
            const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
            const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
            return dateB - dateA;
          });
        }
        return agents;
      },
      create: async (data: Omit<Agent, 'id' | 'created_date'>): Promise<Agent> => {
        try {
          // Validate input data
          if (!data.name || !data.role || !data.system_prompt || !data.model) {
            throw new Error('Invalid input data');
          }

          // Generate a unique ID
          const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

          // Create a new agent
          const agent: Agent = {
            ...data,
            id,
            created_date: new Date().toISOString()
          };

          // Add the agent to the map
          this.agents.set(id, agent);

          // Save to storage
          await this.saveToStorage();

          return agent;
        } catch (error) {
          // Handle specific errors
          if (error instanceof Error) {
            throw new Error(`Failed to create agent: ${error.message}`);
          } else {
            throw new Error('Failed to create agent');
          }
        }
      },
      update: async (id: string, data: Partial<Agent>): Promise<Agent> => {
        const existing = this.agents.get(id);
        if (!existing) {
          throw new Error(`Agent with id ${id} not found`);
        }
        const updated = { ...existing, ...data };
        this.agents.set(id, updated);
        this.saveToStorage();
        return updated;
      },
      delete: async (id: string): Promise<void> => {
        this.agents.delete(id);
        this.saveToStorage();
      },
      get: async (id: string): Promise<Agent | null> => {
        return this.agents.get(id) || null;
      }
    },
    Task: {
      list: async (sort?: string): Promise<Task[]> => {
        const tasks = Array.from(this.tasks.values());
        if (sort === '-created_date') {
          return tasks.sort((a, b) => {
            const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
            const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
            return dateB - dateA;
          });
        }
        return tasks;
      },
      create: async (data: Omit<Task, 'id' | 'created_date'>): Promise<Task> => {
        const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const task: Task = {
          ...data,
          id,
          status: data.status || 'todo',
          created_date: new Date().toISOString()
        };
        this.tasks.set(id, task);
        this.saveToStorage();
        return task;
      },
      update: async (id: string, data: Partial<Task>): Promise<Task> => {
        const existing = this.tasks.get(id);
        if (!existing) {
          throw new Error(`Task with id ${id} not found`);
        }
        const updated = { ...existing, ...data };
        this.tasks.set(id, updated);
        this.saveToStorage();
        return updated;
      },
      delete: async (id: string): Promise<void> => {
        this.tasks.delete(id);
        this.saveToStorage();
      },
      get: async (id: string): Promise<Task | null> => {
        return this.tasks.get(id) || null;
      }
    }
  };
}

export const base44 = new Base44Client();
export type { Agent, Task, CreateAgentInput };

