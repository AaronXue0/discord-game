import {DiscordSDK} from '@discord/embedded-app-sdk';
console.log('DG!!!!');
export const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);
