import ora from "ora";

type Fetch = typeof fetch;

const originalFetch: Fetch = fetch.bind(globalThis);

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const customFetch: Fetch = async (input, init): Promise<Response> => {
  const response = await originalFetch(input, init);

  if (response.status === 429) {
    // Wait for one minute before retrying
    ora().warn("429 - waiting 1 minute before retrying request");
    await wait(60 * 1000);
    return originalFetch(input, init);
  }

  return response;
};

globalThis.fetch = customFetch;
