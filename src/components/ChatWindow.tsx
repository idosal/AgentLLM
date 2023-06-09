import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { FaClipboard, FaImage, FaSave, FaPlay, FaPause } from "react-icons/fa";
import PopIn from "./motions/popin";
import Expand from "./motions/expand";
import * as htmlToImage from "html-to-image";
import WindowButton from "./WindowButton";
import PDFButton from "./pdf/PDFButton";
import FadeIn from "./motions/FadeIn";
import Menu from "./Menu";
import type { Message } from "../types/agentTypes";
import {
  isAction,
  getTaskStatus,
  MESSAGE_TYPE_GOAL,
  MESSAGE_TYPE_THINKING,
  MESSAGE_TYPE_SYSTEM,
  TASK_STATUS_STARTED,
  TASK_STATUS_EXECUTING,
  TASK_STATUS_COMPLETED,
  TASK_STATUS_FINAL,
  PAUSE_MODE,
} from "../types/agentTypes";
import clsx from "clsx";
import { isMobile } from 'react-device-detect';
import { getMessageContainerStyle, getTaskStatusIcon } from "./utils/helpers";
import { useAgentStore } from "./stores";
import { AnimatePresence } from "framer-motion";
import { CgExport } from "react-icons/cg";
import MarkdownRenderer from "./MarkdownRenderer";
// import { Switch } from "./Switch";

interface ChatWindowProps extends HeaderProps {
  children?: ReactNode;
  className?: string;
  fullscreen?: boolean;
  scrollToBottom?: boolean;
  displaySettings?: boolean; // Controls if settings are displayed at the bottom of the ChatWindow
  openSorryDialog?: () => void;
  isInitialized?: boolean;
  initProgress?: number;
}

const messageListId = "chat-window-message-list";

const ChatWindow = ({
  messages,
  children,
  className,
  title,
  onSave,
  fullscreen,
  scrollToBottom,
  displaySettings,
  openSorryDialog,
                      isInitialized,
                      initProgress
}: ChatWindowProps) => {
  // const [t] = useTranslation();
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const isAgentPaused = useAgentStore.use.isAgentPaused();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const agentMode = useAgentStore.use.agentMode();
  const agent = useAgentStore.use.agent();
  const isWebSearchEnabled = useAgentStore.use.isWebSearchEnabled();
  const setIsWebSearchEnabled = useAgentStore.use.setIsWebSearchEnabled();

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    // Use has scrolled if we have scrolled up at all from the bottom
    const hasUserScrolled = scrollTop < scrollHeight - clientHeight - 10;
    setHasUserScrolled(hasUserScrolled);
  };

  useEffect(() => {
    setIsUnsupported(!(window?.navigator as Navigator & { gpu: unknown })?.gpu || isMobile);
  }, [])

  useEffect(() => {
    // Scroll to bottom on re-renders
    if (scrollToBottom && scrollRef && scrollRef.current) {
      if (!hasUserScrolled) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  });

  const handleChangeWebSearch = (value: boolean) => {
    // Change this value when we can no longer support web search
    const WEB_SEARCH_ALLOWED = false;

    if (WEB_SEARCH_ALLOWED) {
      setIsWebSearchEnabled(value);
    } else {
      openSorryDialog?.();
      setIsWebSearchEnabled(false);
    }
  };

  return (
    <div
      className={
        "border-translucent flex w-full flex-col rounded-2xl border-2 border-white/20 bg-zinc-900 text-white shadow-2xl drop-shadow-lg " +
        (className ?? "")
      }
    >
      <MacWindowHeader title={title} messages={messages} onSave={onSave} />
      <div
        className={clsx(
          "mb-2 mr-2 ",
          (fullscreen && "max-h-[75vh] flex-grow overflow-auto") ||
            "window-heights"
        )}
        ref={scrollRef}
        onScroll={handleScroll}
        id={messageListId}
      >
        {agent !== null && agentMode === PAUSE_MODE && isAgentPaused && (
          <FaPause className="animation-hide absolute left-1/2 top-1/2 text-lg md:text-3xl" />
        )}
        {agent !== null && agentMode === PAUSE_MODE && !isAgentPaused && (
          <FaPlay className="animation-hide absolute left-1/2 top-1/2 text-lg md:text-3xl" />
        )}
        {messages.map((message, index) => {
          if (getTaskStatus(message) === TASK_STATUS_EXECUTING) {
          return null;
        }
          return (
            <FadeIn key={`${index}-${message.type}`}>
              <ChatMessage message={message} isInitialized={isInitialized} initProgress={initProgress} />
            </FadeIn>
          );
        })}
        {children}

        {messages.length === 0 && (
          <>
            <Expand delay={0.7} type="spring">
              <ChatMessage
                message={{
                  type: MESSAGE_TYPE_SYSTEM,
                  value: "🏠 AgentLLM runs locally on your browser without OpenAI. It's private and free!",                }}
              />
            </Expand>
            {isUnsupported && <Expand delay={0.8} type="spring">
              <ChatMessage
                message={{
                  type: MESSAGE_TYPE_SYSTEM,
                  value:
                    "❌ Error: your browser does not meet the minimum requirements (WebGPU). Please try AgentLLM on Chrome/Edge on a mid-high tier desktop (see 'Help')",
                }}
              />
            </Expand>}
            {!isUnsupported && <Expand delay={0.8} type="spring">
              <ChatMessage
                message={{
                  type: MESSAGE_TYPE_SYSTEM,
                  value:
                    "👉 Create an agent by writing a goal and hitting deploy!",
                }}
              />
            </Expand>}
          </>
        )}
      </div>
      {displaySettings && (
        <>
          {/*<div className="flex items-center justify-center">*/}
          {/*  <div className="m-1 flex items-center gap-2 rounded-lg border-[2px] border-white/20 bg-zinc-700 px-2 py-1">*/}
          {/*    <p className="font-mono text-sm">Web search</p>*/}
          {/*    <Switch*/}
          {/*      value={isWebSearchEnabled}*/}
          {/*      onChange={handleChangeWebSearch}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*</div>*/}
        </>
      )}
    </div>
  );
};

interface HeaderProps {
  title?: string | ReactNode;
  messages: Message[];
  onSave?: (format: string) => void;
}

const MacWindowHeader = (props: HeaderProps) => {
  const [t] = useTranslation();
  const isAgentPaused = useAgentStore.use.isAgentPaused();
  const agent = useAgentStore.use.agent();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const agentMode = useAgentStore.use.agentMode();
  const saveElementAsImage = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    htmlToImage
      .toJpeg(element, {
        height: element.scrollHeight,
        style: {
          overflowY: "visible",
          maxHeight: "none",
          border: "none",
        },
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "agent-llm-output.png";
        link.click();
      })
      .catch(console.error);
  };

  const copyElementText = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    const text = element.innerText;

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    } else {
      // Fallback to a different method for unsupported browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        console.log("Text copied to clipboard");
      } catch (err) {
        console.error("Unable to copy text to clipboard", err);
      }

      document.body.removeChild(textArea);
    }
  };

  const exportOptions = [
    <WindowButton
      key="Image"
      onClick={(): void => saveElementAsImage(messageListId)}
      icon={<FaImage size={12} />}
      name={`${t("IMAGE", { ns: "common" })}`}
    />,
    <WindowButton
      key="Copy"
      onClick={(): void => copyElementText(messageListId)}
      icon={<FaClipboard size={12} />}
      name={`${t("COPY", { ns: "common" })}`}
    />,
    <PDFButton key="PDF" name="PDF" messages={props.messages} />,
  ];

  return (
    <div className="flex items-center gap-1 overflow-visible rounded-t-3xl p-3">
      <PopIn delay={0.4}>
        <div className="h-3 w-3 rounded-full bg-red-500" />
      </PopIn>
      <PopIn delay={0.5}>
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
      </PopIn>
      <PopIn delay={0.6}>
        <div className="h-3 w-3 rounded-full bg-green-500" />
      </PopIn>
      <Expand
        delay={1}
        className="invisible flex flex-grow font-mono text-sm font-bold text-gray-500 sm:ml-2 md:visible"
      >
        {props.title}
      </Expand>

      <AnimatePresence>
        {props.onSave && (
          <PopIn>
            <WindowButton
              ping
              key="Agent"
              onClick={() => props.onSave?.("db")}
              icon={<FaSave size={12} />}
              name={`${t("SAVE", { ns: "common" })}`}
              styleClass={{
                container: `relative bg-[#3a3a3a] md:w-20 text-center font-mono rounded-lg text-gray/50 border-[2px] border-white/30 font-bold transition-all sm:py-0.5 hover:border-[#1E88E5]/40 hover:bg-[#6b6b6b] focus-visible:outline-none focus:border-[#1E88E5]`,
              }}
            />
          </PopIn>
        )}
      </AnimatePresence>

      {agentMode === PAUSE_MODE && agent !== null && (
        <div
          className={`animation-duration text-gray/50 flex items-center gap-2 px-2 py-1 text-left font-mono text-sm font-bold transition-all sm:py-0.5`}
        >
          {isAgentPaused ? (
            <>
              <FaPause />
              <p className="font-mono">Paused</p>
            </>
          ) : (
            <>
              <FaPlay />
              <p className="font-mono">Running</p>
            </>
          )}
        </div>
      )}

      <Menu
        icon={<CgExport />}
        name={`Export`}
        onChange={() => null}
        items={exportOptions}
        styleClass={{
          container: "relative",
          input: `bg-[#3a3a3a] animation-duration text-left py-1 px-2 text-sm font-mono rounded-lg text-gray/50 border-[2px] border-white/30 font-bold transition-all sm:py-0.5 hover:border-[#1E88E5]/40 hover:bg-[#6b6b6b] focus-visible:outline-none focus:border-[#1E88E5]`,
          option: "w-full py-[1px] md:py-0.5",
        }}
      />
    </div>
  );
};
const ChatMessage = ({
  message,
  isInitialized, initProgress
}: {
  message: Message;
  isInitialized?: boolean;
  initProgress?: number;
}) => {
  const [t] = useTranslation();

  return (
    <div
      className={`${getMessageContainerStyle(
        message
      )} mx-2 my-1 rounded-lg border-[2px] bg-white/20 p-1 font-mono text-sm hover:border-[#1E88E5]/40 sm:mx-4 sm:p-3 sm:text-base`}
    >
      {message.type != MESSAGE_TYPE_SYSTEM && (
        // Avoid for system messages as they do not have an icon and will cause a weird space
        <>
          <div className="mr-2 inline-block h-[0.9em]">
            {getTaskStatusIcon(message, {})}
          </div>
          <span className="mr-2 font-bold">{getMessagePrefix(message)}</span>
        </>
      )}

      {message.type == MESSAGE_TYPE_THINKING && !isInitialized &&  (
        <span className="italic text-zinc-400">
          Initialization ({initProgress}%) may take a few minutes when populating the cache but future initializations will be quick. If no progress is shown for a few minutes, it could indicate that your device or internet connection may not meet the minimum requirements (see `Help`)
        </span>
      )}

      {isAction(message) ? (
        <>
          <hr className="my-2 border-[1px] border-white/20" />
          <div className="prose max-w-none">
            <MarkdownRenderer>{message.info || ""}</MarkdownRenderer>
          </div>
        </>
      ) : (
        <>
          <span>{t(message.value, { ns: "chat" })}</span>
          {
            // Link to the FAQ if it is a shutdown message
            message.type == MESSAGE_TYPE_SYSTEM &&
              (message.value.toLowerCase().includes("shut") ||
                message.value.toLowerCase().includes("error")) && <FAQ />
          }
        </>
      )}
    </div>
  );
};

// Returns the translation key of the prefix
const getMessagePrefix = (message: Message) => {
  if (message.type === MESSAGE_TYPE_GOAL) {
    return "Working towards a new goal...";
  } else if (message.type === MESSAGE_TYPE_THINKING) {
    return "Thinking...";
  } else if (getTaskStatus(message) === TASK_STATUS_STARTED) {
    return "Added task";
  } else if (getTaskStatus(message) === TASK_STATUS_COMPLETED) {
    return `Completing: ${message.value}`;
  } else if (getTaskStatus(message) === TASK_STATUS_FINAL) {
    return "No more subtasks for:";
  }
  return "";
};

const FAQ = () => {
  return (
    <p>
      If you are facing any issues, please check out the Help page or {" "}
      <a
        href="https://github.com/idosal/AgentLLM"
        className="text-sky-500"
      >
        Github
      </a>
    </p>
  );
};
export default ChatWindow;
export { ChatMessage };
