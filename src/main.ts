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
    description: "Dynamic OpenRouter model fetch and import plugin",
    tool: {
      "fetch-models": tool({
        description: "Fetch OpenRouter models from API and write to models.json",
        args: {},
        async execute(args, context) {
          await client.app.log({
            body: {
              service: "fetch-models",
              level: "info",
              message: "Starting model fetch...",
            },
          });

          try {
            const scriptDir = dirname(__filename);
            const scriptPath = join(scriptDir, "scripts", "fetch_models.py");

            // Validate script exists
            const fs = await import("fs/promises");
            try {
              await fs.access(scriptPath);
            } catch (error) {
              await client.app.log({
                body: {
                  service: "fetch-models",
                  level: "error",
                  message: `Fetch script not found: ${scriptPath}`,
                },
              });
              return "❌ Error: fetch_models.py not found. Please reinstall the plugin.";
            }

            await client.app.log({
              body: {
                service: "fetch-models",
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
                  service: "fetch-models",
                  level: "info",
                  message: stdout,
                },
              });
            }

            if (stderr) {
              await client.app.log({
                body: {
                  service: "fetch-models",
                  level: "warn",
                  message: stderr,
                },
              });
            }

            if (exitCode === 0) {
              await client.app.log({
                body: {
                  service: "fetch-models",
                  level: "info",
                  message: "Model fetch completed successfully!",
                },
              });
              return "✅ Model fetch completed! Use /import-models to load into opencode.json.";
            } else {
              await client.app.log({
                body: {
                  service: "fetch-models",
                  level: "error",
                  message: `Fetch failed with exit code ${exitCode}`,
                },
              });
              return `❌ Model fetch failed with exit code ${exitCode}`;
            }
          } catch (error: any) {
            await client.app.log({
              body: {
                service: "fetch-models",
                level: "error",
                message: `Error: ${error.message}`,
              },
            });
            return `❌ Error: ${error.message}`;
          }
        },
      }),

      "import-models": tool({
        description: "Import models from local models.json into opencode.json",
        args: {},
        async execute(args, context) {
          await client.app.log({
            body: {
              service: "import-models",
              level: "info",
              message: "Starting model import...",
            },
          });

          try {
            const scriptDir = dirname(__filename);
            const scriptPath = join(scriptDir, "scripts", "import_models.py");

            // Validate script exists
            const fs = await import("fs/promises");
            try {
              await fs.access(scriptPath);
            } catch (error) {
              await client.app.log({
                body: {
                  service: "import-models",
                  level: "error",
                  message: `Import script not found: ${scriptPath}`,
                },
              });
              return "❌ Error: import_models.py not found. Please reinstall the plugin.";
            }

            await client.app.log({
              body: {
                service: "import-models",
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
                  service: "import-models",
                  level: "info",
                  message: stdout,
                },
              });
            }

            if (stderr) {
              await client.app.log({
                body: {
                  service: "import-models",
                  level: "warn",
                  message: stderr,
                },
              });
            }

            if (exitCode === 0) {
              await client.app.log({
                body: {
                  service: "import-models",
                  level: "info",
                  message: "Model import completed successfully!",
                },
              });
              return "✅ Models imported into opencode.json successfully!";
            } else {
              await client.app.log({
                body: {
                  service: "import-models",
                  level: "error",
                  message: `Import failed with exit code ${exitCode}`,
                },
              });
              return `❌ Model import failed with exit code ${exitCode}`;
            }
          } catch (error: any) {
            await client.app.log({
              body: {
                service: "import-models",
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