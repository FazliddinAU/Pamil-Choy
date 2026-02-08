const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function getYouTubeMedia(url) {
  if (!ytdl.validateURL(url)) return { error: "Noto'g'ri URL" };

  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    });

    let format = ytdl.chooseFormat(info.formats, {
      filter: 'audioandvideo',
      quality: 'highestvideo'
    });

    if (!format) {
      format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    }

    if (!format) return { error: "Format topilmadi" };

    return {
      medias: [{
        url: format.url,
        quality: format.qualityLabel || '720p'
      }],
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0]?.url || ''
    };
  } catch (err) {
    console.error('ytdl xatosi:', err.message);
    return { error: "Yuklab bo'lmadi (video cheklangan yoki xato)" };
  }
}

async function downloadYouTubeVideo(url) {
  const filePath = path.join(os.tmpdir(), `yt_${Date.now()}.mp4`);

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo', quality: 'highest' });

    const stream = ytdl.downloadFromInfo(info, { format });
    stream.pipe(fs.createWriteStream(filePath));

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    return filePath;
  } catch {
    return null;
  }
}

module.exports = { getYouTubeMedia, downloadYouTubeVideo };
