import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://192.168.18.2:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});