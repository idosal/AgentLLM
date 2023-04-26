import React from "react";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Dialog from "./Dialog";

export default function HelpDialog({
  show,
  close,
}: {
  show: boolean;
  close: () => void;
}) {
  return (
    <Dialog header="Help" isShown={show} close={close}>
      <div className="text-md relative flex-auto p-2 leading-relaxed">
        <p>Since running the model locally is very taxing, lower-tier machines may not be able to run this PoC.
          For the best experience, try AgentLLM on a powerful desktop device.</p>
        <br/>
        <p>
          Getting started:
        </p>
        <ul>
          <li>
            1. Install{" "}
            <a href={"https://www.google.com/chrome/canary/"}  target={"_blank"} rel={'noreferrer'}>
              <u>Chrome Canary</u> 🐦. Currently, it is the only browser that supports the required WebGPU feature.
            </a>
          </li>
          <li>
            2. Launch Chrome Canary (preferably with --enable-dawn-features=disable_robustness).
          </li>
          <li>For example, in MacOS, run the following command in the terminal: /Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --enable-dawn-features=disable_robustness
          </li>
          <li>
            3. Navigate to AgentLLM
          </li>
        </ul>
        <br />
        <p>
          If you need further assistance, feel free to reach out via Twitter or Github:
        </p>
        <div className="mt-4 flex w-full items-center justify-center gap-5">
          {/*<div*/}
          {/*  className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"*/}
          {/*  onClick={() =>*/}
          {/*    window.open("https://discord.gg/jdSBAnmdnY", "_blank")*/}
          {/*  }*/}
          {/*>*/}
          {/*  <FaDiscord size={30} />*/}
          {/*</div>*/}
          <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() => window.open("https://twitter.com/idosal1", "_blank")}
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
