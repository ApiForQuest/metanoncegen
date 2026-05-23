const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Prevent silent crashes
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.once(Events.ClientReady, () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) return;

        console.log("Command used in:", interaction.guildId ? "SERVER" : "DM");

        if (interaction.commandName !== "nonce") return;

        // Prevent double-handling or stale interactions
        if (interaction.replied || interaction.deferred) return;

        // MUST be first async action
        await interaction.deferReply();

        const appId = interaction.options.getString("app_id", true);

        if (!appId) {
            return await interaction.editReply("❌ Missing app_id (command not updated properly)");
        }

        console.log("APP ID:", appId);

        // STEP 1: authenticate application
        const authRes = await axios.post(
            "https://graph.oculus.com/authenticate_application",
            null,
            {
                params: {
                    access_token: process.env.OCULUS_ACCESS_TOKEN,
                    app_id: appId
                },
                timeout: 8000
            }
        );

        const accessToken = authRes.data?.access_token;

        if (!accessToken) {
            return await interaction.editReply("❌ No access_token returned");
        }

        // STEP 2: generate nonce
        const nonceRes = await axios.post(
            "https://graph.oculus.com/v1.20/user_nonce_generate",
            null,
            {
                params: {
                    access_token: accessToken
                },
                timeout: 8000
            }
        );

        return await interaction.editReply(
            "```json\n" +
            JSON.stringify(nonceRes.data, null, 2) +
            "\n```"
        );

    } catch (err) {
        console.error("Interaction Error:", err);

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(
                    "❌ Failed:\n```json\n" +
                    JSON.stringify(err.response?.data || { message: err.message }, null, 2) +
                    "\n```"
                );
            }
        } catch (e) {
            console.error("Failed to send error reply:", e);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
