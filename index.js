const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, WebhookClient, Message, version: discordJsVersion, Status, Embed } = require('discord.js');
const { request, RetryHandler, errors } = require('undici');
const  Discord = require("discord.js")
const clc = require("cli-color")
const axios = require("axios")
const BanJsonFilePath = "./database/bannedusers.json";
const User = require("./schemas/User");
const Blacklists = require("./schemas/blacklists")
const GuildConfig = require("./schemas/GuildConfig")
const ModerationModel = require("./schemas/moderation")
const RobloxUserModel = require("./schemas/Roblox")
const mongoose = require("mongoose")
const config = require('./config.json')
require('console-emojis');
const { AutoPoster } = require('topgg-autoposter')
const { version: nodeJsVersion } = require("process")
const Topgg = require("@top-gg/sdk")
require("./website/api/api_index")
const fetch = require("fetch")
const randomCode = require("random-code.js");



config.MongoDBConnected = false
fs.writeFileSync ('./config.json', JSON.stringify(config, null, 2));


const BotStatusOnlineEmbed = new EmbedBuilder()
.setTitle("<a:6209loadingonlinecircle:1207701894705979433> RoSearcher is Online")
.setColor("Green")

const BotStatusUnderWorkEmbed = new EmbedBuilder()
.setColor("Yellow")
.setTitle("<a:5052aidle:1207701891882942485> RoSearcher is Under Maintenance.")

const BotStatusHavingIssuesEmbed = new EmbedBuilder()
.setTitle("<a:3915donotdisturb:1207760855546986536> RoSearcher is Currently Experiencing Issues")
.setColor("Red")

const APIStatusURL = "http://localhost:8000/api"


const TOPGGAPI = new Topgg.Api(config.TopggToken)

TOPGGAPI.on('vote', (voter) => {
  const VoteChannel = client.channels.cache.get("1207774395268079657")

  if (VoteChannel) {
    try {
      const embed = new EmbedBuilder()
      .setTitle("New Vote")
      .setDescription(`Thank you, ${voter.username}, for voting! 🎉`)
      .setColor("Green")
      

      VoteChannel.send({ embeds: [embed]})
    } catch (error) {
      console.log(`Top.gg Vote Error: ${error}`)
    }
  }
})


let StatusOverride = false
let StatusOverrideMessage = ""
let StatusOverrideType = ""

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent,
] });


const AP = AutoPoster(config.TopggToken, client)

const { Webhook } = require('discord-webhook-node');
const { exec } = require('node:child_process');
const blacklists = require('./schemas/blacklists');
const { it } = require('node:console');

const hook = new Webhook("https://discord.com/api/webhooks/1184513322163384320/smzI6Ri-4RMu5Vrq7IRLP5G0-dBMwQPZdunYZCJcQqbH4y6SpRHZvv-JGmc7Dq9Pcp9s");

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const OnlineEmbed = new EmbedBuilder()
.setTitle("Bot has been started")
.setColor("Green")
.setDescription(`<t:${Math.round(Date.now() / 1000)}> (<t:${Math.round(Date.now() / 1000)}:R>)`)
.addFields(
  { name: "Database Status", value: `${config.MongoDBConnected}`}
)

const ConnectedToMongoEmbed = new EmbedBuilder()
.setTitle("Connected to MongoDB Connection")
.setColor("Green")

const FailedConnectedToMongoEmbed = new EmbedBuilder()
.setTitle("Failed to connect to MongoDB Connection")
.setColor("Red")

const BotShuttingDown = new EmbedBuilder()
.setTitle("Bot Shutdown")

function LogServerSuccess(msg) {
  console.log(clc.bgBlueBright("[SERVER]"), clc.whiteBright(msg))
}


async function searchUsersByKeyword(keyword, limit) {
  const apiUrl = `https://users.roblox.com/v1/users/search?keyword=${keyword}&limit=${limit}`;

  try {
      const response = await axios.get(apiUrl);

      if (response.status === 429) {
          interaction.reply({ embeds: [RateEmbed] });
          return; 
      }

      return response.data.data;
  } catch (error) {
      console.log(`API Error: ${error}`)

  }
}

async function getUserInfo(userId) {
  const apiUrl = `https://users.roblox.com/v1/users/${userId}`;

  try {
      const response = await axios.get(apiUrl);
      console.log(`User Search Pull Request Data Incoming`)
      return response.data;
     
  } catch (error) {
    console.log(`API Error: ${error}`)
  }
}

async function getUserHeadshot(userId) {
  const apiUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?size=420x420&format=png&userIds=${userId}`;

  try {
      const response = await axios.get(apiUrl);
      return response.data?.data[0].imageUrl;
  } catch (error) {
      console.log(`API Error: ${error}`)
  }
}

async function CheckRobloxAPI() {
  const URL = "https://roblox.com"

  const response = await axios.get(URL)

  if (response.status === 200) {
    console.log(clc.bgGreenBright("[API]"), clc.greenBright("Roblox API Connected"))
    console.log(clc.bgGreenBright("[ROBLOX]"), clc.greenBright("Roblox Returned 200."))
  } else {
    console.log(clc.bgRedBright("[API]"), clc.redBright("API Failed To Connect."))
  }
}

async function CheckAPI() {
  const response = await axios.get(APIStatusURL)

  if (response.status === 200) {
    console.log(clc.bgGreenBright("[WEB API]"), clc.greenBright("API Connected"))
    config.APIStatus = "Connected"
    fs.writeFileSync('./config.json', JSON.stringify(config, null,2 ))
  } else {
    console.log(clc.bgRedBright("[WEB API]"), clc.redBright("API Failed To Connect."))
    config.APIStatus = "Offline"
    fs.writeFileSync('./config.json', JSON.stringify(config, null,2 ))
  }
}

async function checkPayPalConnection(clientId, clientSecret) {
  const tokenUrl = "https://api.paypal.com/v1/oauth2/token"
  try {
    const tokenResponse = await axios.post(tokenUrl, 
        new URLSearchParams({
            'grant_type': 'client_credentials'
        }), 
        {
            auth: {
                username: clientId,
                password: clientSecret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    if (tokenResponse.status === 200) {
        const accessToken = tokenResponse.data.access_token;
        console.log(`Successfully connected to PayPal API. Access Token: ${accessToken}`);
        return true;
    } else {
        console.error(`Failed to connect to PayPal API. Status Code: ${tokenResponse.status}`);
        return false;
    }

} catch (error) {
    console.error(clc.bgRedBright("[PAYPAL ERROR]"),clc.redBright(`Exception while connecting to PayPal API: ${error.message}`));
    return false;
}
}

client.rest.on("rateLimited", () => {
  console.log(clc.bgRedBright("[DISCORD.JS]"), clc.redBright("Bot has been ratelimited."))
})

client.on('ready', () => {
  const activities = [
    { name: `${client.guilds.cache.size} Servers | ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString()} Users`, type: 'Watching' },
    { name: 'RoSearcher', type: 'Listening' },
    { name: 'Im bored', type: 'Playing' },
    { name: `Discord.js ${discordJsVersion}`, type: 'Watching'},
    { name: `Shoutout to Team Dave 3683!`, type: 'Playing' },
    { name: `API Status: ${config.APIStatus}`, type: "Playing" }


  ];

  let currentActivityIndex = 0;

  console.log(clc.cyanBright("-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------"));

  mongoose
    .connect(config.MongoDBURI, {
      dbName: `prod`,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(clc.bgGreenBright("[MongoDB]"),clc.greenBright(" Connected to Database."));
      config.MongoDBConnected = true;
      fs.writeFileSync ('./config.json', JSON.stringify(config, null, 2));

      const db_logchannel = client.channels.cache.get("1209512235890901002")

      if (db_logchannel) {
          try {
            const ConnectedEmbed = new EmbedBuilder()
            .setTitle("MongDB Connected")
            .setColor("Green")
            db_logchannel.send({ embeds: [ConnectedEmbed] })
            console.log("DB_Logs sent")

          } catch (msgerror) {
            console.log(msgerror)

            const ErrorEmbed = new EmbedBuilder()
            .setTitle("MongoDB Connection Error")
            .setColor("Red")
            .setDescription(`${msgerror}`)

            if (db_logchannel) {
              db_logchannel.send({ embeds: [ErrorEmbed] })
            }
          }
      } else {
        console.log("Channel Not Found for: DB logs")
      }
      
    })
    .catch((e) => {
      console.error(e)
      console.x(clc.redBright(" Failed Database Connection"));
    });

    CheckRobloxAPI()
    CheckAPI()

    // const botInfoEndpoint = 'http://localhost:8000/botinfopost';

    // axios.post(botInfoEndpoint, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // })
    // .then(response => response.json())
    // .then(data => {
    //   console.log('Bot information:', data);
    // })
    // .catch(error => {
    //   console.error('Error fetching bot information:', error);
    // });

   
  
  
    

  clc.bgGreenBright("[Bot]"), console.log(clc.greenBright(`Ready! Logged in as`), clc.whiteBright(`${client.user.tag}`));
  console.log(clc.bgGreenBright("[Server]"),clc.greenBright("Sup, I'm online"));
  console.log(clc.bgGreenBright("[Status Override] "),clc.greenBright("Status:"), clc.whiteBright(StatusOverride))
  checkPayPalConnection(config.PayPalID, config.PayPalAPISecretKey)
  LogServerSuccess("Bot has been fully Started and running!")
  LogServerSuccess(`Bot Data: ${client.guilds.cache.size} Guilds | ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString()} Users`)
  LogServerSuccess(`Server Data: Node Version: ${nodeJsVersion}, Discord.js Version: ${discordJsVersion}`)
  setInterval(() => {
  AP.on('posted', () => {
    console.log(clc.bgGreenBright("[Top.gg]"),clc.greenBright(" Posted stats to Top.gg"))
  })
}, 3600000);
  console.log(clc.cyan("-----------------------------------------------------------------------------------------------------"))

  
  console.log(clc.cyanBright("| Guild Name                 | Member Count |"));
 
  let maxGuildNameLength = 0;
  let maxMemberCountLength = 0;

  client.guilds.cache.forEach((guild) => {
    const guildNameLength = guild.name.length;
    const memberCountLength = guild.memberCount.toLocaleString().length;

    if (guildNameLength > maxGuildNameLength) {
      maxGuildNameLength = guildNameLength;
    }

    if (memberCountLength > maxMemberCountLength) {
      maxMemberCountLength = memberCountLength;
    }
  });

  client.guilds.cache.forEach((guild) => {
    const guildName = guild.name.padEnd(maxGuildNameLength + 3);
    const memberCount = guild.memberCount.toLocaleString().padStart(maxMemberCountLength);
    console.log(clc.cyanBright(`| ${guildName} | ${memberCount} |`));
  });

  if (config.HavingIssue === true) {
    const StatusChannel = client.channels.cache.get('1204511142412558346');

    if (StatusChannel) {
        StatusChannel.messages.fetch({ limit: 10 })
            .then(messages => {
                StatusChannel.bulkDelete(messages)
                    .then(() => {
                        StatusChannel.send({ embeds: [BotStatusHavingIssuesEmbed] });
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    }
} else if (config.Underwork === true) {
    const StatusChannel = client.channels.cache.get('1204511142412558346');

    if (StatusChannel) {
        StatusChannel.messages.fetch({ limit: 10 })
            .then(messages => {
                StatusChannel.bulkDelete(messages)
                    .then(() => {
                        StatusChannel.send({ embeds: [BotStatusUnderWorkEmbed] });
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    }
} else {
    const StatusChannel = client.channels.cache.get('1204511142412558346');

    if (StatusChannel) {
        StatusChannel.messages.fetch({ limit: 10 })
            .then(messages => {
                StatusChannel.bulkDelete(messages)
                    .then(() => {
                        StatusChannel.send({ embeds: [BotStatusOnlineEmbed] });
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    }
}


  const LogChannel = client.channels.cache.get('1185239390742655006');
  LogChannel.send({ embeds: [OnlineEmbed] });



 
    updatePresence();
    setInterval(updatePresence, 60000);

    function updatePresence() {
      const activity = activities[currentActivityIndex];

      client.user.setPresence({
        activities: [{ name: activity.name, type: ActivityType.Watching }],
        status: 'dnd',
        
      });

      currentActivityIndex = (currentActivityIndex + 1) % activities.length;
    }
    function UpdateStats() {
      const SC = client.channels.cache.get("1209521156827127808");
    
      if (SC) {
        try {
          const UserCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString();
          const GuildCount = client.guilds.cache.size;
    
          if (UserCount && GuildCount) {
            const StatsEmbed = new EmbedBuilder()
              .setTitle("RoSearcher Live Stats")
              .addFields(
                { name: "User Count", value: `${UserCount}` },
                { name: "Guild Count", value: `${GuildCount}` }
              )
              .setFooter(
                { text: "Updates Every Minute"}
              );
            SC.messages.fetch({ limit: 1 }).then((messages) => {
              const existingMessage = messages.first();
              if (existingMessage) {
                existingMessage.edit({ embeds: [StatsEmbed], content: `Last Updated: <t:${Math.round(Date.now() / 1000)}:R>` });
              } else {
                SC.send({ embeds: [StatsEmbed], content: `Last Updated: <t:${Math.round(Date.now() / 1000)}:R>` });
              }
            }).catch(console.error);
          } else {
            console.error("Invalid user count or guild count");
          }
        } catch (error) {
          console.error("Error updating stats:", error);
        }
      }
    }
    

    setInterval(() => {
      UpdateStats()
    }, 60000);

    UpdateStats()

});




  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = interaction.commandName;

    if (command === 'status') {
        const message = interaction.options.getString('message');
        const type = interaction.options.getString('type');

        StatusOverride = true;
        StatusOverrideMessage = message;
        StatusOverrideType = type;

        client.user.setPresence({
            activities: [{
                name: message,
                type: type,
            }],
            status: 'idle',
        });

        await interaction.reply(`Status set to: ${type} ${message}`);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.user.id !== "919674489581731842") return;

  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'EmbedBuilderModal') {
 

    const Title = interaction.fields.getTextInputValue('EmbedBuilderTitle');
    const Desc = interaction.fields.getTextInputValue('EmbedBuilderDesc');

    const BuiltEmbed = new EmbedBuilder()
      .setTitle(Title)
      .setDescription(Desc)
      .setColor("White")
      .setFooter({ text: 'Official RoSearcher Message' });

    try {
      const channel = interaction.channel;

      await channel.send({ embeds: [BuiltEmbed] });
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
});




client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

 

  if (interaction.commandName === 'listguilds') {
    if (interaction.user.id !== '919674489581731842') {
      return interaction.reply('You do not have permission to use this command.');
    }



    const guildsInfo = client.guilds.cache.map((guild) => {
      const invite = guild.channels.cache
        .filter((channel) => channel.type === 'GUILD_TEXT')
        .first();

      return `${guild.name} (Members: ${guild.memberCount}): [Invite](${invite ? `https://discord.gg/${invite.code}` : 'No invite available'})`;
    });

    const Guildsembed = new EmbedBuilder()
    .setTitle("Guilds")
    .setColor("Green")
    .setDescription(guildsInfo.join('\n'))

    const GuildCountEmbed = new EmbedBuilder()
    .setTitle(`${client.guilds.cache.size} Guilds`)

    interaction.reply({content: `Guilds:\n${guildsInfo.join('\n')}`, embeds: [GuildCountEmbed], ephemeral: true});

  }
});

client.on('messageCreate', 
/**
 * @param {Message} message
 */
async (message) => {
	User.findOne({ UserID: message.author.id, }).then((data) => {
		if (!data) return;
		if (data.afk.isAfk === true) {
      User.findOneAndDelete({ UserID: message.author.id }).then(() => {
				message.reply({ content: `Welcome back <@${message.author.id}> you were Afk for: ${data.afk.reason}`})
        console.heavy_check_mark(clc.greenBright(` Deleted AFK Data for: ${message.author.id}`))
			}); 
		} else if (User.deleteOne({ UserID: message.author.id })) {
			return;
		}
	})

	  // tag
	  const tagMember = await message.mentions.users.map((msg) => msg.id);
	  if (tagMember.length > 0) {
		tagMember.forEach((m) => {
		  User.findOne({ UserID: m }).then((data) => {
			if (!data) return;
  
			if (data.afk.isAfk === true) {
				message.reply({
				content: `The user is currently AFK for reasoning of ${data.afk.reason}`,
			  });
			}
		  });
		});
	  }
})

client.on(Events.GuildMemberUpdate, (OM, NM) => {
  const OBS = OM.premiumSince !== null
  const NBS = NM.premiumSince !== null

  if (OBS !== NBS) {
    if (NBS && NM.guild.id === config.StaffGuildID) {
      const Channel = client.channels.cache.get("1202078134539649075")

      if (Channel) {
        try {
          console.log("Boost Event Ran")

          const NewBoostEmbed = new EmbedBuilder()
          .setTitle("🎉 New Boost! 🎉")
          .setDescription(`Thank you ${NM.user.username} for Boosting RoSearcher Support!`)
          .setColor("LuminousVividPink")

          Channel.send({ embeds: [NewBoostEmbed] })

        } catch (e) {
          console.log(`Boost Event Error: ${e}`)
        }
      } else {
        console.log("Boost Channel does not exist")
      }
    }
  }
})


function isUserInJsonFile(userId, filePath) {
	try {
	  
	  const jsonData = fs.readFileSync(filePath, 'utf-8');
	  
	
	  const data = JSON.parse(jsonData);
	  
	  return data.users && data.users.includes(userId);
	} catch (error) {
	  console.error('Error reading or parsing the JSON file:', error);
	  return false;
	} 
  }

client.commands = new Collection();
client.cooldowns = new Collection();

client.on('unhandledRejection', async (error) => {
  console.error('Discord.js error:', error);

  const userId = "919674489581731842";
  const user = await client.users.fetch(userId);
  console.log('User ID:', userId);

  if (user) {
    user.send(`An error occurred:\n\`\`\`${error.message}\`\`\``)
      .then(() => console.log('Error message sent successfully.'))
      .catch((sendError) => console.error('Error sending message:', sendError));
  } else {
    console.error(`User with ID ${userId} not found.`);
  }
});


client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'appelModal') {
      
      const appealreason = interaction.fields.getTextInputValue('appealModalReasoninput');

      const UserCheckBeforeSendEmbed = new EmbedBuilder()
      .setTitle("Appeal Preview")
      .setColor("Yellow")
  
      await interaction.reply({ content: 'Your appeal was received successfully!', ephemeral: false });

      const channel = client.channels.cache.get("1207703770008522822");

      const AppealEmbed = new EmbedBuilder()
          .setTitle("Pending Appeal Request")
          .setColor("Yellow")
          .addFields(
              { name: "Reason", value: `\`${appealreason}\`` },
              { name: "Username", value: `${interaction.user.username}` },
              { name: "ID", value: `${interaction.user.id}` }
          );

      const AppealDeniedEmbed = new EmbedBuilder()
          .setTitle("Your appeal has been Denied")
          .setColor("Red");   

      const accept = new ButtonBuilder()
          .setCustomId("AppealAccept")
          .setLabel("Remove Blacklist")
          .setStyle(ButtonStyle.Success);

      const deny = new ButtonBuilder()
          .setCustomId("AppealDeny")
          .setLabel("Deny Blacklist")
          .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder()
          .addComponents(accept, deny);

      const response = await channel.send({ embeds: [AppealEmbed], components: [row] });

      const collectorFilter = m => m.customId === "AppealAccept" || m.customId === "AppealDeny";
      const collector = response.createMessageComponentCollector({ filter: collectorFilter, time: 60000 }); // Set your desired time

      collector.on('collect', async m => {
          if (m.user.id !== '919674489581731842') {
            const noUseEmbed = new EmbedBuilder()
            .setTitle("You are not authorized to use these buttons.")
            .setColor("Red")


              await m.reply({ content: 'You are not authorized to use these buttons.', ephemeral: true });
              return;
          }

          if (m.customId === "AppealAccept") {
              await handleAppealAcceptance(interaction.user, appealreason, m);
          } else if (m.customId === 'AppealDeny') {
              await handleAppealDenial(interaction.user, AppealDeniedEmbed, m);
          }
          collector.stop();
      });

      collector.on('end', collected => {
          if (collected.size === 0) {
        

              interaction.followUp({ content: 'Confirmation not received, cancelling', ephemeral: false });
          }
      });
  }
});

async function handleAppealAcceptance(user, appealreason, interaction) {
  await blacklists.deleteOne({ UserID: user.id });
  await interaction.update({ content: `Appeal Accepted and Removed from MongoDB Collection`, components: [], embeds: [] });
  const AppealAccepted = new EmbedBuilder()
      .setTitle("Your appeal has been Accepted")
      .setDescription(`${interaction.user.username} has Accepted your Appeal`)
      .addFields(
          { name: `Appealed Reason`, value: appealreason }
      )
      .setColor("Green")
  user.send({ embeds: [AppealAccepted] });
}


async function handleAppealDenial(user, AppealDeniedEmbed, interaction) {
    await interaction.update({ content: 'Appeal Denied', components: [], embeds: [] });
    user.send({ embeds: [AppealDeniedEmbed] });
}




const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}



const webhook = new WebhookClient({ url: `https://discord.com/api/webhooks/1192035421690019960/v0QurSx25tq5S9YXmmbAVZjjkbdW_5V_yFz-2lIpdHPrDAEixhFGD-doWPcECVyMoKVq` });
const ErrorUser = client.users.cache.get(config.DevID)

async function logError(error, stack) {
  const formatedStack =
    stack.length > 2048 ? stack.slice(0, 2045) + "..." : stack;

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle(`${error}`)
    .setDescription(`\`\`\`diff\n- ${formatedStack}\n\`\`\``);

  await ErrorUser.send({ embeds: [embed] });
}

module.exports = {
  errorHandler: async (client) => {
    process.on("unhandledRejection", async (reason) => {
      await logError("UnhandledRejection", reason);
    });
    process.on("uncaughtException", async (error) => {
      if (error.message.includes("Cannot find module")) {
        const errorMessage = error.message.split("Require")[0].trim();
        const stack = error.stack.split(">")[1].split("\n")[0].trim();
        await logError(
          "UncaughtException",
          errorMessage + ` in a file ${stack}`
        );
      } else {
        await logError("UncaughtException", error);
      }
    });
    client.on("error", async (error) => {
      if (error.message.includes("Cannot find module")) {
        const errorMessage = error.message.split("Require")[0].trim();
        const reqStack = error.message.split("Require stack:")[1].trim();
        const stack = reqStack
          .split("\n")[0]
          .trim()
          .replace(/^[-\s]{2}/, "");
        await logError(
          "Discord.js Error",
          errorMessage + ` in a file (${stack})`
        );
      } else {
        await logError("Discord.js Error", error);
      }
    });
  },
};



client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
  
    if (!command) {
        interaction.reply(`No command Matching </${interaction.commandName}:${interaction.commandId}> was found.`)
        console.error(`No command matching </${interaction.commandName} was found.`);
        return;
    }

    
    if (interaction.commandName === 'appeal') {
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error('Error executing command:', error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
        return;
    }
 

    const userIdToCheck = interaction.user.id;
    const isUserBlacklisted = await blacklists.findOne({ UserID: userIdToCheck });
  
    if (isUserBlacklisted) {
        const blacklistEmbed = new EmbedBuilder()
            .setTitle("You have been Blacklisted from RoSearcher")
            .setColor("Red")
            .setFooter(
              { text: 'Offical RoSearcher Blacklist'}
            )
  
        interaction.reply({ embeds: [blacklistEmbed] });
        return;
    }
  
    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error('Error executing command:', error);

        const userId = "919674489581731842";
        const user = await client.users.fetch(userId);

        if (user) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('An Error has Occurred')
                .setColor("Red")
                .setDescription(`Discord.js Error: ${error}`);

            user.send({ embeds: [errorEmbed] })
                .then(() => console.log('Error message sent successfully.'))
                .catch((e) => console.error('Error sending message:', e));
        }

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `There was an error while executing this command!, Error: ${e}`, ephemeral: true });
        } else {
            await interaction.reply({ content: `There was an error while executing this command!, Error: ${e}`, ephemeral: true });
        }
    }
});


// ---------------------------------
// CheckIfGuildConfig_guildMemberAdd

client.on(Events.GuildMemberAdd, async member => {

  let VerifyGuildID = ""

  const GuildConfigData = await GuildConfig.findOne({ GuildID: member.guild.id })

  VerifyGuildID = member.guild.id


  if (GuildConfigData) {
    const IsVerifyRequired = GuildConfigData.Config.VerifyRequired

    if ( IsVerifyRequired === true ) {
      const VerifyChannel = client.channels.cache.get(`${GuildConfigData.Config.VerifyChannelID}`)

      if (VerifyChannel) {
        try {

          const UserData = await RobloxUserModel.findOne({ UserID: member.user.id })

          if (UserData) {

            const ServerSettingsRequireToSetNickToRoblox = GuildConfigData.Config.SetNickToRobloxUser

            if (ServerSettingsRequireToSetNickToRoblox === true) {
              member.setNickname(UserData.Roblox.username)
            }
            

          } else {
            const LinkAccountNoticeEmbed = new EmbedBuilder()
            .setTitle("Verification Notice")
            .setDescription(`${member.guild.name} requires you to link your Roblox Account to RoSearcher to Verify your account.`)
            .setColor("Red")

            const generatedCode = randomCode.generateOne({
              length: 5,
              prefix: "Verify-",
              postfix: "-RoSearcher"
          });


            const LinkAccEmbedWithButtons = new EmbedBuilder()
            .setTitle("Please Read")
            .setColor("Yellow")
            .setDescription(`Press "Link Account" to Continue.`)

            const SearchAccountLink = new ButtonBuilder()
            .setCustomId("AccountVerifyLinkSearchButton")
            .setLabel("Link Account")
            .setStyle(ButtonStyle.Success)

            const PlacedAdDisabledButton = new ButtonBuilder()
            .setLabel("Shoutout to Team Dave 3683")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary)

            const ButtonRow = new ActionRowBuilder()
            .addComponents(SearchAccountLink, PlacedAdDisabledButton)
          

            member.send({ embeds: [LinkAccountNoticeEmbed] })
            member.send({ embeds: [LinkAccEmbedWithButtons], components: [ButtonRow] })





          const limit = 10;

          const searchResults = await searchUsersByKeyword(searchTerm, limit)

        
          if (!searchResults || searchResults.length === 0) {
            return interaction.reply('No results found. Please try a different username.');
          }

        const userChoices = searchResults.map((user, index) => ({
          label: user.displayName,
          value: String(index),
          description: `UserID: ${user.id}`,
           }));

      
          const Linkcomponents = [
            {
                type: 1,
                components: [
                    {
                        type: 3,
                        customId: 'selectVerifyLinkUser',
                        options: userChoices,
                        placeholder: 'Select a user',
                    },
                ],
            },
        ];

        const Linkfilter = (interaction) => interaction.customId === 'AccountVerifyLinkSearchButton' && interaction.user.id === interaction.user.id && !interaction.deferred;
        const Linkcollector = interaction.channel.createMessageComponentCollector({ Linkfilter, time: 60000 });

        Linkcollector.on('collect', async (interaction) => {
          interaction.followUp({
            content: 'Please Choose a user',
            components: Linkcomponents,
          }).then(() => {

          })
        })



          }


        } catch (e) {
          console.log(e)
        }
      }
    }
  } else {
    return console.log(`Ignoring | No Config Data found for: ${member.guild.name} `)
  }
})

// -------------------------------------------------------------------------
// guildMemberAdd below this is for RoSearcher Support Roleing and Welcoming

client.on('guildMemberAdd', member => {
  if (member.guild.id === "1185235395970088970") {
    member.roles.add(member.guild.roles.cache.get("1185237211705253899"));
    
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle("Welcome to the RoSearcher Support Server")
      .setDescription(`Welcome ${member.user.username} to our server! Enjoy your stay.`)
      .addFields(
        { name: "Support Channels", value: 'Quick help: <#1185280419302740040>, Tickets: <#1185280451984756736>' },
        { name: 'Must do', value: "Please Read the Rules: <#1185281570127483002>" }
      );

    const channel = member.guild.channels.cache.find(channel => channel.name === 'new-members');
    if (channel) {
      channel.send({ embeds: [embed] });
    }
  } else {
    console.log(clc.redBright("Wrong Guild Ignoring guildMemberAdd"));
  }
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'acknowledgeButton') {
    await interaction.update({ content: 'Acknowledged!', components: [] });
  }
});



client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "configure") {
    const Embed = new EmbedBuilder()
    .setTitle("Developer Notice")
    .setDescription("This Command is currently under development and can only be ran by the Devs.")

    interaction.reply({ embeds: [Embed], ephemeral: true })
  }
})






client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.id !== config.DevID) return;

  if (interaction.commandName === "eval") {
    const code = interaction.options.getString("code");

    try {
      const result = eval(code);
            const embed = new EmbedBuilder()
                .setTitle("Eval Result")
                .setColor("Green") 
                .addFields(
                    { name: "Input", value: `\`\`\`js\n${code}\n\`\`\`` },
                    { name: "Output", value:  `\`\`\`js\n${result}\n\`\`\`` }
                )
               

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .addFields(
                    { name: "Error", value:  `\`\`\`js\n${error.message}\n\`\`\`` }
                )

           
            await interaction.reply({ embeds: [errorEmbed] });
        }
    }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === "BanModal") {
    const Member = interaction.options.getUser("user")
    const Reason = interaction.fields.getTextInputValue("BanReason")

    if (Member && interaction.user.id === config.DevID) {
      if (Reason) {
        try {
            const MessageToUser = new EmbedBuilder()
            .setTitle("You have been banned")
            .setDescription(`Reason: ${Reason}`)

            Member.send({ embeds: [MessageToUser] })
            setTimeout(() =>
              Member.ban(Reason), 6000
            )
        } catch (error) {
          console.log(`Ban Error: ${error}`)
        }
      } else if (Reason === "") {
        interaction.reply("Invaild Reason | A Reason is needed")
      }
    }
  }
})


client.login(config.MainToken);
