import { PromptTemplate } from "langchain/prompts";
import type { ModelSettings } from "./types";
import { WebLLMChat } from "../agent/web-llm/llmChat";

export const createModel = (settings: ModelSettings) => {
  return new WebLLMChat({
    config: {
      kvConfig: {
        numLayers: 64,
        shape: [32, 32, 128],
        dtype: "float32",
      },
      wasmUrl: "wizardlm-7b_webgpu.wasm",
      cacheUrl:
        "https://huggingface.co/spaces/idosal/web-llm/resolve/main/wizardlm-7b/",
      tokenizer: "tokenizer.model",
      maxGenLength: 1024,
      meanGenLength: 256,
      maxWindowLength: 2048,
      setInitProgress: settings.setInitProgress,
      temperature: settings.customTemperature || 0.7,
    },
  });
};

export const startGoalPrompt = new PromptTemplate({
  template:
    'You have the following objective: `{goal}`. Create a list of zero to three tasks to be completed by you such that your goal is more closely reached or completely reached. The response list MUST be a SINGLE ARRAY OF STRINGS where each string is a TASK NAME wrapped in quotes (EXAMPLE OF RESPONSE FORMAT: "["task name", "task name"]"). You MUST be able to parse the array of strings with Javascript’s JSON.parse() function. You must respond with the array WITHOUT ANY OTHER TEXT.',
  inputVariables: ["goal"],
});

export const controlStartGoalPrompt = new PromptTemplate({
  template:
    'An autonomous task creation and execution AI has been given the following prompt: "`{prompt}`".' +
    "The AI has responded: `{response}`. If the response answers the prompt, format it into an array of strings with task names that can be parsed with JSON.parse(). If it does not answer the prompt, modify it to answer the prompt correctly",
  inputVariables: ["prompt", "response"],
});

export const executeTaskPrompt = new PromptTemplate({
  template:
    "You have the following goal: `{goal}`. You need to execute the following task on the way to achieve your goal: `{task}`. Execute the task yourself. You can do it! Return your response as a string. Do not return anything else.",
  inputVariables: ["goal", "task"],
});

export const createTasksPrompt = new PromptTemplate({
  template:
    "You have the following goal: `{goal}`. You have the following incomplete tasks remaining to achieve your goal: `{tasks}`, and have just executed the following task: `{lastTask}` and received the following result: `{result}`. Based on this, do you NEED to complete any NEW sub-tasks that ARE NOT ALREADY ON THE INCOMPLETE TASKS LIST so that your goal is more completely reached? If you do not need new sub-tasks to better achieve your goal, respond with the string `none` AND NOTHING ELSE. Only if you do need new sub-tasks, the response MUST be a SINGLE ARRAY OF STRINGS where each string is a TASK NAME (you MUST be able to parse the list with Javascript’s JSON.parse() function)",
  inputVariables: ["goal", "tasks", "lastTask", "result"],
});
