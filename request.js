require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadMedia(url) {
  const options = {
    method: 'POST',
    url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: { url }
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('RapidAPI xatosi:', error.message);
    return null;
  }
}

async function downloadAndSendVideo(bot, chatId, media, options = {}) {
  if (!media?.url) {
    await bot.sendMessage(chatId, '❌ Video URL topilmadi.');
    return;
  }

  const videoUrl = media.url;
  const filePath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);

  try {
    console.log('Serverda yuklab olinmoqda:', videoUrl);

    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: 120000, // 2 daqiqa
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/132.0.0.0'
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Telegramga local fayl sifatida yuboramiz
    await bot.sendVideo(chatId, filePath, {
      caption: options.caption || `<b>📍Reklama va obunasiz yuklandi ✅</b>`,
      parse_mode: 'HTML',
      ...options.reply_markup && { reply_markup: options.reply_markup },
      supports_streaming: true
    });

  } catch (err) {
    console.error('Yuklash xatosi:', err.message);
    await bot.sendMessage(chatId, '❌ Video serverda yuklanmadi. Qayta urinib ko‘ring.');
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = { downloadMedia, downloadAndSendVideo };
