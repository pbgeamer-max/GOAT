import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import { Strategy as DiscordStrategy } from "passport-discord";
import { config } from "../config.js";
import { upsertSteamUser, linkDiscordAccount, getUser } from "../database/db.js";
import { grantVerifiedRole } from "../services/bot.js";
import { grantDiscordKit, notifyRustServerLink } from "../services/rcon.js";

// Passport Session serialization
passport.serializeUser((user, done) => {
  done(null, user.steam_id);
});

passport.deserializeUser((steam_id, done) => {
  try {
    const user = getUser(steam_id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

// 1. Steam OpenID Strategy
try {
  passport.use(
    new SteamStrategy(
      {
        returnURL: config.steam.returnUrl,
        realm: config.steam.realm,
        apiKey: config.steam.apiKey,
      },
      (identifier, profile, done) => {
        try {
          const steam_id = profile.id;
          const steam_name = profile.displayName || "Rust Survivor";
          const avatar = profile.photos?.[2]?.value || profile.photos?.[0]?.value || "";
          const profile_url = profile._json?.profileurl || `https://steamcommunity.com/profiles/${steam_id}`;

          const user = upsertSteamUser({
            steam_id,
            steam_name,
            avatar,
            profile_url,
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log(`[Auth] Steam OpenID Strategy registered (Realm: ${config.steam.realm}, ReturnURL: ${config.steam.returnUrl})`);
} catch (err) {
  console.warn("[Auth] Failed to initialize Steam strategy:", err.message);
}

// 2. Discord OAuth2 Strategy (Account Linking)
if (config.discord.clientId && config.discord.clientSecret) {
  try {
    passport.use(
      new DiscordStrategy(
        {
          clientID: config.discord.clientId,
          clientSecret: config.discord.clientSecret,
          callbackURL: config.discord.callbackUrl,
          scope: ["identify", "guilds.join"],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const currentSteamUser = req.user;
            if (!currentSteamUser) {
              return done(new Error("Please log in with Steam first before linking Discord."), null);
            }

            const discordAvatarUrl = profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || "0", 10) % 5}.png`;

            const discordTag = profile.discriminator && profile.discriminator !== "0"
              ? `${profile.username}#${profile.discriminator}`
              : profile.username;

            // Link in SQLite database
            const updatedUser = linkDiscordAccount(currentSteamUser.steam_id, {
              discord_id: profile.id,
              discord_tag: discordTag,
              discord_avatar: discordAvatarUrl,
            });

            // Asynchronously perform Discord Role Grant & Rust RCON Link Notification
            Promise.allSettled([
              grantVerifiedRole(profile.id, updatedUser),
              notifyRustServerLink(updatedUser.steam_id, updatedUser.steam_name),
            ]).catch((e) => console.error("[Linking Post-Action Error]:", e));

            return done(null, updatedUser);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
    console.log(`[Auth] Discord OAuth2 Linking Strategy registered (Callback: ${config.discord.callbackUrl})`);
  } catch (err) {
    console.warn("[Auth] Failed to initialize Discord strategy:", err.message);
  }
}

export default passport;
