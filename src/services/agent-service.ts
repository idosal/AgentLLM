import {
  createModel,
  startGoalPrompt,
  executeTaskPrompt,
  createTasksPrompt,
} from "../utils/prompts";
import type { ModelSettings } from "../utils/types";
import { env } from "../env/client.mjs";
import { LLMChain } from "langchain/chains";
import { extractTasks } from "../utils/helpers";
import { isTooManyTries, retryAsync } from "ts-retry";

async function startGoalAgent(modelSettings: ModelSettings, goal: string) {
  async function startGoal() {
    const completion = await new LLMChain({
      llm: createModel(modelSettings),
      prompt: startGoalPrompt,
    }).call({
      goal,
    });
    console.log("Completion:" + (completion.text as string));
    return extractTasks(completion.text as string, []);
  }

  try {
    return await retryAsync(startGoal, {
      delay: 0,
      maxTry: 5,
      until: (lastResult) => !!lastResult?.length,
    });
  } catch (err) {
    if (isTooManyTries(err)) {
      console.log("Failed to start goal", err);
      return [];
    } else {
      throw err;
    }
  }
}

async function executeTaskAgent(
  modelSettings: ModelSettings,
  goal: string,
  task: string
) {
  const completion = await new LLMChain({
    llm: createModel(modelSettings),
    prompt: executeTaskPrompt,
  }).call({
    goal,
    task,
  });

  return completion.text as string;
}

async function createTasksAgent(
  modelSettings: ModelSettings,
  goal: string,
  tasks: string[],
  lastTask: string,
  result: string,
  completedTasks: string[] | undefined
) {
  console.log("createTasksAgent", goal, tasks, result);

  async function createTask() {
    const completion = await new LLMChain({
      llm: createModel(modelSettings),
      prompt: createTasksPrompt,
    }).call({
      goal,
      tasks,
      lastTask,
      result,
    });

    return extractTasks(completion.text as string, completedTasks || []);
  }

  return createTask();
}

interface AgentService {
  startGoalAgent: (
    modelSettings: ModelSettings,
    goal: string
  ) => Promise<string[]>;
  executeTaskAgent: (
    modelSettings: ModelSettings,
    goal: string,
    task: string
  ) => Promise<string>;
  createTasksAgent: (
    modelSettings: ModelSettings,
    goal: string,
    tasks: string[],
    lastTask: string,
    result: string,
    completedTasks: string[] | undefined
  ) => Promise<string[]>;
}

const OpenAIAgentService: AgentService = {
  startGoalAgent: startGoalAgent,
  executeTaskAgent: executeTaskAgent,
  createTasksAgent: createTasksAgent,
};

const MockAgentService: AgentService = {
  startGoalAgent: async (modelSettings, goal) => {
    return await new Promise((resolve) => resolve(["Task 1"]));
  },

  createTasksAgent: async (
    modelSettings: ModelSettings,
    goal: string,
    tasks: string[],
    lastTask: string,
    result: string,
    completedTasks: string[] | undefined
  ) => {
    return await new Promise((resolve) => resolve(["Task 4"]));
  },

  executeTaskAgent: async (
    modelSettings: ModelSettings,
    goal: string,
    task: string
  ) => {
    return await new Promise((resolve) => resolve("Result: " + task));
  },
};

export default OpenAIAgentService;
