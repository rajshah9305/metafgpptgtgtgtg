export const validateGroqApiKey = (apiKey: string): { isValid: boolean; error?: string } => {
  if (!apiKey || !apiKey.trim()) {
    return { isValid: false, error: 'API key is required' };
  }

  if (!apiKey.startsWith('gsk_')) {
    return { isValid: false, error: 'API key must start with "gsk_"' };
  }

  if (apiKey.length < 40) {
    return { isValid: false, error: 'API key appears to be too short' };
  }

  return { isValid: true };
};

export const validateAgentData = (data: {
  name: string;
  role: string;
  system_prompt: string;
  model: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Agent name is required');
  } else if (data.name.length > 100) {
    errors.push('Agent name must be less than 100 characters');
  }

  if (!data.role?.trim()) {
    errors.push('Agent role is required');
  } else if (data.role.length > 50) {
    errors.push('Agent role must be less than 50 characters');
  }

  if (!data.system_prompt?.trim()) {
    errors.push('System prompt is required');
  } else if (data.system_prompt.length > 5000) {
    errors.push('System prompt must be less than 5000 characters');
  }

  if (!data.model?.trim()) {
    errors.push('Model selection is required');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateTaskData = (data: {
  title: string;
  description: string;
  agent_id: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Task title is required');
  } else if (data.title.length > 200) {
    errors.push('Task title must be less than 200 characters');
  }

  if (!data.description?.trim()) {
    errors.push('Task description is required');
  } else if (data.description.length > 10000) {
    errors.push('Task description must be less than 10000 characters');
  }

  if (!data.agent_id?.trim()) {
    errors.push('Agent selection is required');
  }

  return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[match] || match;
  });
};