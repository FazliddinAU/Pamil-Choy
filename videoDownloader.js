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
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      maxRedirects: 5, 
    });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await bot.sendVideo(chatId, filePath, options);

  } catch (err) {
    console.error('❌ Xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuborishda yoki yuklashda xatolik yuz berdi.');
  } finally {
    fs.unlink(filePath, () => {});
  }
}

module.exports = downloadAndSendVideo;
