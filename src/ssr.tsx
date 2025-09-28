import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://8590b18690b75bb72a2dc7a1ea9bf38b@o4508854376333312.ingest.us.sentry.io/4510097318871040",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});