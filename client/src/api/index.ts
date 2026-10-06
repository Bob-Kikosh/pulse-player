import { createHttpApi } from "./httpApi";
import { createLocalApi } from "./localApi";
import type { Api } from "./types";

// With VITE_API_URL set, the app uses the real server. Without it (the static
// demo on GitHub Pages) everything runs in the browser.
const baseUrl = import.meta.env.VITE_API_URL as string | undefined;

export const api: Api = baseUrl ? createHttpApi(baseUrl) : createLocalApi();

export { ApiError } from "./types";
