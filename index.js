require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { downloadMedia, downloadAndSendVideo } = require('./request');

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
  const text = msg.text?.trim();

  if (!text || text.startsWith('/') || !text.includes('http')) return;

  const isYouTube = text.includes('youtube.com') || text.includes('youtu.be');

  const loadingMsg = await bot.sendMessage(chatId, `<b>⏳ Yuklanmoqda, ungacha choy ichib turing...🫖</b>`, {
    parse_mode: 'HTML'
  });

  try {
    let result;
    let medias = [];

    if (isYouTube) {
    await downloadAndSendVideo(bot, chatId, text, { 
    caption: `<b>📍Reklama va obunasiz yuklab oling.✅</b>`,
    parse_mode: 'HTML',
    ...shareLink
  });
    } else {
      // Boshqa platformalar uchun
      result = await downloadMedia(text);

      if (!result || !result.medias?.length) {
        await bot.sendMessage(chatId, `❌ Yuklab bo'lmadi.`);
        return;
      }
    }

    // Faqat non-YouTube uchun qolgan logika
    if (!isYouTube) {
      medias = result.medias.filter(m => m?.url);
      console.log('Medias soni:', medias.length);

      const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.3gp', '.mpeg', '.mpg', '.m4v', '.ts', '.ogv'];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

      const videoMedias = medias.filter(m => {
        const url = m.url.toLowerCase();
        return videoExtensions.some(ext => url.endsWith(ext)) || url.includes('mime=video');
      });

      const imageMedia = medias.find(m => {
        const url = m.url.toLowerCase();
        return imageExtensions.some(ext => url.endsWith(ext)) || url.includes('mime=image');
      });

      const preferredVideo = videoMedias[0];

      if (preferredVideo) {
      const captionText = '📍Reklama va obunasiz yuklab oling.✅';
      
        await bot.sendVideo(chatId, preferredVideo.url, {
          caption: captionText,  
          entities: [
            {
              type: 'custom_emoji',
              offset: 0,
              length: 2,
              custom_emoji_id: '5217806397537819501' 
            },
            {
              type: 'custom_emoji',
              offset: 34,
              length: 1,
              custom_emoji_id: '5217921777539258582' 
            }
          ],
          ...shareLink,
          supports_streaming: true
        });
      } else if (imageMedia && medias.length === 1) {
        const captionText = '📍Reklama va obunasiz yuklab oling.✅';
        
          await bot.sendPhoto(chatId, imageMedia.url, {
            caption: captionText,
            entities: [
              { type: 'custom_emoji', offset: 0, length: 2, custom_emoji_id: '5217806397537819501' },
              { type: 'custom_emoji', offset: 34, length: 1, custom_emoji_id: '5217921777539258582' }
            ],
            ...shareLink
          });
      } else {
        const mediaGroup = [];
        const others = [];

        for (const media of medias) {
          const url = media.url.toLowerCase();
          const isVideo = videoExtensions.some(ext => url.endsWith(ext)) || url.includes('mime=video');
          const isImage = imageExtensions.some(ext => url.endsWith(ext)) || url.includes('mime=image');

          if (isImage) {
            mediaGroup.push({
              type: 'photo',
              media: media.url,
              ...(mediaGroup.length === 0 && {
                caption: `<b>📍Reklama va obunasiz yuklab oling.✅</b>`,
                parse_mode: 'HTML'
              })
            });
          } else if (isVideo) {
            mediaGroup.push({
              type: 'video',
              media: media.url
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
            console.error('sendMediaGroup xatosi:', e.message);
            await bot.sendMessage(chatId, '⚠️ Medialarni yuborishda xatolik.');
          }
        }

        for (const url of others) {
        const captionText = '📍Reklama va obunasiz yuklab oling.✅';
        
        await bot.sendVideo(chatId, url, {
          caption: captionText,
          entities: [
                { type: 'custom_emoji', offset: 0, length: 2, custom_emoji_id: '5217806397537819501' },
                { type: 'custom_emoji', offset: 34, length: 1, custom_emoji_id: '5217921777539258582' }
              ],
              ...shareLink
            });
        }
      }
    }
  } catch (err) {
    console.error('Yuklash xatosi:', err.message);
    await bot.sendMessage(chatId, `❌ Yuklashda xatolik yuz berdi, qayta urinib ko'ring`);
  } finally {
    try {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    } catch (e) {
      console.warn('Yuklanmoqda xabarini o‘chirish muammosi:', e.message);
    }
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
