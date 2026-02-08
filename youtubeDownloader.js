// youtubeDownloader.js (yangi fayl)
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function getYouTubeMedia(url) {
  try {
    if (!ytdl.validateURL(url)) {
      return { error: "Noto'g'ri YouTube URL" };
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Eng yaxshi video format (720p yoki yuqori, audio bilan muxed)
    let format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',   // eng yuqori sifatli video
      filter: 'audioandvideo',   // audio + video birga bo'lishi kerak
    });

    if (!format) {
      // Agar muxed topilmasa, eng yaxshi videoni olamiz (keyin audio alohida)
      format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
    }

    if (!format) {
      return { error: "Mos format topilmadi" };
    }

    const medias = [{
      url: format.url,
      quality: format.qualityLabel || '720p',
      mimeType: format.mimeType,
      isDirect: true,  // to'g'ridan yuborish mumkin
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails?.[0]?.url || '',
    }];

    return {
      medias,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails?.[0]?.url,
    };

  } catch (err) {
    console.error('YouTube xatosi:', err.message);
    return { error: err.message.includes('Sign in') ? "YouTube cheklovi (kirish talab qilinishi mumkin)" : "Yuklab bo'lmadi" };
  }
}

// Agar serverda fayl yuklab yuborish kerak bo'lsa (Telegram cheklovi uchun)
async function downloadYouTubeVideo(url, chatId) {
  const fileName = `yt_${Date.now()}.mp4`;
  const filePath = path.join(os.tmpdir(), fileName);

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' });

    const stream = ytdl.downloadFromInfo(info, { format });

    await new Promise((resolve, reject) => {
      stream.pipe(fs.createWriteStream(filePath))
        .on('finish', resolve)
        .on('error', reject);
    });

    return filePath;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
