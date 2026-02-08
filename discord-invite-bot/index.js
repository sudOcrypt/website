import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
// Debug: confirm .env is loaded (don't log the actual role ID)
const hasMemberRoleId = !!(process.env.DISCORD_MEMBER_ROLE_ID && process.env.DISCORD_MEMBER_ROLE_ID.trim());
if (!hasMemberRoleId) {
  console.warn('⚠️ DISCORD_MEMBER_ROLE_ID is missing or empty. Check your .env file (not .env.example) in the same folder as index.js.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
const MEMBER_ROLE_ID = process.env.DISCORD_MEMBER_ROLE_ID || null; // Role to give when user joins (optional)
const REWARD_PER_INVITE = parseInt(process.env.REWARD_PER_INVITE) || 250000;
const MINIMUM_INVITES = parseInt(process.env.MINIMUM_INVITES) || 3;
const VALIDATION_HOURS = parseInt(process.env.VALIDATION_HOURS) || 5;

let guildInvites = new Map();

const commands = [
  {
    name: 'invites',
    description: 'Check your invite count',
    options: [
      {
        name: 'user',
        description: 'User to check (admin only)',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'View top inviters',
  },
  {
    name: 'claiminvites',
    description: 'Claim your invite rewards (minimum 3 invites)',
    options: [
      {
        name: 'minecraft_username',
        description: 'Your Minecraft username',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'inviterewards',
    description: 'View invite reward information',
  },
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

async function loadInvites() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const invites = await guild.invites.fetch();
    guildInvites.set(guild.id, new Map(invites.map(invite => [invite.code, invite])));
    console.log(`✅ Loaded ${invites.size} invites`);
  } catch (error) {
    console.error('❌ Error loading invites:', error);
  }
}

async function checkInviteUsed(member) {
  try {
    const guild = member.guild;
    const newInvites = await guild.invites.fetch();
    const oldInvites = guildInvites.get(guild.id);

    const usedInvite = newInvites.find(inv => {
      const oldInv = oldInvites.get(inv.code);
      return oldInv && inv.uses > oldInv.uses;
    });

    guildInvites.set(guild.id, new Map(newInvites.map(invite => [invite.code, invite])));

    if (usedInvite) {
      return {
        code: usedInvite.code,
        inviterId: usedInvite.inviter.id,
        inviterUsername: usedInvite.inviter.username,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error checking invite:', error);
    return null;
  }
}

async function saveInvite(inviteData, member) {
  const { error } = await supabase.from('invites').insert({
    inviter_id: inviteData.inviterId,
    inviter_username: inviteData.inviterUsername,
    invited_id: member.id,
    invited_username: member.user.username,
    invite_code: inviteData.code,
    joined_at: new Date().toISOString(),
  });

  if (error) {
    console.error('❌ Error saving invite:', error);
  } else {
    console.log(`✅ Saved invite: ${inviteData.inviterUsername} invited ${member.user.username}`);
  }
}

async function validateInvites() {
  const validationTime = new Date(Date.now() - VALIDATION_HOURS * 60 * 60 * 1000);

  const { data: pendingInvites, error } = await supabase
    .from('invites')
    .select('*')
    .eq('is_valid', false)
    .eq('left_server', false)
    .lt('joined_at', validationTime.toISOString());

  if (error) {
    console.error('❌ Error fetching pending invites:', error);
    return;
  }

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  for (const invite of pendingInvites) {
    try {
      const member = await guild.members.fetch(invite.invited_id).catch(() => null);
      
      if (member) {
        await supabase
          .from('invites')
          .update({ 
            is_valid: true, 
            valid_at: new Date().toISOString() 
          })
          .eq('id', invite.id);

        console.log(`✅ Validated invite for ${invite.invited_username}`);
      } else {
        await supabase
          .from('invites')
          .update({ 
            left_server: true,
            left_at: new Date().toISOString()
          })
          .eq('id', invite.id);

        console.log(`❌ User ${invite.invited_username} left before validation`);
      }
    } catch (error) {
      console.error(`❌ Error validating invite ${invite.id}:`, error);
    }
  }
}

async function getInviteStats(userId) {
  const { data: validInvites, error: validError } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .eq('is_valid', true)
    .eq('is_claimed', false)
    .eq('left_server', false);

  const { data: pendingInvites, error: pendingError } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .eq('is_valid', false)
    .eq('left_server', false);

  const { data: totalInvites, error: totalError } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .eq('left_server', false);

  return {
    valid: validInvites?.length || 0,
    pending: pendingInvites?.length || 0,
    total: totalInvites?.length || 0,
  };
}

async function notifyMilestone(userId, username, validCount) {
  if (validCount < MINIMUM_INVITES) return;
  if (validCount % MINIMUM_INVITES !== 0) return;

  const channel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
  if (!channel) return;

  const reward = validCount * REWARD_PER_INVITE;
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('🎉 Invite Milestone Reached!')
    .setDescription(`<@${userId}> has reached **${validCount} valid invites**!`)
    .addFields(
      { name: '💰 Pending Reward', value: `${reward.toLocaleString()} coins`, inline: true },
      { name: '📊 Status', value: 'Awaiting Manual Approval', inline: true }
    )
    .setFooter({ text: 'User can claim rewards with /claiminvites' })
    .setTimestamp();

  await channel.send({ 
    content: `<@1468813317777784832>`,
    embeds: [embed] 
  });
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  if (MEMBER_ROLE_ID) {
    console.log(`📌 Role-on-join enabled: will assign role ID ${MEMBER_ROLE_ID}`);
    console.log(`   When someone joins you should see: "👋 guildMemberAdd" then "✅ Assigned role". If not, enable Server Members Intent in Discord Developer Portal → Bot.`);
  } else {
    console.log(`⚠️ DISCORD_MEMBER_ROLE_ID not set - users will NOT get a role on join`);
  }
  await registerCommands();
  await loadInvites();
  
  setInterval(validateInvites, 60 * 1000);
  
  client.user.setActivity('Buy Now: DonutMC.Store 🍩', { type: 3 });
});

client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  console.log(`👋 guildMemberAdd: ${member.user.username} (${member.id})`);

  // Give "member" role on join if configured
  if (MEMBER_ROLE_ID) {
    try {
      await member.roles.add(MEMBER_ROLE_ID);
      console.log(`✅ Assigned role to ${member.user.username} on join`);
    } catch (err) {
      console.error(`❌ Failed to assign role to ${member.user.username}:`, err.code || err.message, err.message);
      if (err.code === 50013) console.error('   → Bot needs "Manage Roles" and its role must be ABOVE the target role in Server Settings → Roles');
    }
  } else {
    console.log(`   (Skipped role: DISCORD_MEMBER_ROLE_ID not set)`);
  }

  const inviteData = await checkInviteUsed(member);
  
  if (inviteData && inviteData.inviterId !== member.id) {
    await saveInvite(inviteData, member);
    
    console.log(`👋 ${member.user.username} joined via ${inviteData.inviterUsername}'s invite`);
  }
});

client.on('guildMemberRemove', async (member) => {
  if (member.user.bot) return;

  await supabase
    .from('invites')
    .update({ 
      left_server: true,
      left_at: new Date().toISOString()
    })
    .eq('invited_id', member.id)
    .eq('left_server', false);

  console.log(`👋 ${member.user.username} left the server`);
});

client.on('inviteCreate', async (invite) => {
  const guild = invite.guild;
  const invites = guildInvites.get(guild.id) || new Map();
  invites.set(invite.code, invite);
  guildInvites.set(guild.id, invites);
});

client.on('inviteDelete', async (invite) => {
  const guild = invite.guild;
  const invites = guildInvites.get(guild.id) || new Map();
  invites.delete(invite.code);
  guildInvites.set(guild.id, invites);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'invites') {
    const targetUser = options.getUser('user') || interaction.user;
    
    if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only admins can check other users\' invites!', ephemeral: true });
    }

    const stats = await getInviteStats(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(0x06B6D4)
      .setTitle(`📊 Invite Stats for ${targetUser.username}`)
      .addFields(
        { name: '✅ Valid Invites', value: `${stats.valid}`, inline: true },
        { name: '⏳ Pending', value: `${stats.pending} (under 5 hours)`, inline: true },
        { name: '📈 Total', value: `${stats.total}`, inline: true },
        { name: '💰 Claimable Reward', value: `${(stats.valid * REWARD_PER_INVITE).toLocaleString()} coins`, inline: false }
      )
      .setFooter({ text: `Minimum ${MINIMUM_INVITES} invites to claim • ${REWARD_PER_INVITE.toLocaleString()} coins per invite` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'leaderboard') {
    const { data: topInviters } = await supabase
      .from('invites')
      .select('inviter_id, inviter_username')
      .eq('is_valid', true)
      .eq('left_server', false);

    const counts = {};
    topInviters?.forEach(inv => {
      counts[inv.inviter_id] = counts[inv.inviter_id] || { username: inv.inviter_username, count: 0 };
      counts[inv.inviter_id].count++;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    const leaderboard = sorted.map(([id, data], index) => 
      `${index + 1}. **${data.username}** - ${data.count} invites (${(data.count * REWARD_PER_INVITE).toLocaleString()} coins)`
    ).join('\n') || 'No invites yet!';

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🏆 Invite Leaderboard')
      .setDescription(leaderboard)
      .setFooter({ text: `${REWARD_PER_INVITE.toLocaleString()} coins per invite • Minimum ${MINIMUM_INVITES} to claim` });

    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'claiminvites') {
    const minecraftUsername = options.getString('minecraft_username');
    const stats = await getInviteStats(interaction.user.id);

    if (stats.valid < MINIMUM_INVITES) {
      return interaction.reply({
        content: `❌ You need at least **${MINIMUM_INVITES} valid invites** to claim rewards. You currently have **${stats.valid}**.`,
        ephemeral: true,
      });
    }

    const { data: existingClaim } = await supabase
      .from('invite_claims')
      .select('*')
      .eq('user_id', interaction.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingClaim) {
      return interaction.reply({
        content: '⏳ You already have a pending claim! Please wait for admin approval.',
        ephemeral: true,
      });
    }

    const reward = stats.valid * REWARD_PER_INVITE;

    const { error } = await supabase.from('invite_claims').insert({
      user_id: interaction.user.id,
      discord_username: interaction.user.username,
      minecraft_username: minecraftUsername,
      invite_count: stats.valid,
      reward_amount: reward,
    });

    if (error) {
      console.error('❌ Error creating claim:', error);
      return interaction.reply({ content: '❌ Failed to create claim. Please try again.', ephemeral: true });
    }

    await supabase
      .from('invites')
      .update({ is_claimed: true })
      .eq('inviter_id', interaction.user.id)
      .eq('is_valid', true)
      .eq('is_claimed', false);

    const channel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('💰 New Invite Reward Claim!')
        .addFields(
          { name: '👤 Discord User', value: `<@${interaction.user.id}> (${interaction.user.username})`, inline: false },
          { name: '🎮 Minecraft Username', value: minecraftUsername, inline: true },
          { name: '📊 Valid Invites', value: `${stats.valid}`, inline: true },
          { name: '💵 Reward Amount', value: `${reward.toLocaleString()} coins`, inline: true }
        )
        .setFooter({ text: 'Review in Admin Panel → Invites' })
        .setTimestamp();

      await channel.send({ content: `<@1468813317777784832>`, embeds: [embed] });
    }

    await interaction.reply({
      content: `✅ Claim submitted! You're requesting **${reward.toLocaleString()} coins** for **${stats.valid} invites**.\n\n⏳ An admin will review and approve your claim soon. Coins will be delivered to **${minecraftUsername}**.`,
      ephemeral: true,
    });
  }

  if (commandName === 'inviterewards') {
    const embed = new EmbedBuilder()
      .setColor(0x06B6D4)
      .setTitle('🎁 Invite Rewards System')
      .setDescription('Invite players to the server and earn in-game money!')
      .addFields(
        { name: '💰 Reward', value: `**${REWARD_PER_INVITE.toLocaleString()} coins** per valid invite`, inline: false },
        { name: '✅ Minimum to Claim', value: `**${MINIMUM_INVITES} invites**`, inline: true },
        { name: '⏱️ Validation Time', value: `**${VALIDATION_HOURS} hours**`, inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        { name: '📋 Rules', value: 
          '• No alts, J4J, or rejoining\n' +
          '• All invited users must be DonutSMP players\n' +
          '• Users must stay 5 hours before invite counts\n' +
          '• Violations result in ban', inline: false },
        { name: '🎮 Commands', value:
          '`/invites` - Check your invite count\n' +
          '`/claiminvites` - Submit claim (requires Minecraft username)\n' +
          '`/leaderboard` - View top inviters', inline: false }
      )
      .setFooter({ text: 'Happy inviting! 🎉' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
