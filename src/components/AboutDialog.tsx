import React from "react";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Dialog from "./Dialog";

export default function AboutDialog({
  show,
  close,
}: {
  show: boolean;
  close: () => void;
}) {
  return (
    <Dialog header="Welcome to AgentLLM" isShown={show} close={close}>
      <div className="text-md relative flex-auto p-2 leading-relaxed">
        <p>
          <strong>AgentLLM</strong> is the first proof-of-concept that utilizes browser-native LLMs
          in autonomous agents 🏠 With <strong>complete privacy</strong> and <strong>no hidden costs</strong>,
          you can experience the freedom of autonomous agents like never before.
        </p>
        <br />
        <p>
          Built on top of AgentGPT, it replaces OpenAI models with Vicuna, allowing it to run
          solely on your browser.
          You can use AgentLLM to configure and deploy Autonomous AI agents to achieve any goal, without sending data to remote servers.
          It will attempt to reach the goal by thinking of tasks to do, executing them, and learning from the results.
        </p>
        <div>
          <br />
          For more information, read the <a href={''} target={"_blank"} rel={'noreferrer'}><u>blog post</u></a>.
          <br />
          <br />
          This PoC is only the beginning. Get ready to blast off with AgentLLM and join this exciting journey 🚀
          <br />
        </div>
        <div className="mt-4 flex w-full items-center justify-center gap-5">
          <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() =>
              window.open(
                "https://twitter.com/idosal1",
                "_blank"
              )
            }
          >
            <FaTwitter size={30} />
          </div>
          <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() =>
              window.open("https://github.com/idosal/AgentLLM", "_blank")
            }
          >
            <FaGithub size={30} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
