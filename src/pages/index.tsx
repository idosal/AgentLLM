import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { type NextPage } from "next";
import Badge from "../components/Badge";
import DefaultLayout from "../layout/default";
import ChatWindow from "../components/ChatWindow";
import Drawer from "../components/Drawer";
import Input from "../components/Input";
import Button from "../components/Button";
import { FaStar } from "react-icons/fa";
import PopIn from "../components/motions/popin";
import { VscLoading } from "react-icons/vsc";
import AutonomousAgent from "../components/AutonomousAgent";
import Expand from "../components/motions/expand";
import AboutDialog from "../components/AboutDialog";
// import { GPT_35_TURBO, DEFAULT_MAX_LOOPS_FREE } from "../utils/constants";
// import { SettingsDialog } from "../components/SettingsDialog";
import { TaskWindow } from "../components/TaskWindow";
import type { Message } from "../types/agentTypes";
import { useAgent } from "../hooks/useAgent";
import { isEmptyOrBlank } from "../utils/whitespace";
import HelpDialog from "../components/HelpDialog";
import { useMessageStore, resetAllSlices } from "../components/store";
import { isTask } from "../types/agentTypes";
// import { useSettings } from "../hooks/useSettings";

const Home: NextPage = () => {
  const name = "AgentLLM";
  // const [name, setName] = React.useState<string>("");
  const [t] = useTranslation();
  // zustand states
  const messages = useMessageStore.use.messages();
  const tasks = useMessageStore.use.tasks();
  const addMessage = useMessageStore.use.addMessage();
  const updateTaskStatus = useMessageStore.use.updateTaskStatus();

  // const { session, status } = useAuth();
  // const [name, setName] = React.useState<string>("");
  const [goalInput, setGoalInput] = React.useState<string>("");
  const [agent, setAgent] = React.useState<AutonomousAgent | null>(null);
  // const settingsModel = useSettings();
  const [shouldAgentStop, setShouldAgentStop] = React.useState(false);
  const [showHelpDialog, setShowHelpDialog] = React.useState(false);
  const [showAboutDialog, setShowAboutDialog] = React.useState(false);
  const [hasSaved, setHasSaved] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initProgress, setInitProgress] = React.useState(0);
  const agentUtils = useAgent();

  useEffect(() => {
    const key = "agentllm-modal-opened-v0.2";
    const savedModalData = localStorage.getItem(key);

    setTimeout(() => {
      if (savedModalData == null) {
        setShowAboutDialog(true);
      }
    }, 1800);

    localStorage.setItem(key, JSON.stringify(true));
  }, []);

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInputRef?.current?.focus();
  }, []);

  useEffect(() => {
    if (agent == null) {
      setShouldAgentStop(false);
    }
  }, [agent]);

  const handleAddMessage = (message: Message) => {
    if (!isInitialized) {
      if (message.type === "action" || message.type === 'task') {
        setIsInitialized(true);
      }
    }

    if (isTask(message)) {
      updateTaskStatus(message);
    }

    addMessage(message);
  };

  const disableDeployAgent =
    agent != null || isEmptyOrBlank(name) || isEmptyOrBlank(goalInput);

  const isAgentStopped = () => !agent?.isRunning || agent === null;

  const handleNewGoal = () => {
    const agent = new AutonomousAgent(
      name.trim(),
      goalInput.trim(),
      handleAddMessage,
      () => setAgent(null),
      { setInitProgress }
    );
    setAgent(agent);
    setHasSaved(false);
    resetAllSlices();
    agent.run().then(console.log).catch(console.error);
  };

  const handleKeyPress = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !disableDeployAgent) {
      if (!e.shiftKey) {
        // Only Enter is pressed, execute the function
        handleNewGoal();
      }
    }
  };

  const handleStopAgent = () => {
    setShouldAgentStop(true);
    agent?.stopAgent();
  };

  // const proTitle = (
  //   <>
  //     AgentGPT<span className="ml-1 text-amber-500/90">Pro</span>
  //   </>
  // );
  //
  // const shouldShowSave =
  //   status === "authenticated" &&
  //   !agent?.isRunning &&
  //   messages.length &&
  //   !hasSaved;

  return (
    <DefaultLayout>
      <AboutDialog
        show={showAboutDialog}
        close={() => setShowAboutDialog(false)}
      />
      <HelpDialog
        show={showHelpDialog}
        close={() => setShowHelpDialog(false)}
      />
      {/*<SettingsDialog*/}
      {/*  customSettings={settingsModel}*/}
      {/*  show={showSettingsDialog}*/}
      {/*  close={() => setShowSettingsDialog(false)}*/}
      {/*/>*/}
      <main className="flex min-h-screen flex-row">
        <Drawer
          showAbout={() => setShowAboutDialog(true)}
          showHelp={() => setShowHelpDialog(true)}
          // showSettings={() => setShowSettingsDialog(true)}
        />
        <div
          id="content"
          className="z-10 flex min-h-screen w-full items-center justify-center p-2 px-2 sm:px-4 md:px-10"
        >
          <div
            id="layout"
            className="flex h-full w-full max-w-screen-lg flex-col items-center justify-between gap-3 py-5 md:justify-center"
          >
            <div
              id="title"
              className="relative flex flex-col items-center font-mono"
            >
              <div className="flex flex-row items-start shadow-2xl">
                <img src={'/android-chrome-192x192.png'} className="w-16 h-16" />
                <span className="text-4xl font-bold text-[#C0C0C0] xs:text-5xl sm:text-6xl">
                  Agent
                </span>
                <span className="text-4xl font-bold text-white xs:text-5xl sm:text-6xl">
                  LLM
                </span>
                <PopIn delay={0.5} className="sm:right-0 sm:top-2">
                  <Badge>PoC</Badge>
                </PopIn>
              </div>
              <div className="mt-1 text-center font-mono text-[0.7em] font-bold text-white">
                <p>Autonomous browser-native AI Agents</p>
              </div>
            </div>

            <Expand className="flex w-full flex-row">
              <ChatWindow
                className="sm:mt-4"
                messages={messages}
                title={"AgentLLM"}
                showDonation={false}
                isInitialized={isInitialized}
                initProgress={initProgress}
                onSave={
                  undefined
                }
                scrollToBottom
                isAgentStopped={isAgentStopped()}
              />
              {tasks.length > 0 && (
                <TaskWindow isAgentStopped={isAgentStopped()} />
              )}
            </Expand>

            <div className="flex w-full flex-col gap-2 sm:mt-4 md:mt-10">
              {/*<Expand delay={1.2}>*/}
              {/*  <Input*/}
              {/*    inputRef={nameInputRef}*/}
              {/*    left={*/}
              {/*      <>*/}
              {/*        <FaRobot />*/}
              {/*        <span className="ml-2">Name:</span>*/}
              {/*      </>*/}
              {/*    }*/}
              {/*    value={name}*/}
              {/*    disabled={agent != null}*/}
              {/*    onChange={(e) => setName(e.target.value)}*/}
              {/*    onKeyDown={(e) => handleKeyPress(e)}*/}
              {/*    placeholder="AgentLLM"*/}
              {/*  />*/}
              {/*</Expand>*/}
              <Expand delay={1.3}>
                <Input
                  left={
                    <>
                      <FaStar />
                      <span className="ml-2">Goal</span>
                    </>
                  }
                  disabled={agent != null}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder="Build a global empire"
                  type="textarea"
                />
              </Expand>
            </div>
            <Expand delay={1.4} className="flex gap-2">
              <Button disabled={disableDeployAgent} onClick={handleNewGoal}>
                {agent == null ? (
                  t("Deploy Agent")
                ) : (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{t("Running")}</span>
                  </>
                )}
              </Button>
              <Button
                disabled={agent == null}
                onClick={handleStopAgent}
                enabledClassName={"bg-red-600 hover:bg-red-400"}
              >
                {shouldAgentStop ? (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{t("Stopping")}</span>
                  </>
                ) : (
                  t("Stop Agent")
                )}
              </Button>
            </Expand>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default Home;

