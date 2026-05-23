const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
    new SlashCommandBuilder()
        .setName("nonce")
        .setDescription("Fetch nonce from backend")
        .addStringOption(option =>
            option
                .setName("app_id")
                .setDescription("Application ID")
                .setRequired(true)
        )
        .setDMPermission(true)
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("🌍 Deploying GLOBAL slash commands...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("✅ Global commands deployed!");
    } catch (error) {
        console.error(error);
    }
})();
