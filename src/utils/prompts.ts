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
      wasmUrl: "vicuna-7b-v1_webgpu.wasm",
      cacheUrl:
        "https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-7b-v1/",
      tokenizer: "tokenizer.model",
      maxGenLength: 1024,
      meanGenLength: 256,
      maxWindowLength: 2048,
      setInitProgress: settings.setInitProgress,
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
    "You have the following goal: `{goal}`. You need to execute the following task on the way to achieve your goal: `{task}`. Execute the task yourself. You can do it! Return the execution response as a string. Do not return anything else.",
  inputVariables: ["goal", "task"],
});

export const createTasksPrompt = new PromptTemplate({
  template:
    "You have the following goal: `{goal}`. You have the following incomplete tasks: `{tasks}`, and have just executed the following task: `{lastTask}` and received the following result: `{result}`. Based on this, do you NEED to complete NEW tasks that ARE NOT ALREADY ON THE LIST so that your goal is more completely reached? The response MUST be a SINGLE ARRAY OF STRINGS where each string is a TASK NAME. You MUST be able to parse the list with Javascript’s JSON.parse() function. You must respond with the array WITHOUT ANY OTHER TEXT.",
  inputVariables: ["goal", "tasks", "lastTask", "result"],
});
