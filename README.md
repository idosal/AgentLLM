<p align="center">
<a href="https://agentllm.verce/">🔗 Demo</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#-getting-started">🤝 Contribute</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="https://twitter.com/idosal1">🐦 Twitter</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="">📢 Medium</a>
</p>

---

<h1>AgentLLM</h1>
<b>AgentLLM</b> is the first proof of concept to utilize an open-source large language model (LLM) to develop autonomous agents that operate solely on the browser. Its main goal is to demonstrate that embedded LLMs have the ability to handle the complex goal-oriented tasks of autonomous agents with acceptable performance.

The implementation of the embedded LLM builds on the fantastic research of <a href="https://github.com/mlc-ai/web-llm">WebLLM</a>, which takes advantage of Chromium's bleeding edge introduction of <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API">WebGPU</a> (currently available only on Canary versions) to run inference utilizing the GPU. It offers significant performance gains over the previously available CPU-based implementations.

To create a sanitary and accessible sandbox, I chose to modify the popular <a href="https://github.com/reworkd/AgentGPT">AgentGPT</a> project by replacing ChatGPT with Vicuna7B and changing the prompt mechanism. At its core, AgentGPT allows deploying autonomous agents to perform any arbitrary goal (from basic tasks to complex problem solving) by running a loop of task generation and execution. It's a perfect match for our requirements as its agents do not use tools, eliminating the complexity and unpredictability of external factors (which is present in full-blown implementations of other popular frameworks), and its GUI is friendly and feature-rich. The sandbox enables quick prototyping of the models' ability to break down tasks and plan ahead (try it!).</p>

<h2>Motivation</h2>

<p>Recent advancements in large language models (LLMs) like OpenAI's ChatGPT and GPT-4 have led to the rise of autonomous agents that can act independently, without human intervention, to achieve specified goals. However, most notable LLMs require massive computational resources, restricting their operation to powerful remote servers. Their remote operation leads to a variety of issues concerning privacy, cost, and availability. That is where browser-native LLMs come in, changing the way we think about autonomous agents and their potential applications.</p>

<p align="center">
<a href="https://github.com/sponsors/reworkd-admin">👉 Click here</a> to support AgentGPT (template of this project)
</p>

## Getting Started

### 🏃 Running the demo

1. Install <a href="https://www.google.com/chrome/canary/">Chrome Canary</a> (or <a href="https://www.microsoftedgeinsider.com/en-us/download/canary">Edge Canary</a>) 🐦. Currently, they are the only browsers that supports the required WebGPU feature.
2. Launch Chrome Canary (preferably with `--enable-dawn-features=disable_robustness`).
   For example, in MacOS, run the following command in the terminal: `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --enable-dawn-features=disable_robustness`
3. Navigate to <a href="https://agentllm.vercel.app/">AgentLLM</a>

Since running the model locally is very taxing, lower-tier devices may not be able to run the demo. For the best experience, try AgentLLM on a powerful desktop device.

### 🐳 Docker Setup

The easiest way to run AgentLLM locally is by using docker.
A convenient setup script is provided to help you get started.

```bash
./setup.sh --docker
```

### 👷 Local Development Setup

If you wish to develop AgentLLM locally, the easiest way is to
use the provided setup script.

```bash
./setup.sh --local
```

### 🛠️ Manual Setup

> 🚧 You will need [Nodejs +18 (LTS recommended)](https://nodejs.org/en/) installed.

1. Fork this project:

- [Click here](https://github.com/idosal/AgentLLM/fork).

2. Clone the repository:

```bash
git clone git@github.com:YOU_USER/AgentLLM.git
```

3. Install dependencies:

```bash
cd AgentLLM
npm install
```

4. Create a **.env** file with the following content:

> 🚧 The environment variables must match the following [schema](https://github.com/idosal/AgentLLM/blob/main/src/env/schema.mjs).

```bash
# Deployment Environment:
NODE_ENV=development

# Next Auth config:
# Generate a secret with `openssl rand -base64 32`
NEXTAUTH_SECRET=changeme
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./db.sqlite

# Your open api key
OPENAI_API_KEY=changeme
```

5. Modify prisma schema to use sqlite:

```bash
./prisma/useSqlite.sh
```

**Note:** This only needs to be done if you wish to use sqlite.

6. Ready 🥳, now run:

```bash
# Create database migrations
npx prisma db push
npm run dev
```

### 🚀 GitHub Codespaces

Set up AgentLLM in the cloud immediately by using [GitHub Codespaces](https://github.com/features/codespaces).

1. From the GitHub repo, click the green "Code" button and select "Codespaces".
2. Create a new Codespace or select a previous one you've already created.
3. Codespaces opens in a separate tab in your browser.
4. In terminal, run `bash ./setup.sh --local`
5. When prompted in terminal, add your OpenAI API key.
6. Click "Open in browser" when the build process completes.

- To shut AgentLLM down, enter Ctrl+C in Terminal.
- To restart AgentLLM, run `npm run dev` in Terminal.

Run the project 🥳

```
npm run dev
```

---
