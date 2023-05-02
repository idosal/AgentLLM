import {
  createModel,
  startGoalPrompt,
  executeTaskPrompt,
  createTasksPrompt,
  analyzeTaskPrompt,
  controlStartGoalPrompt,
} from "../utils/prompts";
import type { ModelSettings } from "../utils/types";
import { LLMChain } from "langchain/chains";
import { extractTasks } from "../utils/helpers";
import { Serper } from "./custom-tools/serper";
import { isTooManyTries, retryAsync } from "ts-retry";

async function startGoalAgent(modelSettings: ModelSettings, goal: string, language: string) {
  async function startGoal() {
    const completion = await new LLMChain({
      llm: createModel(modelSettings),
      prompt: startGoalPrompt,
      verbose: true,
    }).call({
      goal,
      language
    });

    const initialTasks = extractTasks(completion.text as string, []);
    if (initialTasks.length) {
      return initialTasks;
    }

    const controlCompletion = await new LLMChain({
      llm: createModel(modelSettings),
      prompt: controlStartGoalPrompt,
      verbose: true,
    }).call({
      prompt: await startGoalPrompt.format({ goal: goal }),
      response: completion.text as string,
    });

    return extractTasks(controlCompletion.text as string, []);
  }

  try {
    return await retryAsync(startGoal, {
      delay: 0,
      maxTry: 5,
      until: (lastResult) => !!lastResult?.length,
    });
  } catch (err) {
    if (isTooManyTries(err)) {
      return [];
    } else {
      throw err;
    }
  }
}

async function analyzeTaskAgent(
  modelSettings: ModelSettings,
  goal: string,
  task: string
) {
  const actions = ["reason", "search"];
  const completion = await new LLMChain({
    llm: createModel(modelSettings),
    prompt: analyzeTaskPrompt,
  }).call({
    goal,
    actions,
    task,
  });

  console.log("Analysis completion:\n", completion.text);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return JSON.parse(completion.text) as Analysis;
  } catch (e) {
    console.error("Error parsing analysis", e);
    // Default to reasoning
    return DefaultAnalysis;
  }
}

export type Analysis = {
  action: "reason" | "search";
  arg: string;
};

export const DefaultAnalysis: Analysis = {
  action: "reason",
  arg: "Fallback due to parsing failure",
};

async function executeTaskAgent(
  modelSettings: ModelSettings,
  goal: string,
  language: string,
  task: string,
  analysis: Analysis
) {
  console.log("Execution analysis:", analysis);

  if (analysis.action == "search" && process.env.SERP_API_KEY) {
    return await new Serper(modelSettings, goal)._call(analysis.arg);
  }

  const completion = await new LLMChain({
    llm: createModel(modelSettings),
    prompt: executeTaskPrompt,
    verbose: true,
  }).call({
    goal,
    language,
    task,
  });

  // For local development when no SERP API Key provided
  if (analysis.action == "search" && !process.env.SERP_API_KEY) {
    return `\`ERROR: Failed to search as no SERP_API_KEY is provided in ENV.\` \n\n${
      completion.text as string
    }`;
  }

  return completion.text as string;
}

async function createTasksAgent(
  modelSettings: ModelSettings,
  goal: string,
  language: string,
  tasks: string[],
  lastTask: string,
  result: string,
  completedTasks: string[] | undefined
) {
  const completion = await new LLMChain({
    llm: createModel(modelSettings),
    prompt: createTasksPrompt,
    verbose: true,
  }).call({
    goal,
    language,
    tasks,
    lastTask,
    result,
  });

    return extractTasks(completion.text as string, []);
  }

  return createTask();
}

interface AgentService {
  startGoalAgent: (
    modelSettings: ModelSettings,
    goal: string,
    language: string
  ) => Promise<string[]>;
  analyzeTaskAgent: (
    modelSettings: ModelSettings,
    goal: string,
    task: string
  ) => Promise<Analysis>;
  executeTaskAgent: (
    modelSettings: ModelSettings,
    goal: string,
    language: string,
    task: string,
    analysis: Analysis
  ) => Promise<string>;
  createTasksAgent: (
    modelSettings: ModelSettings,
    goal: string,
    language: string,
    tasks: string[],
    lastTask: string,
    result: string,
    completedTasks: string[] | undefined
  ) => Promise<string[]>;
}

const OpenAIAgentService: AgentService = {
  startGoalAgent: startGoalAgent,
  analyzeTaskAgent: analyzeTaskAgent,
  executeTaskAgent: executeTaskAgent,
  createTasksAgent: createTasksAgent,
};

const MockAgentService: AgentService = {
  startGoalAgent: async (modelSettings, goal, language) => {
    return await new Promise((resolve) => resolve(["Task 1"]));
  },

  createTasksAgent: async (
    modelSettings: ModelSettings,
    goal: string,
    language: string,
    tasks: string[],
    lastTask: string,
    result: string,
    completedTasks: string[] | undefined
  ) => {
    return await new Promise((resolve) => resolve(["Task 4"]));
  },

  analyzeTaskAgent: async (
    modelSettings: ModelSettings,
    goal: string,
    task: string
  ) => {
    return await new Promise((resolve) =>
      resolve({
        action: "reason",
        arg: "Mock analysis",
      })
    );
  },

  executeTaskAgent: async (
    modelSettings: ModelSettings,
    goal: string,
    language: string,
    task: string,
    analysis: Analysis
  ) => {
    return await new Promise((resolve) => resolve("Result: " + task));
  },
};

export default OpenAIAgentService;
