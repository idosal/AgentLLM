import { type ReactNode } from "react";
import Head from "next/head";
import DottedGridBackground from "../components/DottedGridBackground";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}

const DefaultLayout = (props: LayoutProps) => {
  const [ t ] = useTranslation();
  const description =
    "Autonomous browser-native AI Agents";
  return (
    <div
      className={clsx(
        "flex flex-col bg-gradient-to-b from-[#1c1a1a] to-[#1F1F1F]",
        props.centered && "items-center justify-center"
      )}
    >
      <Head>
        <title>AgentLLM</title>
        <meta name="description" content={description} />
        <meta name="twitter:site" content="@AgentLLM" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AgentLLM" />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content="https://user-images.githubusercontent.com/18148989/234704508-56e08243-256e-4d57-b8ef-338783854ee8.png"
        />
        <meta name="twitter:image:width" content="1280" />
        <meta name="twitter:image:height" content="640" />
        <meta
          property="og:title"
          content="AgentLLM: Autonomous AI in your browser"
        />
        <meta
          property="og:description"
          content="Autonomous AI Agents based on browser-native LLMs"
        />
        <meta property="og:url" content="https://agentllm.vercel.app/" />
        <meta
          property="og:image"
          content="https://user-images.githubusercontent.com/18148989/234704508-56e08243-256e-4d57-b8ef-338783854ee8.png"
        />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="640" />
        <meta property="og:type" content="website" />
        <meta
          name="google-site-verification"
          content="sG4QDkC8g2oxKSopgJdIe2hQ_SaJDaEaBjwCXZNkNWA"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DottedGridBackground
        className={clsx("min-w-screen min-h-screen", props.className)}
      >
        {props.children}
      </DottedGridBackground>
    </div>
  );
};

export default DefaultLayout;
