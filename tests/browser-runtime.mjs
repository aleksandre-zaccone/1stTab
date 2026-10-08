// Set PLAYWRIGHT_MODULE for an external Playwright install and CHROME_PATH for a browser binary.
export const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
export const browserOptions = {
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
};
