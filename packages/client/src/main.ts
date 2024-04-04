import {createApp} from 'vue';
import App from './App.vue'; // Your main Vue component
import {DiscordSDK} from '@discord/embedded-app-sdk';
const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

// Standard Vue setup
const app = createApp(App);
app.mount('#app'); // This should match the id of the div in your index.html

type Auth = ReturnType<typeof discordSdk.commands.authenticate>;
let auth: Auth;

// Once setupDiscordSdk is complete, we can assert that "auth" is initialized
setupDiscordSdk().then(() => {
  appendVoiceChannelName();
  appendGuildAvatar();
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log('Client: ' + import.meta.env.VITE_CLIENT_ID);

  // Authorize with Discord Client
  const {code} = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: [
      'identify',
      'guilds',

      'rpc.voice.read',
      // "webhook.incoming",
    ],
  });

  // Retrieve an access_token from your activity's server
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
    }),
  });
  const {access_token} = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error('Authenticate command failed');
  }
}

/**
 * This function fetches the current voice channel over RPC. It then creates a
 * text element that displays the voice channel's name
 */
async function appendVoiceChannelName() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  let activityChannelName = 'Unknown';

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

/**
 * This function utilizes RPC and HTTP apis, in order show the current guild's avatar
 * Here are the steps:
 * 1. From RPC fetch the currently selected voice channel, which contains the voice channel's guild id
 * 2. From the HTTP API fetch a list of all of the user's guilds
 * 3. Find the current guild's info, including its "icon"
 * 4. Append to the UI an img tag with the related information
 */
async function appendGuildAvatar() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  // 1. From the HTTP API fetch a list of all of the user's guilds
  const guilds: Array<{id: string; icon: string}> = await fetch(`https://discord.com/api/users/@me/guilds`, {
    headers: {
      // NOTE: we're using the access_token provided by the "authenticate" command
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((reply) => reply.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  // 3. Append to the UI an img tag with the related information
  if (currentGuild != null) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute(
      'src',
      // More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
      `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
    );
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
  }
}

setupDiscord().then(() => {
  console.log('Discord SDK is ready');
});
