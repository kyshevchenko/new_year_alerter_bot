import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const apiId = process.env.API_TELEGRAM_ID;
const apiHash = process.env.API_TELEGRAM_HASH;

const sessionFile = path.join(__dirname, "session.txt");

const stringSession = new StringSession(
  fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8") : ""
);

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

const allowedChatIds = [
  -1001045868879,
  -1001141664489,
  -1001067688841,
  -1001092283652,
  -1001754252633, // тестовый чат топор live
];

const dictionary = [
  "новый год",
  "нового года",
  "москва",
  "москве",
  "египет",
  "оаэ",
  "шри-ланка",
  "шри-ланку",
  "иран",
  "турция",
  "израиль",
  "фильм",
  "сезон",
  "кино",
  "сериал",
];

(async () => {
  console.log("Loading interactive example...");
  await client.start({
    phoneNumber: async () => await input.text("Введите ваш номер телефона: "),
    password: async () =>
      await input.text("Введите ваш пароль (если используется): "),
    phoneCode: async () => await input.text("Введите код из Telegram: "),
    onError: (err) => console.log(err),
  });
  console.log("Вы авторизованы!");

  console.log("Ваша строка сессии:");
  console.log(client.session.save());

  const isRequiredWords = (newMessage) => {
    return dictionary.some((e) => newMessage.toLowerCase().includes(e));
  };

  client.addEventHandler(async (update) => {
    if (update?.message) {
      const channelId = update.message?.peerId?.channelId?.value;
      const messageId = update.message.id;

      const newMessage = update?.message?.message;

      if (messageId && channelId && newMessage && isRequiredWords(newMessage)) {
        console.log("Channel ID:", channelId);
        console.log("messageId ID:", messageId);
        console.log("newMessage:", newMessage);

        try {
          await client.sendMessage(-4558353957, { message: newMessage });
        } catch (error) {
          console.error(`Error: ${error.message}`);
        }
      }
    }
  });

  await client.sendMessage("me", { message: "Работаем! " });
})();
