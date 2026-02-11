require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadMedia(url) {
  const options = {
    method: 'POST',
    url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: { url }
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('RapidAPI xatosi:', error.message);
    return null;
  }
}

async function downloadAndSendVideo(bot, chatId, media, options = {}) {
  const originalUrl = media.url || media; 

  if (!originalUrl || !originalUrl.includes('youtube.com') && !originalUrl.includes('youtu.be')) {
    await bot.sendMessage(chatId, '❌ Bu YouTube havolasi emas.');
    return;
  }

  try {
    let videoId;
    if (originalUrl.includes('/shorts/')) {
      videoId = originalUrl.split('/shorts/')[1]?.split('?')[0];
    } else if (originalUrl.includes('youtu.be/')) {
      videoId = originalUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (originalUrl.includes('v=')) {
      videoId = new URL(originalUrl).searchParams.get('v');
    }

    if (!videoId) {
      await bot.sendMessage(chatId, '❌ Video ID topilmadi.');
      return;
    }

    console.log('Yuklab olinmoqda (yangi API):', videoId);

    const apiOptions = {
      method: 'GET',
      url: `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_short/${videoId}`,
      params: { quality: '247' }, 
      headers: {
        'x-rapidapi-key': process.env.RAPID_API_KEY,
        'x-rapidapi-host': 'youtube-video-fast-downloader-24-7.p.rapidapi.com'
      }
    };

    const response = await axios.request(apiOptions);
    const data = response.data;

    console.log('API javobi:', data);

    if (data?.file) {
      await bot.sendVideo(chatId, data.file, {
        caption: options.caption || `<b>📍Reklama va obunasiz yuklandi ✅</b>`,
        parse_mode: 'HTML',
        ...options.reply_markup && { reply_markup: options.reply_markup },
        supports_streaming: true
      });
    } else if (data?.comment?.includes('soon be ready')) {
      await bot.sendMessage(chatId, 'Video tayyorlanmoqda... 30–120 soniya kutib, qayta urinib ko‘ring.');
    } else {
      await bot.sendMessage(chatId, '❌ Yuklashda xatolik yuz berdi. Qayta urinib ko‘ring.');
    }

  } catch (err) {
    console.error('Yuklash xatosi:', err.message);
    await bot.sendMessage(chatId, '❌ Video yuklab bo\'lmadi. Qayta urinib ko‘ring.');
  }
}



module.exports = { downloadMedia, downloadAndSendVideo };
