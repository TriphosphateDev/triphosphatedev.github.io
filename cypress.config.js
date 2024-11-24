import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbx9P_NPnYmMaOBD6AFbbCDE6H3T4fR43GhbE0gUhlsTyemjqX-ku62o8VzOVepeDjnE7Q/exec',
      PROXYCHECK_API_KEY: 'a32394-618019-a48t0t-7z9799',
      PROXYCHECK_PUBLIC_KEY: 'public-k82938-647649-684944',
      PROXYCHECK_API_ENDPOINT: 'https://proxycheck.io/v2'
    }
  },
}) 