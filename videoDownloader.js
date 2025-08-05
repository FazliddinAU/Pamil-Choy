const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    console.error('⚠️ Video URL topilmadi');
    return bot.sendMessage(chatId, '⚠️ Video URL mavjud emas.');
  }

  const outputPath = path.join(os.tmpdir(), `video_${Date.now()}.%(ext)s`);
  const videoUrl = preferredVideo.url;

  console.log('⬇️ Yuklash boshlanmoqda:', videoUrl);
  console.log('📁 Saqlash manzili:', outputPath);

  try {
    await new Promise((resolve, reject) => {
      const command = `yt-dlp -f best -o "${outputPath}" "${videoUrl}"`;
      exec(command, (error, stdout, stderr) => {
        console.log('📝 yt-dlp stdout:', stdout);
        console.error('🛑 yt-dlp stderr:', stderr);

        if (error) {
          console.error('❌ yt-dlp xatolik:', error.message);
          return reject(new Error('yt-dlp orqali yuklab bo‘lmadi.'));
        }

        resolve();
      });
    });

    const tmpDir = os.tmpdir();
    const baseName = path.basename(outputPath).split('.%')[0];
    const downloadedFile = fs.readdirSync(tmpDir).find(f => f.startsWith(baseName));
    const filePath = path.join(tmpDir, downloadedFile);

    if (!fs.existsSync(filePath)) {
      throw new Error('❌ Yuklab olingan fayl topilmadi.');
    }

    console.log('📤 Video yuborilmoqda...');
    await bot.sendVideo(chatId, filePath, options);

  } catch (err) {
    console.error('❌ Umumiy xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ Videoni yuklashda yoki yuborishda xatolik yuz berdi.');
  } finally {
    try {
      const tmpFiles = fs.readdirSync(os.tmpdir());
      tmpFiles.forEach(file => {
        if (file.includes('video_')) {
          fs.unlinkSync(path.join(os.tmpdir(), file));
        }
      });
    } catch (e) {
      console.warn('⚠️ Faylni tozalashda xatolik:', e.message);
    }
  }
}

module.exports = downloadAndSendVideo;
