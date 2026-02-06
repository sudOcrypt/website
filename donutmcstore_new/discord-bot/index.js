import { Client, GatewayIntentBits, ActivityType } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  
  client.user.setPresence({
    activities: [{
      name: 'donutmc.store 🍩',
      type: ActivityType.Watching,
    }],
    status: 'online',
  });
  
  console.log('✨ Status set: Watching donutmc.store 🍩');
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

client.login(BOT_TOKEN);
