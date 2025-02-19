#!/usr/bin/env node
const yargs = require("yargs");
const { log } = require("./utils");

// Immediately load .env.{--env} and .env files.
// This way we ensure all of the environment variables are not loaded too late.
const paths = yargs.argv.env ? [".env", `.env.${yargs.argv.env}`] : [".env"];
for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const { error } = require("dotenv").config({ path });
    if (yargs.argv.debug) {
        if (error) {
            log.info(`Could not load environment variables from ${log.info.hl(path)}.`);
        } else {
            log.success(`Successfully loaded environment variables from ${log.success.hl(path)}.`);
        }
    }
}

const { blue, red } = require("chalk");
const context = require("./context");
const { createCommands } = require("./commands");

yargs
    .usage("Usage: $0 <command> [options]")
    .demandCommand(1)
    .recommendCommands()
    .scriptName("webiny")
    .epilogue(
        `To find more information, docs and tutorials, see ${blue("https://docs.webiny.com")}.`
    )
    .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`)
    .fail(function (msg, error, yargs) {
        if (msg) {
            if (msg.includes("Not enough non-option arguments")) {
                console.log();
                context.error(red("Command was not invoked as expected!"));
                context.info(
                    `Some non-optional arguments are missing. See the usage examples printed below.`
                );
                console.log();
                yargs.showHelp();
                return;
            }

            if (msg.includes("Missing required argument")) {
                const args = msg
                    .split(":")[1]
                    .split(",")
                    .map(v => v.trim());

                console.log();
                context.error(red("Command was not invoked as expected!"));
                context.info(
                    `Missing required argument(s): ${args
                        .map(arg => red(arg))
                        .join(", ")}. See the usage examples printed below.`
                );
                console.log();
                yargs.showHelp();
                return;
            }
            console.log();
            context.error(red("Command execution was aborted!"));
            context.error(msg);
            console.log();

            process.exit(1);
        }

        if (error) {
            context.error(error.message);
            // Unfortunately, yargs doesn't provide passed args here, so we had to do it via process.argv.
            if (process.argv.includes("--debug")) {
                context.debug(error);
            }

            console.log();
            const plugins = context.plugins.byType("cli-command-error");
            for (let i = 0; i < plugins.length; i++) {
                const plugin = plugins[i];
                plugin.handle({
                    error,
                    context
                });
            }
        }

        process.exit(1);
    });

(async () => {
    await createCommands(yargs, context);
    // Run
    yargs.argv;
})();
