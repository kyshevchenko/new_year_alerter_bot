import dotenv from "dotenv";
import { Telegraf, session } from "telegraf";

dotenv.config();

// const usersIds = process.env.USERS_ID;
const usersIds = [233008798, 417731323];

const keyword = process.env.KEYWORD;

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

const isIncludesKeywords = (text, caption) => {
  return (
    text.toLowerCase().includes(keyword) ||
    caption.toLowerCase().includes(keyword)
  );
};

bot.on("message", async (ctx) => {
  const newText = ctx.message.text || "";
  const newCaption = ctx.message.caption || "";

  ctx.message.chat.id && console.log("ctx.message.chat.id", ctx.message.chat.id);

  ctx.chat.id && console.log("ctx.chat.id", ctx.chat.id);

  if (isIncludesKeywords(newText, newCaption)) {
    for (const userId of usersIds) {
      await ctx.forwardMessage(userId);
    }
  }
});

bot.launch();
