import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import type { ModelSettings } from "./types";
import {GPT_35_TURBO, WEB_LLM} from "./constants";
import {WebLLMChat} from "../agent/web-llm/llmChat";

export const createModel = (settings: ModelSettings) => {
  console.log('create model', settings);
  return new WebLLMChat(
    { config: {
        "kvConfig": {
          "numLayers": 64,
          "shape": [32, 32, 128],
          "dtype": "float32"
        },
        "wasmUrl": "vicuna-7b-v1_webgpu.wasm",
        "cacheUrl": "https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-7b-v1/",
        "tokenizer": "tokenizer.model",
        "maxGenLength": 1024,
        "meanGenLength": 256,
        "maxWindowLength": 2048
      }
    });
  // if (settings.customModelName === WEB_LLM) {
  //   return new LLMChatPipeline(
  //   { config: {
  //       "kvConfig": {
  //         "numLayers": 64,
  //         "shape": [32, 32, 128],
  //         "dtype": "float32"
  //       },
  //       "wasmUrl": "vicuna-7b-v1/vicuna-7b-v1_webgpu.wasm",
  //       "cacheUrl": "https://huggingface.co/mlc-ai/web-lm/resolve/main/vicuna-7b-v1/",
  //       "tokenizer": "vicuna-7b-v1/tokenizer.model",
  //       "maxGenLength": 1024,
  //       "meanGenLength": 256,
  //       "maxWindowLength": 2048
  //     }
  //   });
  // } else {
  //   return new OpenAI({
  //     openAIApiKey:
  //       settings.customApiKey === ""
  //         ? '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'
  //         : settings.customApiKey,
  //     temperature: settings.customTemperature || 0.9,
  //     modelName:
  //       settings.customModelName === "" ? GPT_35_TURBO : settings.customModelName,
  //     maxTokens: 400,
  //   });
  // }

};

export const startGoalPrompt = new PromptTemplate({
  template:
    "You have the following objective: `{goal}`. Create a list of zero to three tasks to be completed by you such that your goal is more closely reached or completely reached. The response list MUST be a SINGLE ARRAY OF STRINGS where each string is a TASK NAME wrapped in quotes (EXAMPLE OF RESPONSE FORMAT: \"[\"task name\", \"task name\"]\"). You must respond with the array WITHOUT ANY OTHER TEXT.",
  inputVariables: ["goal"],
});

export const executeTaskPrompt = new PromptTemplate({
  template:
    "You have the following objective `{goal}`. You have the following tasks `{task}`. Execute the task yourself. Return the execution response as a string. Do not return anything else.",
  inputVariables: ["goal", "task"],
});

export const createTasksPrompt = new PromptTemplate({
  template:
    "You have the following objective `{goal}`. You have the following incomplete tasks `{tasks}` and have just executed the following task `{lastTask}` and received the following result `{result}`. Based on this, create a new task to be completed by your AI system ONLY IF NEEDED such that your goal is more closely reached or completely reached. The response MUST be a SINGLE ARRAY OF STRINGS where each string is a TASK NAME (EXAMPLE OF RESPONSE: \"[\"Task name\"]\"). You must respond with the array WITHOUT ANY OTHER TEXT.",
  inputVariables: ["goal", "tasks", "lastTask", "result"],
});
