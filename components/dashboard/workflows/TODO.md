# Workflow Engine - TODO

This document tracks pending features and integrations for the ROS workflow automation system.

## Completed

- [x] Execution Store (`store/execution-store.ts`)
  - Track execution state (running, paused, stopped)
  - Manage node execution queue with topological sort
  - Node status updates (idle → running → success/failure)
  - Trigger management (arm/disarm, fire)

- [x] Workflow Executor Hook (`hooks/use-workflow-executor.ts`)
  - Core execution logic with ROS actions
  - Publish Topic using `useTopicsStore`
  - Call Service using `useServicesStore`
  - Set/Get/Delete Param using `useParamsStore`
  - Trigger setup (Topic Monitor, Interval, Manual)

- [x] Enhanced Properties Panel (`properties-panel.tsx`)
  - Dropdowns populated from ROS stores (topics, services, params)
  - Auto-fill message/request fields using `messageTypeParser`
  - Schema-based JSON editors

- [x] Workflow Toolbar (`workflow-toolbar.tsx`)
  - Play/Pause/Stop controls
  - Arm/Disarm triggers toggle
  - Execution status indicator

- [x] Enhanced Custom Node (`nodes/custom-node.tsx`)
  - Pulsing border when running
  - LED status indicator with animations
  - Color-coded status states

---

## Pending

### 1. Convex DB Integration

The workflow system needs to sync with Convex for:

#### Workflow Persistence
```typescript
// convex/workflows.ts
export const workflows = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  userId: v.id("users"),
  nodes: v.array(v.object({
    id: v.string(),
    type: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    data: v.any()
  })),
  edges: v.array(v.object({
    id: v.string(),
    source: v.string(),
    target: v.string()
  })),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
})
```

#### Execution History
```typescript
// convex/workflowExecutions.ts
export const workflowExecutions = defineTable({
  workflowId: v.id("workflows"),
  userId: v.id("users"),
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  nodeResults: v.array(v.object({
    nodeId: v.string(),
    status: v.string(),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    duration: v.optional(v.number())
  })),
  triggerData: v.optional(v.any())
})
```

#### Tier-Based Limits
- **Free Tier**: 5 workflow runs/month
- **Pro Tier**: 50 workflow runs/month  
- **Team Tier**: Unlimited

```typescript
// Check before execution
const user = await ctx.db.get(userId)
if (user.subscriptionTier === 'free' && user.workflowCount >= 5) {
  throw new Error('Monthly workflow limit reached')
}
```

### 2. Inngest Integration for Heavy Tasks

#### AI Processor Node
```typescript
// inngest/functions.ts
export const processWithAI = inngest.createFunction(
  { id: "workflow-ai-processor" },
  { event: "workflow/ai.process" },
  async ({ event, step }) => {
    const { prompt, inputData, nodeId, workflowRunId } = event.data
    
    const result = await step.run("call-google-ai", async () => {
      const { generateText } = await import("ai")
      const { google } = await import("@ai-sdk/google")
      
      return generateText({
        model: google("gemini-1.5-flash"),
        prompt: `${prompt}\n\nInput Data: ${JSON.stringify(inputData)}`
      })
    })
    
    // Update Convex with result
    await step.run("update-convex", async () => {
      // convex mutation to update node result
    })
    
    return { nodeId, result: result.text }
  }
)
```

#### Integration Nodes (Slack, Discord, Email)
```typescript
// inngest/functions.ts
export const sendSlackNotification = inngest.createFunction(
  { id: "workflow-slack-notification" },
  { event: "workflow/integration.slack" },
  async ({ event, step }) => {
    const { webhookUrl, message, nodeId } = event.data
    
    await step.run("send-to-slack", async () => {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message })
      })
      
      if (!response.ok) throw new Error("Slack notification failed")
    })
    
    return { success: true }
  }
)
```

### 3. Command Relay via Convex

For the browser-relay architecture, Convex can sync commands:

```typescript
// convex/rosCommands.ts
export const rosCommands = defineTable({
  workflowExecutionId: v.id("workflowExecutions"),
  type: v.union(v.literal("publish"), v.literal("service"), v.literal("param")),
  payload: v.object({
    topic: v.optional(v.string()),
    message: v.optional(v.any()),
    serviceName: v.optional(v.string()),
    request: v.optional(v.any()),
    paramName: v.optional(v.string()),
    paramValue: v.optional(v.any())
  }),
  status: v.union(v.literal("pending"), v.literal("executed"), v.literal("failed")),
  createdAt: v.number(),
  executedAt: v.optional(v.number())
})

// Browser subscribes to pending commands
export const getPendingCommands = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("rosCommands")
      .filter(q => q.eq(q.field("status"), "pending"))
      .collect()
  }
})
```

### 4. Additional Features

- [ ] **Workflow Templates**: Pre-built workflows for common use cases
- [ ] **Conditional Branching**: If/Else nodes with multiple outputs
- [ ] **Loops**: Repeat node execution based on conditions
- [ ] **Variables Panel**: Global variables accessible across nodes
- [ ] **Execution History View**: UI to view past runs and replay
- [ ] **Error Retry**: Configurable retry logic per node
- [ ] **Workflow Import/Export**: JSON-based workflow sharing
- [ ] **Real-time Collaboration**: Multiple users editing same workflow

---

## API Routes to Create

### `/api/workflows`
- `GET` - List user's workflows
- `POST` - Create new workflow
- `PUT` - Update workflow
- `DELETE` - Delete workflow

### `/api/workflows/[id]/execute`
- `POST` - Trigger manual execution

### `/api/inngest`
- Already exists, add new functions for AI and integrations

---

## Environment Variables Needed

```env
# Already have
NEXT_PUBLIC_CONVEX_URL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# To add for integrations
GOOGLE_GENERATIVE_AI_API_KEY=
RESEND_API_KEY=  # For email integration
```

---

## Notes

- The execution engine currently runs entirely in the browser for ROS actions
- This is intentional since roslibjs requires a browser WebSocket connection
- Inngest handles server-side tasks (AI, integrations) asynchronously
- Convex provides real-time sync for execution state and command relay

