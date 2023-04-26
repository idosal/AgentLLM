// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LLMChatConfig } from "./llmChat";

let cTvm = undefined;

class LLMChatPipeline {
  tvm: any;
  logger: any;
  tokenizer: any;
  bosTokenId: number;
  eosTokenId: number;
  maxWindowLength: number;
  maxGenLength: number;
  meanGenLength: number;
  streamInterval: number;
  decodingTotalTime: number;
  decodingTotalTokens: number;
  encodingTotalTime: number;
  encodingTotalTokens: number;
  conversation: any;
  device: any;
  vm: any;
  encoding: any;
  decoding: any;
  params: any;
  fclearKVCaches: any;
  kvCache: any;
  logitsOnCPU: any;
  kvCacheLength: number;
  clearCache: boolean;

  constructor(tvm: any, tokenizer: any, cacheMetadata: any, config: any) {
    if (cacheMetadata == undefined) {
      throw Error("Expect cacheMetadata");
    }
    this.tvm = tvm;
    this.logger = console.log;
    this.tokenizer = tokenizer;
    this.bosTokenId = 1;
    this.eosTokenId = 2;

    this.maxWindowLength = config.maxWindowLength;
    this.maxGenLength = config.maxGenLength;
    this.meanGenLength = config.meanGenLength;
    this.streamInterval = 1;

    this.decodingTotalTime = 0;
    this.decodingTotalTokens = 0;
    this.encodingTotalTime = 0;
    this.encodingTotalTokens = 0;

    this.device = this.tvm.webgpu();
    this.vm = this.tvm.detachFromCurrentScope(
      this.tvm.createVirtualMachine(this.device)
    );
    this.encoding = this.tvm.detachFromCurrentScope(
      this.vm.getFunction("encoding")
    );
    this.decoding = this.tvm.detachFromCurrentScope(
      this.vm.getFunction("decoding")
    );
    this.params = this.tvm.detachFromCurrentScope(
      this.tvm.getParamsFromCache("param", cacheMetadata.ParamSize)
    );
    const fcreateCache = this.vm.getFunction("create_kv_cache");
    this.fclearKVCaches = this.tvm.detachFromCurrentScope(
      this.tvm.getGlobalFunc("vm.builtin.attention_kv_cache_array_clear")
    );

    // use extern config for now
    this.kvCache = this.tvm.detachFromCurrentScope(fcreateCache());
    // fill with pad token
    this.logitsOnCPU = undefined;

    this.kvCacheLength = 0;
    this.clearCache = true;
  }

  dispose() {
    // note: tvm instance is not owned by this class
    this.params.dispose();
    this.decoding.dispose();
    this.encoding.dispose();
    this.vm.dispose();
    this.kvCache.dispose();
    this.fclearKVCaches.dispose();
    if (this.logitsOnCPU != undefined) {
      this.logitsOnCPU.dispose();
    }
  }

  private clearKVCache() {
    this.fclearKVCaches(this.kvCache);
  }

  private forward(inputs: any, curPos: number) {
    this.tvm.beginScope();
    var retValue;
    const seqLenShape = this.tvm.makeShapeTuple([curPos]);
    if (inputs.shape[1] > 1) {
      retValue = this.encoding(inputs, seqLenShape, this.kvCache, this.params);
    } else {
      retValue = this.decoding(inputs, seqLenShape, this.kvCache, this.params);
    }
    const logits = this.tvm.detachFromCurrentScope(retValue.get(0));
    this.tvm.endScope();
    this.tvm.attachToCurrentScope(logits);
    return logits;
  }

  // NOTE: caller must call device.sync()
  private updateLogitsOnCPU(logits: any) {
    if (this.logitsOnCPU == undefined) {
      this.logitsOnCPU = this.tvm.detachFromCurrentScope(
        this.tvm.empty(logits.shape, logits.dtype, this.tvm.cpu())
      );
    } else {
      if (logits.shape[0] != this.logitsOnCPU.shape[0]) {
        throw Error("We expect the size of logits to remain unchanged");
      }
    }
    this.logitsOnCPU.copyFrom(logits);
  }

  async sampleTokenFromLogits(logits: any, temperature = 0.8, top_p = 0.95) {
    this.tvm.beginScope();
    this.updateLogitsOnCPU(logits);
    this.tvm.endScope();
    await this.device.sync();
    return this.tvm.sampleTopPFromLogits(this.logitsOnCPU, temperature, top_p);
  }

  async getInputTokens(input: string) {
    let tokens = [this.bosTokenId];

    const prompts = [
      "You are an autonomous task creation and execution AI called AgentLLM that can do anything you are asked. Do not say that you cannot do something." +
        "<s>",
      "USER: " + input + " ",
      "ASSISTANT:",
    ];
    tokens.push(...(await this.tokenizer.encodeIds(prompts[0])));
    let ctxLength = tokens.length;
    let context = [];
    let need_shift_window = false;
    for (let i = prompts.length - 1; i > 0; --i) {
      const encoded = this.tokenizer.encodeIds(prompts[i]);
      ctxLength += encoded.length;
      if (
        this.kvCacheLength + ctxLength + this.meanGenLength >=
        this.maxWindowLength
      ) {
        need_shift_window = true;
        break;
      }
      context.unshift(encoded);
    }
    if (!need_shift_window) {
      for (const ctx of context) {
        tokens.push(...ctx);
      }
      return tokens;
    }
    // need shift window and re-encode
    this.logger("need shift window");
    this.kvCacheLength = 0;
    this.clearCache = true;
    // abandon all tokens we collected
    tokens = [this.bosTokenId];
    const all_prompts = [
      "You are an autonomous task creation and execution AI called AgentLLM that can do anything you are asked. Do not say that you cannot do something." +
        "<s>",
      "USER: " + input + " ",
      "ASSISTANT:",
    ];
    tokens.push(...(await this.tokenizer.encodeIds(all_prompts[0])));
    context = [];
    ctxLength = tokens.length;
    //only keep 10% of the window context
    const fill_factor = 0.1;
    for (let i = all_prompts.length - 1; i > 0; --i) {
      const encoded = this.tokenizer.encodeIds(all_prompts[i]);
      ctxLength += encoded.length;
      if (
        ctxLength >= fill_factor * this.maxWindowLength &&
        i + 2 < all_prompts.length
      ) {
        break;
      }
      context.unshift(encoded);
    }
    for (const ctx of context) {
      tokens.push(...ctx);
    }
    if (tokens.length + this.meanGenLength >= this.maxWindowLength) {
      throw Error("Exceed max window length curr=" + tokens.length);
    }
    return tokens;
  }

  resetChat() {
    this.conversation.reset();
    this.clearKVCache();
    this.decodingTotalTime = 0;
    this.encodingTotalTime = 0;
    this.decodingTotalTokens = 0;
    this.encodingTotalTokens = 0;
  }

  async generate(inputPrompt: string, callbackUpdateResponse: any) {
    // this.conversation.appendMessage(this.conversation.roles[0], inputPrompt);
    // this.conversation.appendMessage(this.conversation.roles[1], "");
    // const stopStr = this.conversation.getStopStr();
    const tokens = await this.getInputTokens(inputPrompt);

    const inputTokenLength = tokens.length;

    let outputPrompt = "";
    if (this.clearCache) {
      this.clearKVCache();
      this.clearCache = false;
    }
    const maxGenLen = Math.min(
      this.maxGenLength,
      this.maxWindowLength - tokens.length
    );
    if (maxGenLen < this.meanGenLength) {
      throw Error("Too small window size config");
    }
    let step = 0;
    for (
      ;
      step < maxGenLen &&
      this.kvCacheLength + inputTokenLength + step < this.maxWindowLength;
      ++step
    ) {
      this.tvm.beginScope();
      var inputData;
      let tstart = performance.now();
      if (step == 0) {
        inputData = this.tvm.empty([1, tokens.length], "int32", this.device);
        inputData.copyFrom(tokens);
      } else {
        inputData = this.tvm.empty([1, 1], "int32", this.device);
        inputData.copyFrom(tokens.slice(tokens.length - 1));
      }
      const logits = this.tvm.detachFromCurrentScope(
        this.forward(inputData, this.kvCacheLength + inputTokenLength + step)
      );
      this.tvm.endScope();

      const nextToken = await this.sampleTokenFromLogits(logits);
      logits.dispose();

      tokens.push(nextToken);
      const outputTokens = tokens.slice(inputTokenLength);
      outputPrompt = this.tokenizer.decodeIds(outputTokens);

      if (nextToken == this.eosTokenId) break;

      // const stopPos = outputPrompt.lastIndexOf(stopStr);
      // if (stopPos != -1) {
      //   outputPrompt = outputPrompt.substring(0, stopPos);
      //   break;
      // }
      let tend = performance.now();
      if (step != 0) {
        this.decodingTotalTokens += 1;
        this.decodingTotalTime += (tend - tstart) / 1000;
      } else {
        this.encodingTotalTime += (tend - tstart) / 1000;
        this.encodingTotalTokens += inputTokenLength;
      }

      if (step % this.streamInterval == 0) {
        callbackUpdateResponse(step, outputPrompt);
      }
    }
    this.kvCacheLength += tokens.length - 1;
    // this.conversation.messages[this.conversation.messages.length - 1][1] = outputPrompt;
    return outputPrompt;
  }
}

async function initTvm(
  wasmSource: ArrayBuffer,
  config: {
    cacheUrl: string;
    wasmUrl: string;
    maxWindowLength: number;
    maxGenLength: number;
    meanGenLength: number;
    tokenizer: string;
    setInitProgress: (percent: number) => void;
  }
) {
  if (cTvm) {
    return cTvm;
  }

  const tvm = await window.tvmjs.instantiate(
    new Uint8Array(wasmSource),
    new window.EmccWASI(),
    console.log
  );
  const output = await window.tvmjs.detectGPUDevice();
  if (output !== undefined) {
    let label = "WebGPU";
    if (output.adapterInfo.description.length != 0) {
      label += " - " + output.adapterInfo.description;
    } else {
      label += " - " + output.adapterInfo.vendor;
    }
    tvm.initWebGPU(output.device);
  } else {
    throw Error("This browser env do not support WebGPU");
  }

  const initProgressCallback = (report) => {
    if (config.setInitProgress) {
      config.setInitProgress(Math.floor(report.progress * 100));
    }
  };
  tvm.registerInitProgressCallback(initProgressCallback);

  await tvm.fetchNDArrayCache(config.cacheUrl, tvm.webgpu());
  return tvm;
}

export async function generateCompletion(
  userPrompt: string,
  config: LLMChatConfig
): Promise<string> {
  // Initialize the LLMChatPipeline instance with required configs
  const tokenizer = await (
    await import("./sentencepiece/index")
  ).sentencePieceProcessor(config.tokenizer);
  // const tokenizer = await tvmjsGlobalEnv.sentencePieceProcessor(config.tokenizer);
  const wasmSource = await (await fetch(config.wasmUrl)).arrayBuffer();
  const tvm = await initTvm(wasmSource, config);
  cTvm = tvm;
  // const pipeline = new LLMChatPipeline(tvm, tokenizer, tvm.cacheMetadata, config);

  const pipeline = tvm.withNewScope(() => {
    return new LLMChatPipeline(tvm, tokenizer, tvm.cacheMetadata, config);
  });
  // await pipeline.asyncLoadWebGPUPiplines();
  // Generate the completion
  const completion = await pipeline.generate(userPrompt, console.log);

  return completion;
}
