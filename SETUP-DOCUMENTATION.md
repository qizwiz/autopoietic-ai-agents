# AZURE AGENT SWARM - COMPLETE SETUP DOCUMENTATION

**CRITICAL: This documents the working Azure OpenAI agent system that was successfully tested on 2025-01-12**

## VERIFIED WORKING COMPONENTS

### ✅ Azure OpenAI Integration
- **Endpoint**: `https://actualizedai-instance01.openai.azure.com/`
- **Authentication**: Azure CLI (`az login` + `az account get-access-token`)
- **Model**: `gpt-4.1` 
- **Working Assistant IDs**: 
  - `asst_Hr1f0BSUrliCR3QfwCBB53Xb` (Sarah Chen - Senior Developer)
  - `asst_HylT9uPHYuhJBaXH9YFXwULA` (TestCoder)
  - `asst_PHyAa4o4Ljlz6Yh7iKZHROem` (QuickTest)

### ✅ Core System Files
```
/Users/jonathanhill/src/ftmcp/
├── jit-agent-factory.js          # CORE: Agent creation factory (TESTED ✅)
├── azure-agent-cli.js            # CLI interface (partial ✅)
├── simple-task-demo.js           # PROVEN working demo (TESTED ✅)
├── test-everything.js            # Agent testing framework
├── evolutionary-agent-system.js  # Evolution system (sophisticated prompts)
├── mycelium-network.js           # Living network system
└── azure-agent-mcp-server*.js   # MCP servers (needs fixes ❌)
```

## TESTED WORKING WORKFLOW

### 1. Agent Creation (VERIFIED)
```javascript
import { JITAgentFactory } from './jit-agent-factory.js';

const factory = new JITAgentFactory();
await factory.initialize();

// Creates REAL Azure OpenAI assistant
const agent = await factory.createAgent('analyst', { 
  name: 'TestAgent',
  instructions: 'You are a helpful analyst.'
});

console.log(`Created: ${agent.azureAgentId}`); // Real Azure ID
```

### 2. Conversation Flow (VERIFIED)
```bash
# This ACTUALLY WORKS - tested 2025-01-12
node simple-task-demo.js

# Output shows:
# ✅ Thread created: thread_LDTLy2R6CRgiQv8Mq0yFqVxb
# ✅ Agent response with real Emacs Lisp code
```

### 3. Available Agent Types
```javascript
// All verified templates exist:
['coder', 'analyst', 'optimizer', 'researcher', 'collaborator', 'innovator']

// Each has:
// - Specialized instructions
// - code_interpreter tool access
// - Unique personality/expertise
```

## AZURE SETUP REQUIREMENTS

### Environment Variables
```bash
# Azure authentication (REQUIRED)
az login
export AZURE_OPENAI_ENDPOINT="https://actualizedai-instance01.openai.azure.com/"

# Verified working subscription
az account show
# "subscriptionId": "c0c04dbe-7425-4f3b-96b3-304b77b22a5a"
```

### Required Dependencies
```bash
npm install uuid
# Azure CLI must be installed and authenticated
```

## STANDALONE AGENT ACCESS

### Method 1: Direct Factory Usage
```javascript
// Direct access to agent system
import { JITAgentFactory } from './jit-agent-factory.js';

const factory = new JITAgentFactory();
await factory.initialize();

// Create specialized agent
const agent = await factory.createAgent('coder', {
  name: 'MyCodeBot',
  instructions: 'You are a senior software engineer.'
});

// Agent now exists in Azure OpenAI
console.log(`Azure ID: ${agent.azureAgentId}`);
```

### Method 2: Working CLI (partial functionality)
```bash
node azure-agent-cli.js

# Commands that work:
# create <type> <name>  # Creates real agents
# list                  # Shows created agents

# Commands with issues:
# ask <agent> <question>  # Has conversation bugs
```

### Method 3: Proven Demo Script
```bash
# This is the VERIFIED working conversation
node simple-task-demo.js

# This script:
# 1. Creates Azure thread
# 2. Sends message to existing agent
# 3. Gets real AI response
# 4. Shows complete API workflow
```

## AGENT CONVERSATION API

### Complete Working Flow (from simple-task-demo.js)
```javascript
// 1. Get Azure credentials
const apiKey = await getApiKey();
const endpoint = "https://actualizedai-instance01.openai.azure.com/";

// 2. Create conversation thread
const threadResponse = await makeApiCall('POST', 
  `${endpoint}openai/threads?api-version=2024-05-01-preview`, {}, apiKey);
const thread = JSON.parse(threadResponse);

// 3. Add user message
await makeApiCall('POST', 
  `${endpoint}openai/threads/${thread.id}/messages?api-version=2024-05-01-preview`, {
    role: 'user',
    content: 'Your question here'
  }, apiKey);

// 4. Run the assistant
const runResponse = await makeApiCall('POST', 
  `${endpoint}openai/threads/${thread.id}/runs?api-version=2024-05-01-preview`, {
    assistant_id: 'asst_Hr1f0BSUrliCR3QfwCBB53Xb'  // Real assistant ID
  }, apiKey);

// 5. Wait for completion and get response
// (Full implementation in simple-task-demo.js)
```

## AGENT SYSTEM CAPABILITIES

### What Actually Works
✅ **Real Azure OpenAI assistant creation**
✅ **Specialized agent templates with distinct personalities**
✅ **Full conversation workflow with real AI responses**
✅ **Agent factory that discovers Azure resources automatically**
✅ **Multiple agent types with code_interpreter access**
✅ **Thread management and message handling**

### What's Sophisticated Theater
❌ **"Evolutionary" learning** - Really prompt modifications
❌ **"Fitness functions"** - Keyword counting algorithms  
❌ **"Agent spawning"** - Scripted prompt templates
❌ **"Mycelium network"** - Shows 0 connections after 70+ cycles

### What Needs Fixes
❌ **MCP integration** - Protocol issues prevent Claude Code integration
❌ **CLI conversation flow** - Method availability issues
❌ **Error handling** - Some edge cases not covered

## UNHOOKING FROM DEPENDENCIES

### Core System (Keep This)
```bash
# Minimal working system:
cp jit-agent-factory.js ~/backup/
cp simple-task-demo.js ~/backup/
cp test-everything.js ~/backup/

# These three files contain the working agent system
```

### Standalone Conversation Function
```javascript
// Extract this pattern for standalone use:
async function talkToAgent(assistantId, question) {
  // Use the exact API flow from simple-task-demo.js
  // This is PROVEN to work
}
```

## BACKUP STRATEGY

### Critical Files to Preserve
```bash
# Core system
jit-agent-factory.js           # Agent creation (ESSENTIAL)
simple-task-demo.js           # Proven conversation (ESSENTIAL)

# Working demos  
test-everything.js            # Multi-agent framework
azure-agent-cli.js           # CLI interface base

# Business logic
evolutionary-agent-system.js  # Evolution framework
mycelium-network.js           # Network system

# Configuration
package.json                  # Dependencies
claude-code-mcp-config.json  # MCP config
```

### Recovery Command
```bash
# To rebuild working system:
git clone <this-repo>
cd ftmcp
npm install
az login
node simple-task-demo.js  # Verify it works
```

## TESTED COMPETITIVE ADVANTAGES

1. **Programmatic Azure OpenAI assistant creation** ✅
2. **Specialized AI agents with distinct capabilities** ✅  
3. **Full conversation API integration** ✅
4. **Multiple agent types on demand** ✅
5. **Real cloud AI infrastructure** ✅

## NEXT STEPS TO PRESERVE

1. **Fix MCP integration** - Resolve protocol issues
2. **Create simplified conversation API** - Extract from working demo
3. **Build reliable CLI** - Fix askAgent method issues
4. **Document Azure setup** - Complete authentication guide
5. **Create backup agent system** - Standalone version

---

**CRITICAL**: The core JITAgentFactory + simple-task-demo.js combination IS WORKING and provides real Azure OpenAI agent capabilities. This is valuable intellectual property that should be preserved.

Last tested: 2025-01-12 14:18 PST
Status: WORKING ✅