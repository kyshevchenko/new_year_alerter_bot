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

let messageStorage = []; // id сообщений, которые уже были в чате

const keywords = [
  "новый год",
  "нового года",
  "новогодний",
  "новогодние",
  "новогодних",
  "шри-ланка",
  "шри-ланку",
  "шри-ланке",
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
      const messageId = update?.message?.id;

      // логирования для отладки:
      // console.log("---------------------------------");
      // console.log("Время :", new Date());
      // console.log("messageStorage до проверки условия:", messageStorage);
      // console.log("channelId до проверки условия:", channelId);
      // console.log("messageId до проверки условия:", messageId);
      // console.log("newMessage до проверки условия:", newMessage);
      // console.log("---------------------------------");

      // блок для отправки сообщений Артему // TODO дополнить логикой фильтрации и вынести в отдельную функцию
      // if (update?.userId?.value) {
      //   // Отправляем сообщение Артему
      //   console.log("update?.userId?.value ->", update?.userId?.value);
      //   await client.sendMessage(process.env.ARTEM_CHAT_ID, { // id Артема
      //     message: "Салам Алеймум!",
      //   });
      // }

      if (
        messageId &&
        channelId &&
        newMessage &&
        !messageStorage.includes(newMessage) && // проверяем newMessage, чтобы не отправлять дубли в чат
        isKeyword(newMessage) // проверям справочник ключевых слов
      ) {
        messageStorage.push(newMessage);

        // логирования для отладки:
        // console.log("---------------------------------");
        // console.log("messageStorage :", messageStorage);
        // console.log("channelId :", channelId);
        // console.log("messageId :", messageId);
        // console.log("newMessage :", newMessage);
        // console.log("---------------------------------");
        // console.log("update после проверки :", update);
        // console.log("---------------------------------");

        try {
          // Пересылаем сообщение целиком в другой чат
          await client.forwardMessages(forwardChatId, {
            messages: [messageId],
            fromPeer: update.message.peerId,
          });

          await client.sendMessage("me", {
            message: `Cообщение перехвачено и отправлено в чат. Хранилище сообщений: ${messageStorage}`,
          });
        } catch (error) {
          console.error(`Error: ${error.message}`);
        }
      }
    }
  });

  await client.sendMessage("me", { message: "Бот запущен! " });

  // ежедневное (раз в сутки) сообщение-подтверждение работоспособности бота
  setInterval(async () => {
    const dateOnly = new Date().toLocaleDateString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
    const timeOnly = new Date().toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
    await client.sendMessage("me", {
      message: `Бот работает штатно: ${dateOnly}:${timeOnly}. Хранилище сообщений: ${messageStorage}`,
    });
  }, 86400000);
}

startBot();
