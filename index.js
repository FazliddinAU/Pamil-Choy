require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const downloadMedia = require('./request');

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN);
bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);

app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body); 
  res.sendStatus(200);
});
const message = `Assalomu alaykum men bu botdan foydalanib milliyligimizga bee'tibor emasligimni bildirdim. Endi sizning navbatingiz!`;
const botLink = 'https://t.me/PamilChoyBot';
 
const shareLink = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '📤 Ulashish',
          url: `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(message)}`
        }  
      ],
      [        
        {
        "text": "Guruhga qo'shish",
        "url": "https://t.me/PamilChoyBot?startgroup=true"
        }
        ]
    ]
  }
};
bot.onText(/\/start/, (msg) => {
    const name = msg.from.first_name;
  bot.sendMessage(msg.chat.id, `<b>👋 Assalomu alaykum ${name}.</b>\n<b>🤖 Botimiz orqali Instagram, YouTube, Tiktok, Likee, Snapchat medialarini yuklab olishingiz mumkin.📥</b>\n\n<blockquote><b>Bot bo'yicha murojaat uchun : @fazliddin_au</b></blockquote>`, {
    parse_mode : 'HTML',
    reply_markup : {
        inline_keyboard : [
        [
        {
        "text": "Guruhga qo'shish",
        "url": "https://t.me/PamilChoyBot?startgroup=true"
        }
        ]
        ]
    }
  });
});
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/') || !text.includes('http')) return;
  const isYouTube = text.includes('youtube.com') || text.includes('youtu.be');
  const loadingMsg = await bot.sendMessage(chatId, `<b>⏳ Yuklanmoqda, ungacha choy ichib turing...🫖</b>`, {
    parse_mode : 'HTML'
  });
  try {
    const result = await downloadMedia(text);
    if (!result || !result.medias || result.medias.length === 0) {
      await bot.sendMessage(chatId, ❌ yuklab bo'lmadi.);
      return;
    }
    const videoExtensions = [
      '.mp4', '.mov', '.avi', '.wmv', '.flv',
      '.webm', '.mkv', '.3gp', '.mpeg', '.mpg',
      '.m4v', '.ts', '.ogv'
    ];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const medias = (result.medias || []).filter(m => m && m.url);
    console.log('Medias:', medias.length);
const videoMedias = medias.filter(m => {
  const url = m.url.toLowerCase();
  return videoExtensions.some(ext => url.includes(ext)) || url.includes('mime=video');
});
const imageMedia = medias.find(m => {
  const url = m.url.toLowerCase();
  return imageExtensions.some(ext => url.includes(ext)) || url.includes('mime=image');
});
const isYouTube = text.includes('youtube.com') || text.includes('youtu.be');
const preferredVideo = videoMedias.find(m => m.url.includes('itag=22')) || videoMedias[0];
console.log(preferredVideo)
if (preferredVideo) {
    if (isYouTube) {
    await downloadAndSendVideo(bot, chatId, preferredVideo, {
        caption: <b>📍Reklama va obunalarsiz yuklab oling.✅</b>,
        parse_mode : 'HTML',
        ...shareLink
    });
    } else {
    await bot.sendVideo(chatId, preferredVideo.url, {
        caption : <b>📍Reklama va obunalarsiz yuklab oling.✅</b>,
        parse_mode : 'HTML',
        ...shareLink
      });
    }
} else if (imageMedia && medias.length === 1) {
  await bot.sendPhoto(chatId, imageMedia.url, {caption : <b>📍Reklama va obunalarsiz yuklab oling.✅</b>, parse_mode : 'HTML', ...shareLink });
} else {
      const mediaGroup = [];
      const others = [];
      for (let i = 0; i < medias.length; i++) {
        const media = medias[i];
        const url = media.url.toLowerCase();
        const isVideo = videoExtensions.some(ext => url.includes(ext)) || url.includes('mime=video');
        const isImage = imageExtensions.some(ext => url.includes(ext)) || url.includes('mime=image');
        if (isImage) {
          mediaGroup.push({
            type: 'photo',
            media: media.url,
            ...(mediaGroup.length === 0 && { caption: <b>📍Reklama va obunalarsiz yuklab oling.✅</b>, parse_mode : 'HTML'})
          });
        } else if (isVideo) {
          mediaGroup.push({
            type: 'video',
            media: media.url,
          });
        } else {
          others.push(media.url);
        }
      }
      const chunkSize = 10;
      for (let i = 0; i < mediaGroup.length; i += chunkSize) {
        const chunk = mediaGroup.slice(i, i + chunkSize);
        try {
          await bot.sendMediaGroup(chatId, chunk);
        } catch (e) {
          console.error('❌ sendMediaGroup xatolik:', e.message);
          await bot.sendMessage(chatId, '⚠️ Medialarni yuborishda xatolik yuz berdi.');
        }
      }
      for (const fileUrl of others) {
        await bot.sendVideo(chatId, fileUrl,{
            caption : <b>📍Reklama va obunalarsiz yuklab oling.✅</b>,
            parse_mode : 'HTML',
            ...shareLink
        });
      }
    }
  } catch (err) {
    console.error('❌ Yuklashda xatolik:', err.message);
    await bot.sendMessage(chatId, ❌ Yuklashda xatolik yuz berdi, qayta urinib ko'ring);
  } finally {
    try {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    } catch (e) {
      console.warn('ℹ️ Yuklanmoqda xabarini o‘chirishda muammo:', e.message);
    }
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
