import path from "path";

/** Explicit path.join ensures that .env will be detected by pkg @see https://www.npmjs.com/package/pkg#detecting-assets-in-source-code */
const dotenvPath = path.join(__dirname, ".env");
require("dotenv").config({
  path: dotenvPath,
});
