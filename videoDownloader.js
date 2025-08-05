const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    console.error('⚠️ Video URL topilmadi');
    return bot.sendMessage(chatId, '⚠️ Video URL mavjud emas.');
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);
  const videoUrl = preferredVideo.url;

  console.log('⬇️ Yuklash boshlanmoqda:', videoUrl);

  try {
    await new Promise((resolve, reject) => {
      const command = `yt-dlp -f best -o "${filePath}" "${videoUrl}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ yt-dlp xatolik:', stderr);
          return reject(new Error('yt-dlp orqali yuklab bo‘lmadi.'));
        }
        console.log('✅ Video yuklandi.');
        resolve();
      });
    });

    if (!fs.existsSync(filePath)) {
      throw new Error('❌ Fayl topilmadi');
    }

    console.log('📤 Video yuborilmoqda...');
    await bot.sendVideo(chatId, filePath, options);

  } catch (err) {
    console.error('❌ Umumiy xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuklashda yoki yuborishda xatolik yuz berdi.');
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
}

module.exports = downloadAndSendVideo;
