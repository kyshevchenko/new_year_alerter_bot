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

let messageStorage = []; // хранилище сообщений, которые уже были в чате
let dayCounter = 0; // счетчик дней работы боты

const keywords = [
  "новый год",
  "нового года",
  "новогодний",
  "новогодние",
  "новогодних",
  "новым годом",
];

// условие для подтверждения о содержании в сообщении необходимых слов
const isKeyword = (message) => {
  return keywords.some((e) => message.toLowerCase().includes(e));
};

const daysDeclension = (number) => {
  if (number > 10 && [11, 12, 13, 14].includes(number % 100)) return "дней";
  lastNum = number % 10;
  if (lastNum === 1) return "день";
  if ([2, 3, 4].includes(lastNum)) return "дня";
  if ([5, 6, 7, 8, 9, 0].includes(lastNum)) return "дней";
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
      const shortMessage = update?.message?.message?.substr(0, 25); // Обрезаем сообщение, чтобы не хранить его целиком
      const fullMessage = update?.message?.message;
      const messageId = update?.message?.id;

      // логирования для отладки:
      // console.log("---------------------------------");
      // console.log("Время :", new Date());
      // console.log("messageStorage до проверки условия:", messageStorage);
      // console.log("channelId до проверки условия:", channelId);
      // console.log("messageId до проверки условия:", messageId);
      // console.log("shortMessage до проверки условия:", shortMessage);
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
        shortMessage &&
        !messageStorage.includes(shortMessage) && // проверяем shortMessage, чтобы не отправлять дубли в чат
        isKeyword(fullMessage) // проверям справочник ключевых слов
      ) {
        messageStorage.push(shortMessage);

        // логирования для отладки:
        // console.log("---------------------------------");
        // console.log("messageStorage :", messageStorage);
        // console.log("channelId :", channelId);
        // console.log("messageId :", messageId);
        // console.log("shortMessage :", shortMessage);
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
            message: `Cообщение перехвачено и отправлено в чат.`,
          });
        } catch (error) {
          console.error(`Error: ${error.message}`);
        }
      }
    }
  });

  await client.sendMessage("me", { message: "Бот запущен! " });

  // ежедневное сообщение-подтверждение работоспособности бота
  setInterval(async () => {
    dayCounter += 1;

    await client.sendMessage("me", {
      message: `Бот работает штатно: ${dayCounter} 
      ${daysDeclension(dayCounter)}. 
      Хранилище: ${messageStorage.length} сообщений.`,
    });
  }, 86400000); // раз в сутки

  setInterval(async () => {
    await client.sendMessage("me", {
      message: `Хранилище: ${messageStorage.join("\n--------\n")}`,
    });
  }, 26400000); // 4 раза в сутки
}

startBot();
