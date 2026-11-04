// Netlify Function that runs the whole Express app.
// Static files in /public are served directly by Netlify's CDN (see netlify.toml).
const serverless = require("serverless-http");
const app = require("../../app");

const handler = serverless(app, {
  basePath: "/.netlify/functions/server",
  binary: ["image/*", "application/octet-stream", "multipart/form-data"],
});

module.exports.handler = async (event, context) => {
  // Keep the MongoDB connection open between invocations.
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};
