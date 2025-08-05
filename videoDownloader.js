const ytdl = require('ytdl-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function downloadAndSendVideo(bot, chatId, videoUrl, options = {}) {
  if (!ytdl.validateURL(videoUrl)) {
    return bot.sendMessage(chatId, '❌ Noto‘g‘ri YouTube havolasi.');
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const stream = ytdl(videoUrl, { quality: '18' }); 
    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);

    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await bot.sendVideo(chatId, filePath, options);
  } catch (err) {
    console.error('❌ Xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuklashda yoki yuborishda xatolik yuz berdi.');
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
}

module.exports = downloadAndSendVideo;
