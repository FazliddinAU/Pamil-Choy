const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');

async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    console.error('⚠️ Video URL topilmadi');
    return bot.sendMessage(chatId, '⚠️ Video URL mavjud emas.');
  }

  const videoUrl = preferredVideo.url;
  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  console.log('⬇️ Yuklab olinmoqda:', videoUrl);

  try {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      maxRedirects: 5 
    });

    const writer = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('✅ Yuklandi. Yuborilmoqda...');
    await bot.sendVideo(chatId, filePath, options);
  } catch (err) {
    console.error('❌ Yuklash yoki yuborishda xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuklashda yoki yuborishda xatolik yuz berdi.');
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
}

module.exports = downloadAndSendVideo;
