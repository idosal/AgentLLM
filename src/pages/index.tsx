import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { type NextPage } from "next";
import Badge from "../components/Badge";
import DefaultLayout from "../layout/default";
import ChatWindow from "../components/ChatWindow";
import Drawer from "../components/Drawer";
import Input from "../components/Input";
import Button from "../components/Button";
import { FaStar, FaPlay } from "react-icons/fa";
import PopIn from "../components/motions/popin";
import { VscLoading } from "react-icons/vsc";
import AutonomousAgent from "../components/AutonomousAgent";
import Expand from "../components/motions/expand";
import AboutDialog from "../components/AboutDialog";
// import { GPT_35_TURBO, DEFAULT_MAX_LOOPS_FREE } from "../utils/constants";
// import { SettingsDialog } from "../components/SettingsDialog";
import { TaskWindow } from "../components/TaskWindow";
// import { useAuth } from "../hooks/useAuth";
import type { AgentPlaybackControl, Message } from "../types/agentTypes";
// import { useAgent } from "../hooks/useAgent";
import { isEmptyOrBlank } from "../utils/whitespace";
import {
  useMessageStore,
  useAgentStore,
  resetAllMessageSlices,
} from "../components/stores";
import { SettingsDialog } from "../components/SettingsDialog";
import HelpDialog from "../components/HelpDialog";
import { isTask, AGENT_PLAY } from "../types/agentTypes";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// import { useSettings } from "../hooks/useSettings";
import { SorryDialog } from "../components/SorryDialog";
// import { languages } from "../utils/languages";
import {useSettings} from "../hooks/useSettings";

const Home: NextPage = () => {
  const name = 'AgentLLM';
  // const [name, setName] = React.useState<string>("");
  const { i18n } = useTranslation();
  // zustand states
  const messages = useMessageStore.use.messages();
  const tasks = useMessageStore.use.tasks();
  const addMessage = useMessageStore.use.addMessage();
  const updateTaskStatus = useMessageStore.use.updateTaskStatus();

  // const { session, status } = useAuth();
  // const [name, setName] = React.useState<string>("");
  const setAgent = useAgentStore.use.setAgent();
  const isAgentStopped = useAgentStore.use.isAgentStopped();
  const isAgentPaused = useAgentStore.use.isAgentPaused();
  const updateIsAgentPaused = useAgentStore.use.updateIsAgentPaused();
  const updateIsAgentStopped = useAgentStore.use.updateIsAgentStopped();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const agentMode = useAgentStore.use.agentMode();
  const agent = useAgentStore.use.agent();

  // const { session, status } = useAuth();
  // const [name, _] = React.useState<string>("");
  const [goalInput, setGoalInput] = React.useState<string>("");
  const settingsModel = useSettings();

  const [showHelpDialog, setShowHelpDialog] = React.useState(false);
  const [showAboutDialog, setShowAboutDialog] = React.useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = React.useState(false);
  const [showSorryDialog, setShowSorryDialog] = React.useState(false);
  // const [showSignInDialog, setShowSignInDialog] = React.useState(false);
  const [saved, setHasSaved] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initProgress, setInitProgress] = React.useState(0);
  // const agentUtils = useAgent();

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
    updateIsAgentStopped();
  }, [agent, updateIsAgentStopped]);

  const handleAddMessage = (message: Message) => {
    if (!isInitialized) {
      if (message.type === "action" || message.type === "task") {
        setIsInitialized(true);
      }
    }

    if (isTask(message)) {
      updateTaskStatus(message);
    }

    addMessage(message);
  };

  const handlePause = (opts: {
    agentPlaybackControl?: AgentPlaybackControl;
  }) => {
    if (opts.agentPlaybackControl !== undefined) {
      updateIsAgentPaused(opts.agentPlaybackControl);
    }
  };

  const disableDeployAgent =
    agent != null || isEmptyOrBlank(name) || isEmptyOrBlank(goalInput);

  const handleNewGoal = () => {
    const newAgent = new AutonomousAgent(
      name.trim(),
      goalInput.trim(),
      i18n.language,
      handleAddMessage,
      handlePause,
      () => setAgent(null),
      { ...settingsModel.settings, setInitProgress },
      agentMode,
    );
    setAgent(newAgent);
    setHasSaved(false);
    resetAllMessageSlices();
    newAgent?.run().then(console.log).catch(console.error);
  };

  const handleContinue = () => {
    if (!agent) {
      return;
    }

    agent.updatePlayBackControl(AGENT_PLAY);
    updateIsAgentPaused(agent.playbackControl);
    agent.updateIsRunning(true);
    agent.run().then(console.log).catch(console.error);
  };

  const handleKeyPress = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Only Enter is pressed, execute the function
    if (e.key === "Enter" && !disableDeployAgent && !e.shiftKey) {
      if (isAgentPaused) {
        handleContinue();
      }
      handleNewGoal();
    }
  };

  const handleStopAgent = () => {
    agent?.stopAgent();
    updateIsAgentStopped();
  };

  // const proTitle = (
  //   <>
  //     AgentGPT<span className="ml-1 text-amber-500/90">Pro</span>
  //   </>
  // );
  //
  // const shouldShowSave =
  //   status === "authenticated" &&
  //   isAgentStopped &&
  //   messages.length &&
  //   !hasSaved;

  const firstButton =
    isAgentPaused && !isAgentStopped ? (
      <Button ping disabled={!isAgentPaused} onClick={handleContinue}>
        <FaPlay size={20} />
        <span className="ml-2">{i18n.t("Continue")}</span>
      </Button>
    ) : (
      <Button disabled={disableDeployAgent} onClick={handleNewGoal}>
        {agent == null ? (
          i18n.t("Deploy Agent")
        ) : (
          <>
            <VscLoading className="animate-spin" size={20} />
            <span className="ml-2">{i18n.t("Running")}</span>
          </>
        )}
      </Button>
    );

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
      <SettingsDialog
        customSettings={settingsModel}
        show={showSettingsDialog}
        close={() => setShowSettingsDialog(false)}
      />
      <SorryDialog
        show={showSorryDialog}
        close={() => setShowSorryDialog(false)}
      />
      {/*<SignInDialog*/}
      {/*  show={showSignInDialog}*/}
      {/*  close={() => setShowSignInDialog(false)}*/}
      {/*/>*/}
      <main className="flex min-h-screen flex-row">
        <Drawer
          showAbout={() => setShowAboutDialog(true)}
          showHelp={() => setShowHelpDialog(true)}
          showSettings={() => setShowSettingsDialog(true)}
        />
        <div
          id="content"
          className="z-10 flex min-h-screen w-full items-center justify-center p-2 sm:px-4 md:px-10"
        >
          <div
            id="layout"
            className="flex h-full w-full max-w-screen-xl flex-col items-center justify-between gap-1 py-2 sm:gap-3 sm:py-5 md:justify-center"
          >
            <div
              id="title"
              className="relative flex flex-col items-center font-mono"
            >
              <div className="flex flex-row items-start shadow-2xl">
                <img
                  src={"/android-chrome-192x192.png"}
                  className="h-16 w-16"
                 alt={'Title'}/>
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
                isInitialized={isInitialized}
                initProgress={initProgress}
                onSave={undefined}
                scrollToBottom
                displaySettings
                openSorryDialog={() => setShowSorryDialog(true)}
              />
              {tasks.length > 0 && <TaskWindow />}
            </Expand>

            <div className="flex w-full flex-col gap-2 md:m-4 ">
              {/*<Expand delay={1.2}>*/}
              {/*  <Input*/}
              {/*    inputRef={nameInputRef}*/}
              {/*    left={*/}
              {/*      <>*/}
              {/*        <FaRobot />*/}
              {/*        <span className="ml-2">{`${i18n?.t("AGENT_NAME", {*/}
              {/*          ns: "indexPage",*/}
              {/*        })}`}</span>*/}
              {/*      </>*/}
              {/*    }*/}
              {/*    value={name}*/}
              {/*    disabled={agent != null}*/}
              {/*    onChange={(e) => setName(e.target.value)}*/}
              {/*    onKeyDown={(e) => handleKeyPress(e)}*/}
              {/*    placeholder="AgentGPT"*/}
              {/*    type="text"*/}
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
              {firstButton}
              <Button
                disabled={agent === null}
                onClick={handleStopAgent}
                enabledClassName={"bg-red-600 hover:bg-red-400"}
              >
                {!isAgentStopped && agent === null ? (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{"Stopping"}</span>
                  </>
                ) : (
                  "Stop Agent"
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

// export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
//   const supportedLocales = languages.map((language) => language.code);
//   const chosenLocale = supportedLocales.includes(locale) ? locale : "en";
//
//   return {
//     props: {
//       ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
//     },
//   };
// };
