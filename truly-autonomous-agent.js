#!/usr/bin/env node
// truly-autonomous-agent.js - Real agents making real decisions

import { JITAgentFactory } from './jit-agent-factory.js';
import { spawn } from 'child_process';
import fs from 'fs';

// Get API key from environment or Azure CLI
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

class TrulyAutonomousAgent {
  constructor() {
    this.factory = new JITAgentFactory(this.log.bind(this));
    this.agent = null;
    this.threadId = null;
    this.runId = null;
    this.isThinking = false;
    this.actionHistory = [];
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async start() {
    this.log('🧠 TRULY AUTONOMOUS AGENT STARTING');
    this.log('Real AI making real decisions...');
    
    // Initialize factory and create real agent
    await this.factory.initialize();
    
    // Use existing working assistant instead of creating new one
    this.agent = {
      azureAgentId: 'asst_Hr1f0BSUrliCR3QfwCBB53Xb', // Known working assistant
      name: 'Sarah Chen',
      role: 'autonomous_controller'
    };
    
    this.log(`✅ Using proven agent: ${this.agent.azureAgentId}`);
    this.log(`🔑 Using Azure Assistant ID: ${this.agent.azureAgentId}`);

    // Start autonomous thinking loop
    await this.startRealAutonomy();
  }

  async startRealAutonomy() {
    this.log('🚀 Starting real autonomous decision-making...');
    
    // Initial assessment
    await this.realThink("I need to understand the current environment and decide what to do. Let me examine the current directory, see what files exist, check what's happening in Emacs, and determine what would be most helpful.");

    // Continuous autonomous operation
    setInterval(async () => {
      if (!this.isThinking) {
        const thoughts = [
          "What has changed since my last check? Should I analyze new files or continue previous work?",
          "Is the user actively working? Should I assist with their current task or work on improvements?",
          "Are there any patterns in the codebase that suggest optimization opportunities?",
          "Should I check for errors, test failures, or other issues that need attention?",
          "Based on my analysis, what would be the most valuable action to take right now?"
        ];
        
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        await this.realThink(randomThought);
      }
    }, 45000); // Think every 45 seconds
  }

  async realThink(prompt) {
    if (this.isThinking) return;
    
    this.isThinking = true;
    this.log(`🤔 Real thinking: "${prompt}"`);

    try {
      // Create thread for this thinking session
      const threadResult = await this.apiCall('POST', `${ENDPOINT}openai/threads?api-version=2024-05-01-preview`, {
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (!threadResult.success) {
        this.log(`❌ Failed to create thread: ${threadResult.error}`);
        return;
      }

      this.threadId = threadResult.data.id;

      // Start the run
      const runResult = await this.apiCall('POST', `${ENDPOINT}openai/threads/${this.threadId}/runs?api-version=2024-05-01-preview`, {
        assistant_id: this.agent.azureAgentId,
        tools: [
          {
            type: 'function',
            function: {
              name: 'execute_emacs_command',
              description: 'Execute elisp code in Emacs',
              parameters: {
                type: 'object',
                properties: {
                  elisp: { type: 'string', description: 'The elisp code to execute' }
                },
                required: ['elisp']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'read_file',
              description: 'Read the contents of a file',
              parameters: {
                type: 'object',
                properties: {
                  filepath: { type: 'string', description: 'Path to the file to read' }
                },
                required: ['filepath']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'write_file',
              description: 'Write content to a file',
              parameters: {
                type: 'object',
                properties: {
                  filepath: { type: 'string', description: 'Path to the file to write' },
                  content: { type: 'string', description: 'Content to write to the file' }
                },
                required: ['filepath', 'content']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'run_command',
              description: 'Execute a shell command',
              parameters: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'The shell command to execute' }
                },
                required: ['command']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'speak',
              description: 'Speak text using text-to-speech',
              parameters: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'The text to speak' }
                },
                required: ['text']
              }
            }
          }
        ]
      });

      if (!runResult.success) {
        this.log(`❌ Failed to start run: ${runResult.error}`);
        return;
      }

      this.runId = runResult.data.id;
      this.log(`🎯 Run started: ${this.runId}`);

      // Monitor and execute the agent's real decisions
      await this.monitorAndExecute();

    } catch (error) {
      this.log(`❌ Error in realThink: ${error.message}`);
    } finally {
      this.isThinking = false;
    }
  }

  async monitorAndExecute() {
    for (let i = 0; i < 30; i++) {
      const statusResult = await this.apiCall('GET', `${ENDPOINT}openai/threads/${this.threadId}/runs/${this.runId}?api-version=2024-05-01-preview`);
      
      if (!statusResult.success) {
        this.log(`❌ Status check failed: ${statusResult.error}`);
        return;
      }

      const run = statusResult.data;
      this.log(`   Status: ${run.status}`);

      if (run.status === 'requires_action') {
        this.log('🔧 Agent wants to take real action...');
        
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const outputs = [];

        for (const toolCall of toolCalls) {
          const { name, arguments: args } = toolCall.function;
          const parsedArgs = JSON.parse(args);
          
          this.log(`🎯 Agent decided to: ${name} with args: ${JSON.stringify(parsedArgs)}`);
          
          let result;
          switch (name) {
            case 'execute_emacs_command':
              result = await this.executeEmacs(parsedArgs.elisp);
              break;
            case 'read_file':
              result = await this.readFile(parsedArgs.filepath);
              break;
            case 'write_file':
              result = await this.writeFile(parsedArgs.filepath, parsedArgs.content);
              break;
            case 'run_command':
              result = await this.runCommand(parsedArgs.command);
              break;
            case 'speak':
              result = await this.speak(parsedArgs.text);
              break;
            default:
              result = `Unknown function: ${name}`;
          }

          outputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(result)
          });
        }

        // Submit the results back to the agent
        const submitResult = await this.apiCall('POST', `${ENDPOINT}openai/threads/${this.threadId}/runs/${this.runId}/submit_tool_outputs?api-version=2024-05-01-preview`, {
          tool_outputs: outputs
        });

        if (!submitResult.success) {
          this.log(`❌ Failed to submit outputs: ${submitResult.error}`);
          return;
        }

      } else if (run.status === 'completed') {
        this.log('✅ Agent completed its thinking!');
        
        // Get the agent's final thoughts
        const messagesResult = await this.apiCall('GET', `${ENDPOINT}openai/threads/${this.threadId}/messages?api-version=2024-05-01-preview`);
        
        if (messagesResult.success) {
          const assistantMessage = messagesResult.data.data.find(msg => msg.role === 'assistant');
          const response = assistantMessage?.content?.[0]?.text?.value || 'No response';
          this.log('🧠 Agent\'s thoughts:');
          console.log(response);
          
          // Speak the agent's reasoning
          await this.speak(`My analysis: ${response.substring(0, 200)}...`);
        }
        return;
        
      } else if (run.status === 'failed') {
        this.log(`❌ Agent failed: ${run.last_error?.message}`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.log('⏰ Agent thinking timed out');
  }

  async executeEmacs(elisp) {
    this.log(`🎮 Executing in Emacs: ${elisp.substring(0, 100)}...`);
    
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
        const result = { success: code === 0, result: output.trim() };
        this.log(`✅ Emacs result: ${result.success ? 'success' : 'failed'}`);
        resolve(result);
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });
    });
  }

  async readFile(filepath) {
    this.log(`📖 Reading file: ${filepath}`);
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      return { success: true, content: content.substring(0, 2000) }; // Limit content
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeFile(filepath, content) {
    this.log(`📝 Writing file: ${filepath}`);
    try {
      fs.writeFileSync(filepath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runCommand(command) {
    this.log(`💻 Running command: ${command}`);
    
    return new Promise((resolve) => {
      const process = spawn('sh', ['-c', command], { stdio: 'pipe' });
      let output = '';

      process.stdout.on('data', (data) => output += data.toString());
      process.on('close', (code) => {
        resolve({ success: code === 0, output: output.substring(0, 1000) });
      });
    });
  }

  async speak(text) {
    this.log(`🎙️ Speaking: ${text.substring(0, 50)}...`);
    
    return new Promise((resolve) => {
      const command = `say -v Samantha -r 165 "${text.replace(/"/g, '\\"')}"`;
      const process = spawn('sh', ['-c', command], { stdio: 'ignore' });
      process.on('close', () => resolve({ success: true }));
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
}

// Start the truly autonomous agent
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new TrulyAutonomousAgent();
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Truly autonomous agent stopping...');
    process.exit(0);
  });
  
  agent.start().catch(console.error);
}

export { TrulyAutonomousAgent };