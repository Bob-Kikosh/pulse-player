const DEV_SECRET = "pulse-dev-secret";

export const PORT = Number(process.env.PORT) || 8000;

// Origin of the client that is allowed to call the API
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;
export const JWT_LIFETIME = "7d";

if (JWT_SECRET === DEV_SECRET) {
  console.warn("JWT_SECRET is not set: using the development secret. Do not run it like this in production.");
}
