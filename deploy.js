const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Webhook } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/1210298922980085811/5ICu6Lr4cdFx0UJXYq_jGWsKaEmvkp4RHfA8DbPrj3LZB_426k9BiRDXsbLKoC7X0VLz");
const config = require("./config.json")

const clientId = "1182682121094049923"

const TestclientID = "1192384642293190656"
const clc = require("cli-color")

const MainToken = "MTE4MjY4MjEyMTA5NDA0OTkyMw.Gvd8Pd.eclXM0hHljBGZvNr1RcWnn4DJLpQUG8ziQS0rM"
const TESTTOKEN = "MTE5MjM4NDY0MjI5MzE5MDY1Ng.GnQwEX.G3smN6kC64wXQDTwWrQB8Fvz2XL4CoKC4XXXtM"


const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(config.MainToken);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

		console.log(clc.green("[DJS SLASH DEPLOY]" ),clc.whiteBright(`Successfully reloaded ${data.length} application`), clc.greenBright`(/)`, clc.whiteBright(`commands.`));
		hook.send("Slash commands reloaded.")
	} catch (error) {
		console.error(clc.redBright("[DJS SLASH DEPLOY ERROR]: "), error);
	}
})();
