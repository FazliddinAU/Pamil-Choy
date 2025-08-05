const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

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
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      https.get(videoUrl, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP xato: ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
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
