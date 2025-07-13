// JIT Agent Factory - Create AI agents on-demand using Azure AI Foundry
import { spawn } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const sleep = promisify(setTimeout);

export class JITAgentFactory {
  constructor(logFunction = console.log) {
    this.activeAgents = new Map();
    this.agentTemplates = new Map();
    this.azureResources = null;
    this.log = logFunction; // Use the provided log function
    
    this.setupAgentTemplates();
  }

  // Initialize factory with Azure resources
  async initialize() {
    this.log('🔍 Discovering Azure AI resources...');
    
    try {
      this.azureResources = await this.discoverAzureResources();
      this.log('✅ Azure AI resources discovered');
      return true;
    } catch (error) {
      this.log(`❌ Failed to discover Azure resources: ${error.message}`);
      return false;
    }
  }

  async discoverAzureResources() {
    return new Promise((resolve, reject) => {
      const azProcess = spawn('az', [
        'cognitiveservices', 'account', 'list',
        '--query', '[?kind==`OpenAI`]',
        '--output', 'json'
      ]);

      let output = '';
      let error = '';

      azProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      azProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      azProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const resources = JSON.parse(output);
            if (resources.length === 0) {
              reject(new Error('No Azure OpenAI resources found'));
              return;
            }

            const resource = resources[0]; // Use first available
            resolve({
              name: resource.name,
              resourceGroup: resource.resourceGroup,
              endpoint: resource.properties.endpoint,
              location: resource.location
            });
          } catch (parseError) {
            reject(new Error('Failed to parse Azure resource data'));
          }
        } else {
          reject(new Error(`Azure CLI failed: ${error}`));
        }
      });
    });
  }

  async getApiKey() {
    if (!this.azureResources) {
      throw new Error('Azure resources not initialized');
    }

    return new Promise((resolve, reject) => {
      const azProcess = spawn('az', [
        'cognitiveservices', 'account', 'keys', 'list',
        '--name', this.azureResources.name,
        '--resource-group', this.azureResources.resourceGroup,
        '--query', 'key1',
        '--output', 'tsv'
      ]);

      let output = '';
      let error = '';

      azProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      azProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      azProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Failed to get API key: ${error}`));
        }
      });
    });
  }

  setupAgentTemplates() {
    // Define different agent types that can be created on-demand
    this.agentTemplates.set('coder', {
      name: 'Coding Agent',
      instructions: 'You are an expert programmer. Write clean, efficient code with proper error handling. Use code_interpreter to run and test code, and file_search to examine existing code.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'programming'
    });

    this.agentTemplates.set('analyst', {
      name: 'Data Analyst Agent',
      instructions: 'You are a data analyst. Analyze data patterns and provide insights. Use code_interpreter for data analysis and file_search to examine files.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'analysis'
    });

    this.agentTemplates.set('optimizer', {
      name: 'Performance Optimizer',
      instructions: 'You optimize code and systems for better performance and efficiency. Use code_interpreter to test optimizations and file_search to analyze code.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'optimization'
    });

    this.agentTemplates.set('researcher', {
      name: 'Research Agent',
      instructions: 'You conduct thorough research and provide comprehensive findings. Use code_interpreter for analysis and file_search to examine documents.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'research'
    });

    this.agentTemplates.set('collaborator', {
      name: 'Collaboration Agent',
      instructions: 'You facilitate collaboration between teams and coordinate complex projects. Use code_interpreter and file_search to analyze and organize work.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'coordination'
    });

    this.agentTemplates.set('innovator', {
      name: 'Innovation Agent',
      instructions: 'You generate creative solutions and novel approaches to problems. Use code_interpreter to prototype ideas and file_search to research existing solutions.',
      tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
      specialization: 'innovation'
    });
  }

  // Create an agent on-demand
  async createAgent(type, customConfig = {}) {
    this.log(`🚀 Creating JIT agent: ${type}`);

    const template = this.agentTemplates.get(type);
    if (!template) {
      throw new Error(`Unknown agent type: ${type}. Available: ${Array.from(this.agentTemplates.keys()).join(', ')}`);
    }

    const agentId = uuidv4();
    const agentConfig = {
      id: agentId,
      type,
      name: customConfig.name || `${template.name}-${agentId.substring(0, 8)}`,
      instructions: customConfig.instructions || template.instructions,
      tools: customConfig.tools || template.tools,
      specialization: template.specialization,
      model: customConfig.model || 'gpt-4.1',
      createdAt: new Date().toISOString(),
      status: 'creating',
      ...customConfig
    };

    try {
      // Create agent using Azure AI Foundry REST API
      const agent = await this.deployAgentToAzure(agentConfig, type);
      
      agentConfig.status = 'active';
      agentConfig.azureAgentId = agent.id;
      
      this.activeAgents.set(agentId, agentConfig);
      
      this.log(`✅ Agent created: ${agentConfig.name} (${agentId})`);
      return agentConfig;

    } catch (error) {
      this.log(`❌ Failed to create agent: ${error.message}`);
      agentConfig.status = 'failed';
      agentConfig.error = error.message;
      throw error;
    }
  }

  async deployAgentToAzure(agentConfig, agentType) {
    if (!this.azureResources) {
      throw new Error('Azure resources not initialized');
    }

    const apiKey = await this.getApiKey();
    
    const agentPayload = {
      instructions: agentConfig.instructions,
      name: agentConfig.name,
      tools: agentConfig.tools,
      model: agentConfig.model
    };

    // Use curl to create assistant via OpenAI API (Azure uses assistants, not agents)
    return new Promise((resolve, reject) => {
      const curlProcess = spawn('curl', [
        '--request', 'POST',
        '--url', `${this.azureResources.endpoint}openai/assistants?api-version=2024-05-01-preview`,
        '--header', `api-key: ${apiKey}`,
        '--header', 'Content-Type: application/json',
        '--data', JSON.stringify(agentPayload)
      ]);

      let output = '';
      let error = '';

      curlProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      curlProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      curlProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const azureResponse = JSON.parse(output);
            if (azureResponse.id && azureResponse.id.startsWith('asst_')) {
              // Create our internal agent object
              const agent = {
                id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                azureAgentId: azureResponse.id,
                name: azureResponse.name,
                type: agentType,
                created: Date.now(),
                tools: azureResponse.tools || [],
                model: azureResponse.model
              };
              
              this.activeAgents.set(agent.id, agent);
              this.log(`✅ Agent created: ${agent.name} (${agent.azureAgentId})`);
              resolve(agent);
            } else {
              reject(new Error(`Agent creation failed: ${output}`));
            }
          } catch (parseError) {
            this.log(`Parse error: ${parseError.message}`);
            this.log(`Raw output: ${output}`);
            reject(new Error(`Failed to parse agent response: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Curl failed: ${error}`));
        }
      });
    });
  }

  // Create multiple agents at once
  async createAgentSwarm(agents) {
    this.log(`🐝 Creating agent swarm: ${agents.length} agents`);
    
    const creationPromises = agents.map(agentSpec => 
      this.createAgent(agentSpec.type, agentSpec.config)
    );

    try {
      const results = await Promise.allSettled(creationPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      this.log(`✅ Swarm created: ${successful.length} successful, ${failed.length} failed`);
      
      return {
        successful,
        failed,
        swarmId: uuidv4()
      };

    } catch (error) {
      this.log(`❌ Swarm creation failed: ${error}`);
      throw error;
    }
  }

  // Create agents for specific use cases
  async createDevTeam() {
    return await this.createAgentSwarm([
      { type: 'coder', config: { name: 'Senior Developer', instructions: 'Lead development with best practices' } },
      { type: 'optimizer', config: { name: 'Performance Engineer', instructions: 'Optimize for speed and efficiency' } },
      { type: 'analyst', config: { name: 'Code Reviewer', instructions: 'Review code for quality and security' } },
      { type: 'researcher', config: { name: 'Tech Scout', instructions: 'Research new technologies and approaches' } }
    ]);
  }

  async createResearchTeam() {
    return await this.createAgentSwarm([
      { type: 'researcher', config: { name: 'Lead Researcher', instructions: 'Conduct primary research' } },
      { type: 'analyst', config: { name: 'Data Scientist', instructions: 'Analyze research data' } },
      { type: 'innovator', config: { name: 'Innovation Lead', instructions: 'Generate novel research directions' } },
      { type: 'collaborator', config: { name: 'Research Coordinator', instructions: 'Coordinate research activities' } }
    ]);
  }

  async createOptimizationTeam() {
    return await this.createAgentSwarm([
      { type: 'optimizer', config: { name: 'System Optimizer', instructions: 'Optimize overall system performance' } },
      { type: 'analyst', config: { name: 'Metrics Analyst', instructions: 'Measure and track performance metrics' } },
      { type: 'coder', config: { name: 'Implementation Specialist', instructions: 'Implement optimizations' } },
      { type: 'innovator', config: { name: 'Architecture Innovator', instructions: 'Design new optimization strategies' } }
    ]);
  }

  // Get agent by ID
  getAgent(agentId) {
    return this.activeAgents.get(agentId);
  }

  // List all active agents
  listAgents() {
    return Array.from(this.activeAgents.values());
  }

  // Destroy an agent
  async destroyAgent(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    this.log(`🗑️ Destroying agent: ${agent.name}`);
    
    try {
      // Delete from Azure if it has an Azure agent ID
      if (agent.azureAgentId) {
        await this.deleteAgentFromAzure(agent.azureAgentId);
      }
      
      this.activeAgents.delete(agentId);
      this.log(`✅ Agent destroyed: ${agent.name}`);
      
    } catch (error) {
      this.log(`❌ Failed to destroy agent: ${error.message}`);
      throw error;
    }
  }

  async deleteAgentFromAzure(azureAgentId) {
    const apiKey = await this.getApiKey();
    
    return new Promise((resolve, reject) => {
      const curlProcess = spawn('curl', [
        '--request', 'DELETE',
        '--url', `${this.azureResources.endpoint}openai/assistants/${azureAgentId}?api-version=2024-05-01-preview`,
        '--header', `api-key: ${apiKey}`
      ]);

      let error = '';

      curlProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      curlProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to delete agent: ${error}`));
        }
      });
    });
  }

  // Get factory statistics
  getStats() {
    const agents = this.listAgents();
    const stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      failedAgents: agents.filter(a => a.status === 'failed').length,
      agentTypes: {},
      azureResource: this.azureResources?.name || 'Not connected'
    };

    agents.forEach(agent => {
      stats.agentTypes[agent.type] = (stats.agentTypes[agent.type] || 0) + 1;
    });

    return stats;
  }

  // Cleanup all agents
  async cleanup() {
    this.log('🧹 Cleaning up all agents...');
    
    const agents = this.listAgents();
    const cleanupPromises = agents.map(agent => 
      this.destroyAgent(agent.id).catch(error => 
        this.log(`Failed to cleanup ${agent.id}: ${error.message}`)
      )
    );

    await Promise.allSettled(cleanupPromises);
    this.log('✅ Cleanup complete');
  }
}

export default JITAgentFactory;