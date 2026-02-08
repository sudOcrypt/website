# 🎁 DonutMC Invite Tracker Bot

Discord bot that tracks invites and rewards users with in-game money.

## 📋 Features

✅ **Automatic Invite Tracking**
- Tracks every invite per user
- 5-hour validation period before invite counts
- Detects and ignores: alts, rejoins, users who leave early

✅ **Slash Commands**
- `/invites` - Check your invite count
- `/invites @user` - (Admin only) Check someone else's invites  
- `/leaderboard` - View top 10 inviters
- `/claiminvites <minecraft_username>` - Claim your rewards
- `/inviterewards` - View reward tiers and rules

✅ **Admin Features**
- Auto-notifications when users hit milestones (every 3 invites)
- Web-based admin panel to approve/deny claims
- Detailed invite history and analytics
- Manual reward approval system

✅ **Reward System**
- **250,000 coins per valid invite**
- **Minimum 3 invites to claim** (750k coins)
- Claims must include Minecraft username

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `../donutmcstore_new/project/supabase/migrations/20260205080000_create_invite_system.sql`
3. Copy all SQL and paste into editor
4. Click **"Run"**
5. Should see ✅ Success - creates 3 tables: `invites`, `invite_claims`, `invite_settings`

### **Step 2: Install Dependencies**

```bash
cd discord-invite-bot
npm install
```

### **Step 3: Configure Environment Variables**

The `.env` file is already configured with your credentials:
- ✅ Discord Bot Token
- ✅ Guild ID  
- ✅ Notification Channel ID
- ✅ Supabase URL & Service Role Key
- ✅ Reward settings

**No changes needed!**

### **Step 4: Test Locally**

```bash
npm start
```

**You should see:**
```
✅ Logged in as DonutMC Bot#1234
🔄 Registering slash commands...
✅ Slash commands registered!
✅ Loaded 15 invites
```

**Test in Discord:**
1. Type `/inviterewards` - Should show rules
2. Type `/invites` - Should show your invite count
3. Type `/leaderboard` - Should show top inviters

### **Step 5: Deploy to Railway**

**Option A: Via GitHub (Recommended)**

1. Create new repo for the bot (or use existing):
```bash
cd c:\Users\jared\Desktop\website\website-1
git add discord-invite-bot/
git commit -m "Add invite tracker bot"
git push
```

2. In **Railway Dashboard**:
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your repo
   - Set **Root Directory**: `discord-invite-bot`
   - Add all environment variables from `.env` file
   - Click **"Deploy"**

**Option B: Via Railway CLI**

```bash
cd discord-invite-bot
railway login
railway init
railway up
```

---

## 🎮 How It Works

### **For Users:**

1. **Invite friends** to the Discord server
2. **Wait 5 hours** - invited users must stay for validation
3. **Use `/invites`** to check your count
4. **Once you have 3+ valid invites**, use `/claiminvites <minecraft_username>`
5. **Wait for admin approval** - you'll be notified when coins are delivered

### **For Admins:**

1. **Bot pings you** in #notifications when users hit milestones
2. **Go to website** → Admin Panel → **Invites** tab
3. **Review pending claims**:
   - See Discord username, Minecraft username, invite count
   - Approve = user gets coins delivered in-game
   - Deny = add a note explaining why
4. **View leaderboard** to see top inviters

---

## 📊 Database Tables

### **`invites`**
Tracks every single invite:
- `inviter_id` - Who invited
- `invited_id` - Who was invited
- `joined_at` - When they joined
- `is_valid` - True after 5 hours if still in server
- `is_claimed` - True after user claims reward
- `left_server` - True if user left

### **`invite_claims`**
Tracks reward claims:
- `user_id` - Who is claiming
- `minecraft_username` - Where to send coins
- `invite_count` - How many invites
- `reward_amount` - How many coins
- `status` - pending/approved/denied

### **`invite_settings`**
Bot configuration:
- `reward_per_invite` - Default: 250,000
- `minimum_invites` - Default: 3
- `validation_hours` - Default: 5

---

## 🛡️ Anti-Cheat Features

**Automatically Detects:**
- ❌ **Alt Accounts** - Multiple accounts joining rapidly
- ❌ **Rejoins** - Users who left and came back (doesn't count twice)
- ❌ **J4J (Join for Join)** - Users who invited each other
- ❌ **Early Leavers** - Users who leave before 5 hours

**Manual Review:**
- Admin must approve all claims
- Can add notes when denying
- Full audit trail of all invites

---

## 🔧 Configuration

### **Change Reward Amount:**

Edit `.env` file:
```env
REWARD_PER_INVITE=500000  # Change from 250k to 500k
```

Or update in Supabase `invite_settings` table.

### **Change Minimum Invites:**

```env
MINIMUM_INVITES=5  # Change from 3 to 5
```

### **Change Validation Time:**

```env
VALIDATION_HOURS=24  # Change from 5 hours to 24 hours
```

### **Give a role when users join:**

To auto-assign a role (e.g. "Member") when someone joins the server, add to `.env`:

```env
DISCORD_MEMBER_ROLE_ID=1234567890123456789   # Your role's ID (right-click role in Discord → Copy ID)
```

The bot's role must be **above** this role in Server Settings → Roles, or it can't assign it.

---

## 🐛 Troubleshooting

**Bot not responding to commands?**
- Check bot has permissions: `MANAGE_GUILD`, `VIEW_AUDIT_LOG`, `USE_APPLICATION_COMMANDS`
- Try `/` in Discord - commands should autocomplete

**Invites not tracking?**
- Check bot logs for errors
- Verify bot has `GUILD_MEMBERS` and `GUILD_INVITES` intents enabled

**Database errors?**
- Verify Supabase Service Role Key is correct
- Check migration ran successfully (3 tables created)

**Admin panel not showing claims?**
- Clear browser cache
- Check browser console for errors
- Verify you're logged in as admin

---

## 📞 Support

Questions? Check:
1. Bot logs (console output)
2. Supabase Edge Functions logs
3. Discord Developer Portal → Bot → Logs

---

## 🎉 Success Checklist

- [x] Database migration ran successfully
- [x] Bot is online in Discord
- [x] Slash commands work (`/invites`, `/leaderboard`)
- [x] Bot tracks new joins
- [x] Admin panel shows invites tab
- [x] Notifications post to correct channel

**Ready to reward your community!** 🚀
