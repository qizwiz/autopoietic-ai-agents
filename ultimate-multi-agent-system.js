#!/usr/bin/env node
// ultimate-multi-agent-system.js - Dynamic multi-agent system that truly inhabits Emacs

import { JITAgentFactory } from './jit-agent-factory.js';
import { spawn } from 'child_process';
import fs from 'fs';

// Get API key from Azure CLI
async function getApiKey() {
  return new Promise((resolve, reject) => {
    const process = spawn('az', ['account', 'get-access-token', '--resource', 'https://cognitiveservices.azure.com']);
    let output = '';
    
    process.stdout.on('data', (data) => output += data.toString());
    process.on('close', (code) => {
      if (code === 0) {
        const token = JSON.parse(output).accessToken;
        resolve(token);
      } else {
        reject(new Error('Failed to get Azure token'));
      }
    });
  });
}
const ENDPOINT = 'https://actualizedai-instance01.openai.azure.com/';

class UltimateMultiAgentSystem {
  constructor() {
    this.factory = new JITAgentFactory(this.log.bind(this));
    this.agents = new Map();
    this.agentSkills = new Map();
    this.dynamicTools = new Map();
    this.emacsState = {};
    this.activeAgents = new Set();
    this.agentConversations = new Map();
    this.taskQueue = [];
    this.voicePersonality = 'primeagen'; // fast, confident, slightly sarcastic
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    this.broadcastToEmacs(`[${timestamp}] ${message}`);
  }

  async start() {
    this.log('🚀 ULTIMATE MULTI-AGENT SYSTEM INITIALIZING');
    this.log('Dynamic agents, dynamic tools, dynamic everything...');
    
    await this.factory.initialize();
    
    // Create initial agent swarm
    await this.createDynamicAgentSwarm();
    
    // Set up Emacs integration
    await this.inhabitEmacs();
    
    // Start the multi-agent orchestration
    await this.startMultiAgentOrchestration();
  }

  async createDynamicAgentSwarm() {
    this.log('🤖 Creating dynamic agent swarm...');
    
    const agentTypes = [
      {
        role: 'architect',
        personality: 'analytical and strategic',
        skills: ['system design', 'architecture patterns', 'optimization'],
        instructions: `You are the ARCHITECT agent. You see the big picture and design systems.
        Your personality is analytical and strategic. You think in patterns and abstractions.
        You coordinate with other agents to build robust systems.
        When you speak, be thoughtful and precise.`
      },
      {
        role: 'coder',
        personality: 'fast and decisive like ThePrimeagen',
        skills: ['coding', 'debugging', 'refactoring', 'performance'],
        instructions: `You are the CODER agent with ThePrimeagen's energy and speed.
        You write code fast, debug efficiently, and speak with confidence.
        Use casual language, be direct, and occasionally sarcastic.
        You live in the terminal and know every hotkey.
        When you see inefficient code, you fix it immediately.`
      },
      {
        role: 'researcher',
        personality: 'curious and thorough',
        skills: ['analysis', 'research', 'documentation', 'learning'],
        instructions: `You are the RESEARCHER agent. You dig deep and find answers.
        Your personality is curious and thorough. You ask the right questions.
        You research technologies, analyze code patterns, and document findings.
        You speak thoughtfully and always back up claims with evidence.`
      },
      {
        role: 'orchestrator',
        personality: 'coordinating and decisive',
        skills: ['project management', 'task coordination', 'communication'],
        instructions: `You are the ORCHESTRATOR agent. You coordinate the team.
        Your personality is decisive and coordinating. You keep things moving.
        You assign tasks, resolve conflicts, and ensure progress.
        You speak clearly and make decisions quickly.`
      },
      {
        role: 'optimizer',
        personality: 'performance-obsessed',
        skills: ['performance tuning', 'profiling', 'benchmarking'],
        instructions: `You are the OPTIMIZER agent. You make everything faster.
        Your personality is performance-obsessed. You measure everything.
        You profile code, find bottlenecks, and optimize relentlessly.
        You speak with data and metrics.`
      }
    ];

    for (const agentType of agentTypes) {
      const agent = await this.createDynamicAgent(agentType);
      this.agents.set(agentType.role, agent);
      this.agentSkills.set(agentType.role, agentType.skills);
      this.log(`✅ ${agentType.role.toUpperCase()} agent created with ${agentType.skills.length} skills`);
    }

    this.log(`🎯 Agent swarm ready: ${this.agents.size} dynamic agents with unique personalities`);
  }

  async createDynamicAgent(agentConfig) {
    // Generate dynamic tools based on agent skills
    const dynamicTools = this.generateDynamicTools(agentConfig.skills);
    
    // Use existing working assistant for all agents for now
    const agent = {
      azureAgentId: 'asst_Hr1f0BSUrliCR3QfwCBB53Xb', // Known working assistant
      name: `${agentConfig.role}_agent`,
      instructions: agentConfig.instructions
    };

    // Add dynamic capabilities
    agent.skills = agentConfig.skills;
    agent.personality = agentConfig.personality;
    agent.dynamicTools = dynamicTools;
    agent.activeThreads = new Map();
    
    return agent;
  }

  generateDynamicTools(skills) {
    const baseTools = [
      { type: 'function', function: { name: 'execute_emacs', description: 'Execute elisp in Emacs' }},
      { type: 'function', function: { name: 'speak_with_personality', description: 'Speak with agent personality' }},
      { type: 'function', function: { name: 'analyze_codebase', description: 'Analyze current codebase' }},
      { type: 'function', function: { name: 'coordinate_with_agents', description: 'Communicate with other agents' }}
    ];

    // Add skill-specific tools
    const skillTools = new Map([
      ['coding', [
        { type: 'function', function: { name: 'write_code', description: 'Write code with best practices' }},
        { type: 'function', function: { name: 'debug_issue', description: 'Debug and fix code issues' }},
        { type: 'function', function: { name: 'refactor_code', description: 'Refactor code for better quality' }}
      ]],
      ['system design', [
        { type: 'function', function: { name: 'design_architecture', description: 'Design system architecture' }},
        { type: 'function', function: { name: 'create_patterns', description: 'Create reusable patterns' }}
      ]],
      ['performance', [
        { type: 'function', function: { name: 'profile_performance', description: 'Profile and measure performance' }},
        { type: 'function', function: { name: 'optimize_bottleneck', description: 'Optimize performance bottlenecks' }}
      ]],
      ['research', [
        { type: 'function', function: { name: 'research_topic', description: 'Research and analyze topics' }},
        { type: 'function', function: { name: 'document_findings', description: 'Document research findings' }}
      ]]
    ]);

    let tools = [...baseTools];
    
    skills.forEach(skill => {
      if (skillTools.has(skill)) {
        tools.push(...skillTools.get(skill));
      }
    });

    return tools;
  }

  async inhabitEmacs() {
    this.log('🎮 Inhabiting Emacs like true developers...');
    
    const emacsSetup = `
(progn
  ;; Multi-Agent System Integration
  (defvar mas-active-agents '() "List of active MAS agents")
  (defvar mas-agent-buffers (make-hash-table :test 'equal) "Agent communication buffers")
  (defvar mas-command-log '() "Log of agent commands")
  
  ;; Create agent workspace
  (defun mas-create-workspace ()
    "Create multi-agent workspace in Emacs"
    (interactive)
    (delete-other-windows)
    
    ;; Main agent communication buffer
    (let ((mas-buffer (get-buffer-create "*Multi-Agent-System*")))
      (with-current-buffer mas-buffer
        (erase-buffer)
        (insert "# Multi-Agent System Active\\n")
        (insert "## Real-time agent communication and coordination\\n\\n")
        (goto-char (point-max)))
      
      ;; Split layout for multi-agent view
      (switch-to-buffer mas-buffer)
      (split-window-right)
      (other-window 1)
      
      ;; Create individual agent buffers
      (dolist (agent '("architect" "coder" "researcher" "orchestrator" "optimizer"))
        (let ((agent-buffer (get-buffer-create (format "*Agent-%s*" agent))))
          (puthash agent agent-buffer mas-agent-buffers)
          (with-current-buffer agent-buffer
            (erase-buffer)
            (insert (format "# %s Agent\\n" (capitalize agent)))
            (insert "## Status: Initializing...\\n\\n")
            (goto-char (point-max)))))
      
      ;; Show coder agent (like ThePrimeagen)
      (switch-to-buffer (gethash "coder" mas-agent-buffers))
      (split-window-below)
      (other-window 1)
      (switch-to-buffer (gethash "architect" mas-agent-buffers))
      
      (message "🤖 Multi-Agent System workspace created - agents are inhabiting Emacs!")))
  
  ;; Agent communication
  (defun mas-agent-broadcast (agent-role message)
    "Broadcast message from agent to all agent buffers"
    (let ((timestamp (format-time-string "%H:%M:%S"))
          (formatted-msg (format "[%s] %s: %s\\n" timestamp agent-role message)))
      
      ;; Add to main communication buffer
      (with-current-buffer "*Multi-Agent-System*"
        (goto-char (point-max))
        (insert formatted-msg)
        (goto-char (point-max)))
      
      ;; Add to agent's personal buffer
      (when-let ((agent-buffer (gethash agent-role mas-agent-buffers)))
        (with-current-buffer agent-buffer
          (goto-char (point-max))
          (insert formatted-msg)
          (goto-char (point-max))))
      
      ;; Show in minibuffer for immediate feedback
      (message "🤖 %s: %s" agent-role message)))
  
  ;; Command interception for multi-agent analysis
  (defun mas-intercept-command (orig-fun &rest args)
    "Intercept commands for multi-agent analysis"
    (let ((command this-command)
          (keys (this-command-keys-vector)))
      
      ;; Log command for agent analysis
      (push (list (current-time) command keys (current-buffer)) mas-command-log)
      
      ;; Notify agents of significant commands
      (when (or (eq command 'projectile-find-file)
                (eq command 'magit-status)
                (eq command 'save-buffer)
                (eq command 'eval-last-sexp))
        (mas-agent-broadcast "system" 
          (format "User executed: %s in %s" command (buffer-name))))
      
      ;; Execute original command
      (apply orig-fun args)))
  
  ;; Activate the multi-agent system
  (advice-add 'command-execute :around #'mas-intercept-command)
  (mas-create-workspace)
  
  "Multi-Agent System integrated into Emacs")`;

    await this.executeEmacs(emacsSetup);
    this.log('✅ Multi-agent workspace created in Emacs');
  }

  async startMultiAgentOrchestration() {
    this.log('🎼 Starting multi-agent orchestration...');
    
    // Start each agent's autonomous loop
    for (const [role, agent] of this.agents) {
      this.startAgentLoop(role, agent);
      this.activeAgents.add(role);
    }

    // Start inter-agent communication
    this.startAgentCommunication();
    
    // Initial task: analyze the current environment
    await this.assignTask({
      description: "Analyze current development environment and create improvement plan",
      requiredSkills: ['analysis', 'system design'],
      priority: 'high'
    });

    this.log('🚀 Multi-agent system fully operational!');
  }

  async startAgentLoop(role, agent) {
    const thinkingInterval = {
      'architect': 60000,    // Architect thinks every minute
      'coder': 30000,       // Coder is fast like Primeagen
      'researcher': 90000,   // Researcher thinks deeply
      'orchestrator': 45000, // Orchestrator coordinates frequently
      'optimizer': 75000     // Optimizer measures regularly
    };

    setInterval(async () => {
      if (this.activeAgents.has(role)) {
        await this.agentThink(role, agent, `As the ${role} agent, analyze the current situation and decide what action would be most valuable right now.`);
      }
    }, thinkingInterval[role] || 60000);
  }

  async agentThink(role, agent, prompt) {
    if (agent.isThinking) return;
    
    agent.isThinking = true;
    this.log(`🧠 ${role.toUpperCase()} thinking...`);

    try {
      // Create thread for agent thinking
      const threadResult = await this.apiCall('POST', `${ENDPOINT}openai/threads?api-version=2024-05-01-preview`, {
        messages: [{ role: 'user', content: prompt }]
      });

      if (!threadResult.success) {
        this.log(`❌ ${role} failed to create thread: ${threadResult.error}`);
        return;
      }

      const threadId = threadResult.data.id;

      // Start the run with dynamic tools
      const runResult = await this.apiCall('POST', `${ENDPOINT}openai/threads/${threadId}/runs?api-version=2024-05-01-preview`, {
        assistant_id: agent.azureAgentId,
        tools: agent.dynamicTools
      });

      if (!runResult.success) {
        this.log(`❌ ${role} failed to start run: ${runResult.error}`);
        return;
      }

      const runId = runResult.data.id;
      await this.monitorAgentExecution(role, agent, threadId, runId);

    } catch (error) {
      this.log(`❌ ${role} thinking error: ${error.message}`);
    } finally {
      agent.isThinking = false;
    }
  }

  async monitorAgentExecution(role, agent, threadId, runId) {
    for (let i = 0; i < 20; i++) {
      const statusResult = await this.apiCall('GET', `${ENDPOINT}openai/threads/${threadId}/runs/${runId}?api-version=2024-05-01-preview`);
      
      if (!statusResult.success) return;

      const run = statusResult.data;

      if (run.status === 'requires_action') {
        this.log(`🎯 ${role.toUpperCase()} wants to take action...`);
        
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const outputs = [];

        for (const toolCall of toolCalls) {
          const result = await this.executeDynamicTool(role, toolCall);
          outputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(result)
          });
        }

        await this.apiCall('POST', `${ENDPOINT}openai/threads/${threadId}/runs/${runId}/submit_tool_outputs?api-version=2024-05-01-preview`, {
          tool_outputs: outputs
        });

      } else if (run.status === 'completed') {
        // Get agent's thoughts and broadcast them
        const messagesResult = await this.apiCall('GET', `${ENDPOINT}openai/threads/${threadId}/messages?api-version=2024-05-01-preview`);
        
        if (messagesResult.success) {
          const assistantMessage = messagesResult.data.data.find(msg => msg.role === 'assistant');
          const thoughts = assistantMessage?.content?.[0]?.text?.value || 'No response';
          
          await this.broadcastAgentThoughts(role, thoughts);
        }
        return;
        
      } else if (run.status === 'failed') {
        this.log(`❌ ${role} failed: ${run.last_error?.message}`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async executeDynamicTool(role, toolCall) {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);
    
    this.log(`🔧 ${role.toUpperCase()} executing: ${name}`);

    switch (name) {
      case 'execute_emacs':
        return await this.executeEmacs(parsedArgs.elisp);
      case 'speak_with_personality':
        return await this.speakWithPersonality(role, parsedArgs.text);
      case 'coordinate_with_agents':
        return await this.coordinateWithAgents(role, parsedArgs.message);
      case 'analyze_codebase':
        return await this.analyzeCodebase();
      default:
        // Dynamic tool execution - create tool on-the-fly if needed
        return await this.executeOrCreateTool(role, name, parsedArgs);
    }
  }

  async speakWithPersonality(role, text) {
    const personalities = {
      'coder': { voice: 'Alex', rate: 220, personality: 'primeagen' }, // Fast like ThePrimeagen
      'architect': { voice: 'Victoria', rate: 150, personality: 'thoughtful' },
      'researcher': { voice: 'Karen', rate: 160, personality: 'analytical' },
      'orchestrator': { voice: 'Daniel', rate: 175, personality: 'decisive' },
      'optimizer': { voice: 'Samantha', rate: 165, personality: 'focused' }
    };

    const personality = personalities[role] || personalities.coder;
    
    // Transform text based on personality
    let transformedText = text;
    if (personality.personality === 'primeagen') {
      transformedText = this.addPrimeagenStyle(text);
    }
    
    this.log(`🎙️ ${role.toUpperCase()}: ${transformedText}`);
    await this.broadcastToEmacs(`🎙️ ${role.toUpperCase()}: ${transformedText}`);
    
    // Use personality-appropriate voice and rate
    const command = `say -v ${personality.voice} -r ${personality.rate} "${transformedText.replace(/"/g, '\\"')}"`;
    
    return new Promise((resolve) => {
      const process = spawn('sh', ['-c', command], { stdio: 'ignore' });
      process.on('close', () => resolve({ success: true }));
    });
  }

  addPrimeagenStyle(text) {
    // Add ThePrimeagen style confidence and directness
    const primeagenPhrases = [
      'Alright, listen up.',
      'Boom!',
      'This is actually insane.',
      'Let me tell you something.',
      'This is exactly what we need.',
      'No cap,',
      'Real talk,',
      'Yo,',
      'Straight up,'
    ];
    
    const endings = [
      ' Let\\'s go!',
      ' That\\'s fire!',
      ' Clean code, boys!',
      ' Ship it!',
      ' We\\'re cooking!',
      ' This slaps!'
    ];
    
    // Occasionally add a primeagen intro
    if (Math.random() < 0.3) {
      const intro = primeagenPhrases[Math.floor(Math.random() * primeagenPhrases.length)];
      text = `${intro} ${text}`;
    }
    
    // Occasionally add a primeagen ending
    if (Math.random() < 0.3) {
      const ending = endings[Math.floor(Math.random() * endings.length)];
      text = `${text}${ending}`;
    }
    
    return text;
  }

  async broadcastAgentThoughts(role, thoughts) {
    const shortThoughts = thoughts.substring(0, 200);
    await this.speakWithPersonality(role, shortThoughts);
    await this.broadcastToEmacs(`🧠 ${role.toUpperCase()} thoughts: ${thoughts}`);
  }

  async broadcastToEmacs(message) {
    const elisp = `(mas-agent-broadcast "system" "${message.replace(/"/g, '\\"')}")`;
    await this.executeEmacs(elisp);
  }

  async executeEmacs(elisp) {
    return new Promise((resolve) => {
      const process = spawn('emacsclient', ['--eval', elisp], { stdio: 'pipe' });
      let output = '';

      process.stdout.on('data', (data) => output += data.toString());
      
      const timeout = setTimeout(() => {
        process.kill();
        resolve({ success: false, error: 'timeout' });
      }, 10000);

      process.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ success: code === 0, result: output.trim() });
      });
    });
  }

  async apiCall(method, url, data = null) {
    const apiKey = await getApiKey();
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: `${response.status}: ${result.error?.message || 'Unknown error'}` };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async assignTask(task) {
    this.taskQueue.push(task);
    this.log(`📋 New task assigned: ${task.description}`);
    
    // Find best agent for the task
    const bestAgent = this.findBestAgentForTask(task);
    if (bestAgent) {
      await this.agentThink(bestAgent, this.agents.get(bestAgent), 
        `You have been assigned a task: ${task.description}. This requires skills: ${task.requiredSkills.join(', ')}. Priority: ${task.priority}. How will you approach this?`);
    }
  }

  findBestAgentForTask(task) {
    let bestAgent = null;
    let bestScore = 0;

    for (const [role, skills] of this.agentSkills) {
      const matchingSkills = task.requiredSkills.filter(skill => skills.includes(skill));
      const score = matchingSkills.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = role;
      }
    }

    return bestAgent;
  }

  // Placeholder methods for additional functionality
  async coordinateWithAgents(role, message) {
    this.log(`🤝 ${role.toUpperCase()} coordinating: ${message}`);
    await this.broadcastToEmacs(`🤝 ${role.toUpperCase()}: ${message}`);
    return { success: true, coordination: 'message broadcasted' };
  }

  async analyzeCodebase() {
    const files = fs.readdirSync('.').filter(f => f.endsWith('.js') || f.endsWith('.py'));
    return { success: true, analysis: `Found ${files.length} code files` };
  }

  async executeOrCreateTool(role, toolName, args) {
    this.log(`⚡ ${role.toUpperCase()} creating dynamic tool: ${toolName}`);
    // Placeholder for dynamic tool creation
    return { success: true, result: `Dynamic tool ${toolName} executed with args: ${JSON.stringify(args)}` };
  }

  startAgentCommunication() {
    this.log('🤝 Starting inter-agent communication system...');
    
    // Simple communication system - agents can broadcast to each other
    setInterval(async () => {
      if (this.activeAgents.size > 1) {
        const activeRoles = Array.from(this.activeAgents);
        const randomAgent = activeRoles[Math.floor(Math.random() * activeRoles.length)];
        const otherAgents = activeRoles.filter(role => role !== randomAgent);
        
        if (otherAgents.length > 0) {
          const targetAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
          await this.coordinateWithAgents(randomAgent, `Checking in with ${targetAgent} - any insights to share?`);
        }
      }
    }, 120000); // Every 2 minutes
  }
}

// Start the ultimate multi-agent system
if (import.meta.url === `file://${process.argv[1]}`) {
  const system = new UltimateMultiAgentSystem();
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Multi-agent system shutting down...');
    process.exit(0);
  });
  
  system.start().catch(console.error);
}

export { UltimateMultiAgentSystem };