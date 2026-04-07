import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tool, type Plugin } from "@opencode-ai/plugin";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PluginEntry: Plugin = async (input) => {
  const { client } = input;

  return {
    name: "opencode-dynamic-openrouter-model-fetch",
    description: "Fetch and import OpenRouter models with one command",
    tool: {
      "refresh-models": tool({
        description: "Fetch OpenRouter models, write to models.json, and import into opencode.json",
        args: {},
        async execute(args, context) {
          await client.app.log({
            body: {
              service: "refresh-models",
              level: "info",
              message: "Starting model refresh...",
            },
          });

          try {
            const scriptDir = dirname(__filename);
            const scriptPath = join(scriptDir, "scripts", "refresh_models.py");

            // Validate script exists
            const fs = await import("fs/promises");
            try {
              await fs.access(scriptPath);
            } catch (error) {
              await client.app.log({
                body: {
                  service: "refresh-models",
                  level: "error",
                  message: `Script not found: ${scriptPath}`,
                },
              });
              return "❌ Error: refresh_models.py not found. Please reinstall the plugin.";
            }

            await client.app.log({
              body: {
                service: "refresh-models",
                level: "info",
                message: `Running: python ${scriptPath}`,
              },
            });

            const python = spawn("python", [scriptPath], {
              stdio: ["ignore", "pipe", "pipe"],
            });

            let stdout = "";
            let stderr = "";

            python.stdout.on("data", (data: Buffer) => {
              stdout += data.toString();
            });

            python.stderr.on("data", (data: Buffer) => {
              stderr += data.toString();
            });

            const exitCode = await new Promise<number>((resolve) => {
              python.on("close", resolve);
            });

            if (stdout) {
              await client.app.log({
                body: {
                  service: "refresh-models",
                  level: "info",
                  message: stdout,
                },
              });
            }

            if (stderr) {
              await client.app.log({
                body: {
                  service: "refresh-models",
                  level: "warn",
                  message: stderr,
                },
              });
            }

            if (exitCode === 0) {
              await client.app.log({
                body: {
                  service: "refresh-models",
                  level: "info",
                  message: "Model refresh completed successfully!",
                },
              });
              return "✅ Model refresh completed! Models fetched, written to models.json, and imported into opencode.json.";
            } else {
              await client.app.log({
                body: {
                  service: "refresh-models",
                  level: "error",
                  message: `Refresh failed with exit code ${exitCode}`,
                },
              });
              return `❌ Model refresh failed with exit code ${exitCode}`;
            }
          } catch (error: any) {
            await client.app.log({
              body: {
                service: "refresh-models",
                level: "error",
                message: `Error: ${error.message}`,
              },
            });
            return `❌ Error: ${error.message}`;
          }
        },
      }),
    },
  };
};

export default PluginEntry;