const ytdl = require('ytdl-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    console.error('⚠️ Video URL topilmadi');
    return bot.sendMessage(chatId, '⚠️ Video URL mavjud emas.');
  }

  const videoUrl = preferredVideo.url;

  if (!ytdl.validateURL(videoUrl)) {
    return bot.sendMessage(chatId, '❌ Noto‘g‘ri YouTube havolasi.');
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  console.log('⬇️ Yuklab olinmoqda:', videoUrl);
  console.log('📁 Fayl manzili:', filePath);

  try {
    const stream = ytdl(videoUrl, { quality: '18' }); 
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      stream.on('error', reject);
      writeStream.on('finish', resolve);
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
