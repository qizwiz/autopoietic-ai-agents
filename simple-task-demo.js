#!/usr/bin/env node

// Simple Task Demo - Ask real Azure AI agents for Emacs Lisp
import { spawn } from 'child_process';

class SimpleAgentTask {
  constructor() {
    this.apiKey = null;
    this.endpoint = 'https://actualizedai-instance01.openai.azure.com/';
  }

  async getApiKey() {
    return new Promise((resolve, reject) => {
      const proc = spawn('az', [
        'cognitiveservices', 'account', 'keys', 'list',
        '--name', 'ActualizedAI-Instance01',
        '--resource-group', 'vp_of_development',
        '--query', 'key1',
        '--output', 'tsv'
      ]);
      
      let output = '';
      proc.stdout.on('data', data => output += data);
      proc.on('close', code => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get API key'));
        }
      });
    });
  }

  async makeApiCall(method, endpoint, data = null) {
    console.log(`📡 Making ${method} call to: ${endpoint}`);
    if (data) {
      console.log(`📝 Payload: ${JSON.stringify(data, null, 2)}`);
    }
    
    return new Promise((resolve, reject) => {
      const curlArgs = [
        '--request', method,
        '--url', `${this.endpoint}${endpoint}?api-version=2024-05-01-preview`,
        '--header', `api-key: ${this.apiKey}`,
        '--header', 'Content-Type: application/json',
        '--silent',
        '--show-error'
      ];

      if (data) {
        curlArgs.push('--data', JSON.stringify(data));
      }

      console.log(`🔧 Raw curl command: curl ${curlArgs.join(' ')}`);

      const curl = spawn('curl', curlArgs);
      let output = '';
      let error = '';

      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.stderr.on('data', (data) => {
        error += data.toString();
      });

      curl.on('close', (code) => {
        console.log(`📨 Raw API Response: ${output}`);
        if (error) console.log(`⚠️  Stderr: ${error}`);
        
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            reject(new Error(`Parse error: ${output}`));
          }
        } else {
          reject(new Error(`API call failed (${code}): ${error}`));
        }
      });
    });
  }

  async askAgentForEmacsLisp(assistantId, agentName) {
    console.log(`\n🤖 Asking ${agentName} for Emacs Lisp...`);
    console.log(`   Assistant ID: ${assistantId}`);
    
    // Step 1: Create a thread
    console.log('\n📎 Step 1: Creating conversation thread...');
    const threadResponse = await this.makeApiCall('POST', 'openai/threads', {});
    const threadId = threadResponse.id;
    console.log(`✅ Thread created: ${threadId}`);

    // Step 2: Add the message
    console.log('\n💬 Step 2: Adding message to thread...');
    const messageData = {
      role: 'user',
      content: 'Write some simple Emacs Lisp code that outputs a message to the Emacs message buffer. Make it friendly and show that you are a real AI agent working.'
    };
    
    await this.makeApiCall('POST', `openai/threads/${threadId}/messages`, messageData);
    console.log('✅ Message added to thread');

    // Step 3: Create and run the conversation
    console.log('\n🏃 Step 3: Running the conversation...');
    const runData = {
      assistant_id: assistantId
    };
    
    const runResponse = await this.makeApiCall('POST', `openai/threads/${threadId}/runs`, runData);
    const runId = runResponse.id;
    console.log(`✅ Run started: ${runId}`);

    // Step 4: Wait for completion
    console.log('\n⏳ Step 4: Waiting for AI response...');
    let attempts = 0;
    
    while (attempts < 30) {
      console.log(`   Checking run status (attempt ${attempts + 1})...`);
      
      const run = await this.makeApiCall('GET', `openai/threads/${threadId}/runs/${runId}`);
      console.log(`   Status: ${run.status}`);
      
      if (run.status === 'completed') {
        console.log('✅ Run completed! Getting messages...');
        
        // Get the response
        const messages = await this.makeApiCall('GET', `openai/threads/${threadId}/messages`);
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (assistantMessage) {
          const response = assistantMessage.content[0].text.value;
          console.log(`\n🎯 ${agentName} responded:`);
          console.log('═'.repeat(80));
          console.log(response);
          console.log('═'.repeat(80));
          return response;
        } else {
          throw new Error('No assistant message found');
        }
      }
      
      if (run.status === 'failed') {
        console.log('❌ Run failed:');
        console.log(JSON.stringify(run.last_error, null, 2));
        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Run timed out after 30 attempts');
  }

  async runDemo() {
    console.log('🚀 Simple Task Demo: Real Azure AI Agents');
    console.log('=========================================\n');

    // Get API key
    console.log('🔑 Getting Azure API key...');
    this.apiKey = await this.getApiKey();
    console.log('✅ API key retrieved');

    // These are your actual live agents from the previous session
    const agents = [
      {
        name: 'Sarah Chen (Senior Developer)',
        assistantId: 'asst_Hr1f0BSUrliCR3QfwCBB53Xb'
      },
      {
        name: 'Alex Rodriguez (Security Analyst)', 
        assistantId: 'asst_iK8O8KjehR5xcfZqwwJ2aaOf'
      },
      {
        name: 'Morgan Kim (DevOps Architect)',
        assistantId: 'asst_mMl0T7WcqTk1K5B5LkzfMJEP'
      }
    ];

    // Ask one of them for Emacs Lisp
    const selectedAgent = agents[0]; // Sarah Chen
    
    console.log(`\n🎯 Selected agent: ${selectedAgent.name}`);
    console.log(`   This is a REAL Azure OpenAI assistant`);
    console.log(`   Assistant ID: ${selectedAgent.assistantId}`);
    
    try {
      const response = await this.askAgentForEmacsLisp(selectedAgent.assistantId, selectedAgent.name);
      
      console.log('\n🎉 SUCCESS!');
      console.log('===========');
      console.log('✅ Made real API calls to Azure OpenAI');
      console.log('✅ Your agent generated actual Emacs Lisp code');
      console.log('✅ This proves the agents are real and working');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      console.log('\n🔍 This might help debug:');
      console.log('- Check if the assistant still exists');
      console.log('- Verify API permissions');
      console.log('- Check Azure OpenAI quota');
    }
  }
}

// Run the demo
const demo = new SimpleAgentTask();
demo.runDemo().catch(console.error);