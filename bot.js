import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

const apiId = Number(process.env.API_TELEGRAM_ID);
const apiHash = process.env.API_TELEGRAM_HASH;
const forwardChatId = process.env.FORWARD_CHAT_ID;

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sessionFile = path.join(__dirname, "session2.txt");
const stringSession = new StringSession(
  fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8") : ""
);
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

let idMessageStorage = []; // id сообщений, которые уже были в чате

// раз в 2 дня очищаем массив id сообщений
setInterval(() => {
  idMessageStorage = [];
}, 1000000000);

const keywords = [
  "новый год",
  "нового года",
  "новогодний",
  "новогодние",
  "новогодних",
  "шри-ланка",
  "шри-ланку",
  "шри ланка",
  "шри ланку",
];

// условие для подтверждения о содержании в сообщении необходимых слов
const isKeyword = (newMessage) => {
  return keywords.some((e) => newMessage.toLowerCase().includes(e));
};

async function startBot() {
  await client.start({
    phoneNumber: async () => await input.text("Введите ваш номер телефона: "),
    password: async () =>
      await input.text("Введите ваш пароль (если используется): "),
    phoneCode: async () => await input.text("Введите код из Telegram: "),
    onError: (err) => console.log(err),
  });
  console.log("Авторизация прошла успешно!");

  console.log("Сессия:");
  console.log(client.session.save());

  client.addEventHandler(async (update) => {
    if (update?.message) {
      const channelId = update?.message?.peerId?.channelId?.value;
      const newMessage = update?.message?.message;
      const messageId = update.message.id;

      if (
        messageId &&
        channelId &&
        newMessage &&
        !idMessageStorage.includes(messageId) && // проверяем messageId, чтобы не отпралять дубли в чат
        isKeyword(newMessage) // проверям справочник ключевых слов
      ) {
        idMessageStorage.push(messageId);

        // Пересылаем сообщение целиком в другой чат
        try {
          await client.forwardMessages(forwardChatId, {
            messages: [messageId],
            fromPeer: update.message.peerId,
          });

          await client.sendMessage("me", {
            message: "Cообщение перехвачено и отправлено в чат",
          });
        } catch (error) {
          console.error(`Error: ${error.message}`);
        }
      }
    }
  });

  await client.sendMessage("me", { message: "Бот запущен! " });
}

startBot();
