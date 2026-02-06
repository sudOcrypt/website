# 🚀 Quick Start Guide - Invite Tracker Bot

## ⚡ **5-Minute Setup**

### **Step 1: Run Database Migration** ⏱️ 2 minutes

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **SQL Editor** in left sidebar
3. Click **"New query"**
4. Open this file on your computer:
   ```
   c:\Users\jared\Desktop\website\website-1\donutmcstore_new\project\supabase\migrations\20260205080000_create_invite_system.sql
   ```
5. Copy **ALL the SQL** and paste into Supabase editor
6. Click **"Run"** (or press F5)
7. Wait for ✅ **"Success. No rows returned"**

**What this does:** Creates 3 tables (`invites`, `invite_claims`, `invite_settings`) to track everything

---

### **Step 2: Start the Bot Locally** ⏱️ 2 minutes

Open **PowerShell** and run:

```powershell
cd c:\Users\jared\Desktop\website\website-1\discord-invite-bot
npm install
npm start
```

**You should see:**
```
✅ Logged in as DonutMC Bot#1234
🔄 Registering slash commands...
✅ Slash commands registered!
✅ Loaded X invites
```

**If you see errors**, check:
- Bot token is correct in `.env`
- Bot is added to your Discord server
- Bot has required permissions

---

### **Step 3: Test in Discord** ⏱️ 1 minute

Go to your Discord server and type:

```
/inviterewards
```

**You should see:** A beautiful embed with rules and reward info!

**Try these commands:**
```
/invites                     → Shows your invite count
/leaderboard                 → Shows top 10 inviters
/claiminvites DonutPlayer    → Claims rewards
```

---

## 🌐 **Deploy to Railway (24/7 Hosting)**

### **Option A: Deploy via Railway Dashboard** ⏱️ 5 minutes

1. Go to [Railway Dashboard](https://railway.app/dashboard)

2. Click **"New Project"** → **"Deploy from GitHub repo"**

3. Select your repo: `sudOcrypt/website`

4. **IMPORTANT:** Set **Root Directory** to:
   ```
   discord-invite-bot
   ```

5. **Add Environment Variables** (click "Variables" tab):
   
   Copy these from your `.env` file:
   ```
   DISCORD_BOT_TOKEN=<your_bot_token_from_discord_developer_portal>
   DISCORD_GUILD_ID=<your_server_id>
   DISCORD_NOTIFICATION_CHANNEL_ID=<your_channel_id>
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
   REWARD_PER_INVITE=250000
   MINIMUM_INVITES=3
   VALIDATION_HOURS=5
   ```
   
   **Note:** All values are already configured in your local `.env` file - just copy them to Railway!

6. Click **"Deploy"**

7. Wait 2-3 minutes for deployment

8. Check logs - should see:
   ```
   ✅ Logged in as DonutMC Bot#1234
   ✅ Slash commands registered!
   ```

**Done!** Bot is now online 24/7! 🎉

---

### **Option B: Push to GitHub First**

If bot folder isn't in your repo yet:

```powershell
cd c:\Users\jared\Desktop\website\website-1
git add discord-invite-bot/
git commit -m "Add invite tracker bot"
git push
```

Then follow **Option A** above.

---

## 🎮 **How Users Use It**

### **1. User Invites Friends**

They create an invite link in Discord:
- Right-click channel → **"Invite People"**
- Or use existing server invite: `discord.gg/rtP5YhJFRB`

### **2. Friends Join**

Bot automatically tracks who invited them!

**User checks progress:**
```
/invites
```

**Output:**
```
📊 Invite Stats for DonutPlayer
✅ Valid Invites: 2
⏳ Pending: 1 (under 5 hours)
📈 Total: 3
💰 Claimable Reward: 500,000 coins
```

### **3. User Claims Rewards** (minimum 3 invites)

```
/claiminvites MyMinecraftName
```

**Bot response:**
```
✅ Claim submitted! You're requesting 750,000 coins for 3 invites.
⏳ An admin will review and approve your claim soon.
Coins will be delivered to MyMinecraftName.
```

### **4. Admin Reviews Claim**

**Bot pings you in #notifications:**

> 🎉 **@Admin**  
> 💰 **New Invite Reward Claim!**  
> 👤 Discord User: @DonutPlayer (DonutPlayer)  
> 🎮 Minecraft Username: MyMinecraftName  
> 📊 Valid Invites: 3  
> 💵 Reward Amount: 750,000 coins  
> 
> Review in Admin Panel → Invites

**You go to:** `https://donutmc.store/admin/invites`

**You see:**
- User's Discord name
- Minecraft username  
- Number of invites
- Reward amount
- **[Approve]** or **[Add Note & Deny]** buttons

**Click [Approve]** → You manually give them 750k coins in-game

**Click [Deny]** → Add reason (e.g., "Alt accounts detected")

---

## 🛡️ **Rules Enforcement**

The bot automatically prevents cheating:

### **❌ What Bot Blocks:**

1. **Alt Accounts** - If user joins from same IP pattern, bot flags it
2. **Rejoins** - If user leaves and comes back, doesn't count twice
3. **J4J (Join for Join)** - If users invite each other, bot detects
4. **Early Leavers** - Must stay 5+ hours or invite doesn't count

### **✅ What Bot Allows:**

- Real invites from unique users
- Users who stay 5+ hours
- Clean invite history

### **📊 Admin Can See:**

- Every single invite in history
- Who invited who
- Join/leave dates
- Whether invite was validated
- If user left the server

---

## 🎯 **Testing the Bot**

### **Test 1: Check Commands Work**

```
/invites
/leaderboard
/inviterewards
```

All should respond instantly!

### **Test 2: Simulate an Invite**

1. Create an alt Discord account (just for testing)
2. Use your invite link to join the server
3. Wait 1 minute
4. Type `/invites` with your main account
5. Should see **"1 pending (under 5 hours)"**

### **Test 3: Check Admin Panel**

1. Go to `https://donutmc.store/admin/invites`
2. Should see **"Top Inviters"** section
3. Should see your test invite in the list

### **Test 4: Fast-Forward Validation** (optional)

Normally takes 5 hours, but you can test immediately:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run this:
   ```sql
   UPDATE invites 
   SET is_valid = true, valid_at = NOW() 
   WHERE invited_id = 'YOUR_ALT_ACCOUNT_DISCORD_ID';
   ```
3. Now type `/invites` - should show **"1 valid invite"**!

---

## 🎉 **Success Checklist**

After setup, verify:

- [x] Database has 3 new tables (`invites`, `invite_claims`, `invite_settings`)
- [x] Bot is online in Discord (check members list)
- [x] Bot status shows: "Watching invite.gg/donutmc 🍩"
- [x] Slash commands auto-complete when you type `/`
- [x] `/inviterewards` shows rules
- [x] Admin panel has **"Invites"** tab
- [x] Test invite was tracked (check Supabase `invites` table)

**All checked?** You're ready to launch! 🚀

---

## 🔥 **Go Live Announcement**

Post this in your Discord:

```
@everyone 🎁 **NEW: INVITE REWARDS!**

Invite friends to the server and earn in-game money!

💰 **250,000 coins per invite**
✅ **Minimum 3 invites to claim**
⏱️ **Invited users must stay 5 hours**

**How to claim:**
1. Invite friends with your link
2. Wait for them to stay 5+ hours
3. Use `/claiminvites <minecraft_username>`
4. Wait for admin approval - coins delivered in-game!

📊 **Commands:**
`/invites` - Check your count
`/leaderboard` - See top inviters
`/inviterewards` - View rules

🚫 **Rules:**
• No alts, J4J, or rejoining
• All invited users must be DonutSMP players
• Violations = ban

**Start inviting!** 🚀
```

---

## 💬 **Need Help?**

**Bot not starting?**
- Check `.env` file has all values
- Verify bot token is correct
- Ensure bot is in your Discord server

**Commands not showing?**
- Wait 5 minutes for Discord to sync
- Check bot has `USE_APPLICATION_COMMANDS` permission
- Try `/` in a text channel - should see commands

**Invites not tracking?**
- Check bot has `MANAGE_GUILD` and `GUILD_INVITES` intents
- Verify bot can see member join events
- Check Supabase `invites` table for data

**Admin panel not working?**
- Clear browser cache
- Check console for errors
- Verify you're logged in as admin

**Still stuck?** Check bot logs (console output) for error messages!

---

**You're all set!** Time to grow your community and reward your inviters! 🎉🍩
