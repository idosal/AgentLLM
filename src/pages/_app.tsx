import { type AppType } from "next/app";

import { api } from "../utils/api";

import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "nextjs-google-analytics";

const MyApp: AppType = ({
  Component,
  pageProps: {  ...pageProps },
}) => {
  return (
    // <SessionProvider session={session}>
    <>
      <Analytics />
      <GoogleAnalytics trackPageViews />
      <Component {...pageProps} />
    </>

    // </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
