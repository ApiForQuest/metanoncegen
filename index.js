const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "nonce") return;

    try {
        await interaction.deferReply();

        // GET APP ID FROM SLASH COMMAND
        const appId = interaction.options.getString("app_id", true);

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
            return interaction.editReply("❌ No access_token returned");
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

        // STEP 3: return result
        return interaction.editReply(
            "```json\n" +
            JSON.stringify(nonceRes.data, null, 2) +
            "\n```"
        );

    } catch (err) {
        console.error(err);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(
                "❌ Failed:\n```json\n" +
                JSON.stringify(
                    err.response?.data || { message: err.message },
                    null,
                    2
                ) +
                "\n```"
            );
        } else {
            await interaction.reply("❌ Request failed before processing.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
