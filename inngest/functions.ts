import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const backgroundJob = inngest.createFunction(
  { id: "background-job" },
  { event: "test/background.job" },
  async ({ step }) => {
    await step.sleep("processing-data", "2s");
    await step.sleep("analyzing-results", "3s");
    return { status: "completed" };
  }
);
