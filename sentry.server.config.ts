import * as Sentry from "@sentry/nuxt";
 
Sentry.init({
  dsn: "https://07d2c48c139129790ea2298b28fac018@o178577.ingest.us.sentry.io/4510093814530048",
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
