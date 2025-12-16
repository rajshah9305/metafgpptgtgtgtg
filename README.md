# Raj AI - Enterprise AI Workforce Management Platform

A production-ready AI agent orchestration platform built with React, TypeScript, and Groq's inference API. Deploy, monitor, and manage intelligent agent workflows with real-time streaming and enterprise-grade reliability.

**🔴 LIVE DEMO**: Deploy instantly to Vercel with one click!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/raj-ai)

## ✨ Key Highlights

- ✅ **100% Functional** - No mockups, no placeholders, no simulations
- ✅ **Live Groq API Integration** - Real AI inference with streaming responses
- ✅ **Production Ready** - Built with TypeScript, error handling, and validation
- ✅ **Zero Auth Required** - Simple API key configuration, no complex authentication
- ✅ **Instant Deploy** - One-click deployment to Vercel
- ✅ **Real-time Streaming** - Watch AI agents think and respond in real-time

## 🚀 Features

- **Agent Management**: Create and configure specialized AI agents with custom system prompts
- **Task Orchestration**: Build complex workflows with task chaining and dependency management
- **Real-Time Streaming**: Watch AI agents work in real-time with live output streaming
- **Task Chaining**: Link tasks together so outputs from one task become context for the next
- **Multiple Model Support**: Support for 5 Groq models with optimized configurations
- **Live Output Monitoring**: Comprehensive output tab with real-time agent conversations
- **Modern UI**: Clean, high-contrast interface with animations and responsive design
- **Local Storage**: All data persisted locally in your browser
- **Production Ready**: Built with TypeScript, error boundaries, and validation

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query + Local Storage
- **API Integration**: Groq API with streaming support
- **Deployment**: Vercel-optimized build
- **Code Quality**: ESLint + TypeScript strict mode

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Groq API Key** - Get yours free at [console.groq.com](https://console.groq.com)

## 🚀 Quick Start (5 Minutes to Running)

### Option 1: Deploy to Vercel (Fastest - 2 Minutes)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Deploy the project
4. Once deployed, open your app and go to **Settings**
5. Enter your Groq API key (get one at [console.groq.com](https://console.groq.com))
6. Start creating agents and tasks!

### Option 2: Local Development (5 Minutes)

#### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd raj-ai
npm install
```

#### Step 2: Start Development Server

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

#### Step 3: Configure API Key

1. Navigate to **Settings** page
2. Enter your Groq API key (get one at [console.groq.com](https://console.groq.com))
3. Click **Save Configuration**

#### Step 4: Create Your First Agent

1. Go to **Agents** page
2. Click **Deploy Default Team** for pre-configured agents, OR
3. Click **Create New Agent** to build your own

#### Step 5: Execute Your First Task

1. Navigate to **Tasks** page
2. Click **Create New Task**
3. Fill in task details and assign an agent
4. Click **Execute** and watch real-time AI processing!

### Option 3: Production Build

```bash
npm run build
npm run preview
```

Open [http://localhost:3000](http://localhost:3000) to test the production build.

### 3. Production Build

```bash
npm run build
npm run preview
```

### 4. Get Your API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Create a free account
3. Generate an API key (starts with `gsk_`)
4. Go to Settings in the app and enter your API key

## 🔧 Configuration

### Groq API Key Setup

1. Get your free API key from [Groq Console](https://console.groq.com)
2. Navigate to **Settings** in the application
3. Enter your API key (starts with `gsk_`)
4. Click **Save**

The API key is stored locally in your browser and never sent to any server except Groq's API.

## 📖 Usage Guide

### Creating Your First Agent

1. Navigate to **Agents** page
2. Click **Create Agent** or **Add Default Team** for quick setup
3. Fill in:
   - **Name**: A descriptive name for your agent
   - **Role**: The agent's role (e.g., "Senior Engineer", "Product Manager")
   - **Model**: Choose from available Groq models
   - **Functions**: Available functions the agent can perform
   - **Capabilities**: Technologies and skills the agent specializes in
   - **System Prompt**: Instructions for how the agent should behave

### Creating and Running Tasks

1. Navigate to **Tasks** page
2. Click **Create Task**
3. Fill in:
   - **Task Title**: A brief title
   - **Assign Agent**: Select an agent to handle this task
   - **Task Instructions**: Detailed instructions for the agent
   - **Prerequisite Task** (optional): Link to a previous task for context
   - **Output Format**: Choose text or JSON

4. Click **Execute** to run the task
5. Watch the agent work in real-time with streaming output

### Monitoring Live Output

1. Navigate to **Output** page to see real-time agent activity
2. Filter by specific agents or view all activity
3. Export output logs or copy individual messages
4. Use fullscreen mode for immersive monitoring

### Task Chaining

Create dependent tasks by selecting a **Prerequisite Task**. The output from the parent task will automatically be included as context for the child task, enabling complex multi-step workflows.

## 🎯 Supported Models

- **openai/gpt-oss-120b** (Recommended) - With browser search and code interpreter tools
- **meta-llama/llama-4-maverick-17b-128e-instruct** - 8K context
- **meta-llama/llama-4-scout-17b-16e-instruct** - 8K context  
- **moonshotai/kimi-k2-instruct-0905** - 16K context
- **llama-3.3-70b-versatile** - 32K context

## 🏗 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production with optimizations
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts and cache

### Project Structure

```
src/
├── api/                 # API clients and data models
├── components/          # Reusable UI components
│   └── ui/             # Base UI component library
├── pages/              # Application pages/routes
├── services/           # Business logic and services
├── utils/              # Utility functions and helpers
└── main.tsx           # Application entry point
```

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for React and TypeScript best practices
- **Error Boundaries**: Production-ready error handling
- **Validation**: Input sanitization and validation utilities
- **Performance**: Optimized builds with code splitting

## 🚀 Production Deployment

### Deploy to Vercel (Recommended - 2 Minutes)

1. Push your code to GitHub
2. Import to Vercel
3. Vercel will automatically detect the Vite configuration
4. Deploy with zero configuration

### Manual Deployment

```bash
npm run build
```

The production build will be in the `dist/` directory. Deploy to any static hosting service.

### Environment Optimization

- **Caching**: Static assets cached for 1 year
- **Code Splitting**: Vendor chunks separated for optimal loading
- **Minification**: Terser minification for smallest bundle size
- **Source Maps**: Disabled in production for security

## 🔒 Security

- **Input Validation**: All user inputs are validated and sanitized
- **API Key Security**: Keys stored locally, never transmitted except to Groq
- **Error Handling**: Comprehensive error boundaries prevent crashes
- **Rate Limiting**: Built-in request queuing to prevent API abuse
- **XSS Protection**: Input sanitization prevents script injection

## 🎨 Design System

- **Background**: Clean white (#ffffff)
- **Text**: High-contrast black (#000000)
- **Accent**: Orange (#ff6600) for MVP features and highlights
- **Typography**: System fonts for optimal readability
- **Layout**: Minimal, focused, and intentional design
- **Animations**: Subtle animations for enhanced user experience

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues**
   - Ensure your API key starts with `gsk_`
   - Verify the key is active in Groq Console
   - Check browser console for detailed error messages

2. **Build Issues**
   - Run `npm run clean` to clear cache
   - Ensure Node.js version is 18.0.0 or higher
   - Delete `node_modules` and run `npm install`
   - Run `npm run type-check` to verify TypeScript compilation

3. **Performance Issues**
   - Clear browser localStorage if data becomes corrupted
   - Use Chrome DevTools to monitor memory usage
   - Check network tab for API response times
   - The app uses local storage for data persistence

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🧪 Testing the Application

### Manual Testing Checklist

#### 1. API Configuration Test
```bash
# Start the dev server
npm run dev

# Navigate to http://localhost:3000/settings
# Enter your Groq API key (get one at console.groq.com)
# Click "Save Configuration"
# Verify green success message appears
```

#### 2. Agent Creation Test
```bash
# Navigate to /agents
# Click "Deploy Default Team" button
# Verify 3 agents are created:
#   - Product Manager (openai/gpt-oss-120b)
#   - Software Architect (llama-4-maverick)
#   - Python Expert (llama-3.3-70b-versatile)
# Click on any agent to view details
# Test agent status toggle (idle → running → paused)
```

#### 3. Task Execution Test
```bash
# Navigate to /tasks
# Click "Create New Task"
# Fill in:
#   - Title: "Write a Python function to calculate fibonacci"
#   - Agent: Select "Python Expert"
#   - Instructions: "Create a recursive fibonacci function with memoization"
#   - Output Format: "Free Text / Markdown"
# Click "Create Task"
# Click "Execute" button
# Watch real-time streaming output
# Verify task status changes: todo → in_progress → done
```

#### 4. Live Output Stream Test
```bash
# Navigate to /output
# Execute a task from /tasks page
# Verify live stream shows:
#   - Thinking events (orange)
#   - Output events (blue)
#   - Agent status changes
# Test "Pause Stream" button
# Test "Export Log" functionality
# Test "Copy All" functionality
```

#### 5. Task Chaining Test
```bash
# Create Task 1: "Research best practices for REST API design"
# Execute Task 1 and wait for completion
# Create Task 2: "Based on the research, design a user management API"
# Set "Prerequisite Task" to Task 1
# Execute Task 2
# Verify Task 2 receives context from Task 1's output
```

### Production Build Test

```bash
# Build for production
npm run build

# Verify build output
ls -lh dist/

# Preview production build
npm run preview

# Open http://localhost:3000
# Test all features in production mode
```

### API Integration Test

Test all 5 Groq models:

1. **GPT-OSS-120B** (Recommended)
   - Create agent with this model
   - Test with complex reasoning task
   - Verify browser_search and code_interpreter tools work

2. **Llama 4 Maverick**
   - Test with architecture design task
   - Verify 8K context handling

3. **Llama 4 Scout**
   - Test with quick response task
   - Verify efficient processing

4. **Kimi K2**
   - Test with multilingual task
   - Verify 16K context handling

5. **Llama 3.3 70B**
   - Test with versatile task
   - Verify 32K context handling

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the [Groq API Documentation](https://console.groq.com/docs)
- Join the community discussions

## 🎯 What Makes This Production-Ready?

✅ **No Mockups** - Every feature uses real Groq API calls
✅ **No Placeholders** - All code is fully implemented and functional
✅ **No Simulations** - Real AI inference with streaming responses
✅ **No Auth Complexity** - Simple API key configuration
✅ **No Docker Required** - Runs directly with Node.js
✅ **Error Handling** - Comprehensive error boundaries and validation
✅ **Type Safety** - Full TypeScript with strict mode
✅ **Production Build** - Optimized bundle with code splitting
✅ **Real-time Streaming** - Live AI responses with SSE
✅ **Data Persistence** - LocalStorage for agents and tasks

## 🚢 Deployment Verification

After deploying, verify these endpoints:

1. **Homepage** (`/`) - Should load without errors
2. **Agents** (`/agents`) - Should show agent management interface
3. **Tasks** (`/tasks`) - Should show task orchestration interface
4. **Output** (`/output`) - Should show live stream interface
5. **Settings** (`/settings`) - Should show API configuration

All routes should:
- Load in < 2 seconds
- Show no console errors
- Display proper UI with Tailwind styles
- Handle navigation smoothly

---

**Built with ❤️ by Raj Shah**

Using modern web technologies with a focus on:
- 🎯 Developer Experience
- ⚡ Performance & Speed
- 🔒 Security & Reliability
- 🎨 Clean Design
- 🚀 Production Readiness