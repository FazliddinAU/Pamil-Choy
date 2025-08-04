const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    throw new Error('Video URL topilmadi');
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const response = await axios({
      method: 'GET',
      url: preferredVideo.url,
      responseType: 'stream',
      headers: {}
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      try {
        await bot.sendVideo(chatId, filePath, options);
      } catch (err) {
        console.error('❌ Video yuborishda xatolik:', err.message);
        await bot.sendMessage(chatId, '❌ Video yuborishda xatolik yuz berdi.');
      } finally {
        fs.unlink(filePath, () => {});
      }
    });

    writer.on('error', async (err) => {
      console.error('❌ Fayl yozishda xatolik:', err.message);
      await bot.sendMessage(chatId, '❌ Faylni yozishda xatolik yuz berdi.');
    });

  } catch (err) {
    console.error('❌ Yuklashda xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuklashda xatolik yuz berdi.');
  }
}

module.exports = downloadAndSendVideo;
