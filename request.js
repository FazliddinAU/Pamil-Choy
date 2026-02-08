require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const YTDlpWrap = require('yt-dlp-wrap').default;


async function downloadMedia(url) {
  const options = {
    method: 'POST',
    url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: { url: url }
  };
  try {
    const response = await axios.request(options);
    const data = response.data;
    if (!data || !data.medias || data.medias.length === 0) {
      return data;
    }
    const medias = data.medias || [];
    const preferredItags = [136, 135, 18, 134, 22];
    let selectedMedia = null;
    for (const itag of preferredItags) {
      selectedMedia = medias.find(m => m.itag === itag);
      if (selectedMedia) break;
    }
 
    if (!selectedMedia) {
      const videoOnly = medias
        .filter(m => m.type === 'video' && m.height)
        .sort((a, b) => (b.height || 0) - (a.height || 0));
      selectedMedia = videoOnly[0];
    }
    if (!selectedMedia) {
      selectedMedia = medias.find(m => m.is_audio === false && m.type === 'video') || medias[0];
    }
    return {
      ...data,
      medias: selectedMedia ? [selectedMedia] : []
    };
  } catch (error) {
    console.error('❌ RapidAPI xatosi:', error.response?.data || error.message);
    return null;
  }
}

async function downloadAndSendVideo(bot, chatId, media, options = {}) {
  if (!media?.url) {
    await bot.sendMessage(chatId, '❌ Video URL topilmadi.');
    return;
  }

  // Agar media.url YouTube googlevideo bo'lsa – yt-dlp bilan yuklaymiz
  const isYouTubeUrl = media.url.includes('googlevideo.com') || media.url.includes('youtube.com');

  const filePath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);

  try {
    console.log('Yuklab olinmoqda (yt-dlp):', media.url);

    const ytDlp = new YTDlpWrap();  // binary avto yuklanadi

    // yt-dlp argumentlari
    const ytDlpArgs = [
      media.url,                    // original URL
      '-f', 'bestvideo[height<=720]+bestaudio/best',  // 720p gacha + eng yaxshi audio
      '--merge-output-format', 'mp4',
      '-o', filePath
    ];

    // yt-dlp ni ishga tushiramiz
    await ytDlp.execPromise(ytDlpArgs);

    // Fayl mavjudligini tekshiramiz
    if (!fs.existsSync(filePath)) {
      throw new Error('Fayl yuklanmadi');
    }

    console.log('Yuklandi, Telegramga yuborilmoqda...');

    await bot.sendVideo(chatId, filePath, {
      caption: options.caption || `<b>📍Reklama va obunasiz yuklandi ✅</b>`,
      parse_mode: 'HTML',
      ...options.reply_markup && { reply_markup: options.reply_markup },
      supports_streaming: true
    });

  } catch (err) {
    console.error('yt-dlp yuklash xatosi:', err.message);
    await bot.sendMessage(chatId, '❌ Video yuklab bo\'lmadi. Qayta urinib ko\'ring yoki boshqa havola yuboring.');
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = { downloadMedia, downloadAndSendVideo };
