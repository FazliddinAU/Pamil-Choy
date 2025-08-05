const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadAndSendVideo(bot, chatId, preferredVideo, options = {}) {
  if (!preferredVideo || !preferredVideo.url) {
    console.error('⚠️ Video URL topilmadi');
    return bot.sendMessage(chatId, '⚠️ Video URL mavjud emas.');
  }

  const fileName = `video_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);
  const videoUrl = preferredVideo.url;

  console.log('⬇️ Yuklash boshlanmoqda:', videoUrl);
  console.log('💾 Saqlash joyi:', filePath);

  try {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500, 
    });

    if (response.status !== 200) {
      console.error(`❌ Yuklash xatosi: Status ${response.status}`);
      return bot.sendMessage(chatId, `❌ Video yuklab bo‘lmadi.`);
    }

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('📤 Video yuborilmoqda...');
    await bot.sendVideo(chatId, filePath, options);

  } catch (err) {
    console.error('❌ Umumiy xatolik:', err.message);
    await bot.sendMessage(chatId, '❌ yuklashda xatolik yuz berdi.');
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
}

module.exports = downloadAndSendVideo;
