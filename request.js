require('dotenv').config();
const axios = require('axios');

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
    console.error('❌ RapidAPI xatosi:', error.response?.data || error.message);
    return null;
  }
}

async function downloadYouTubeMedia(url) {
  const rawData = await downloadMedia(url);

  if (!rawData || !rawData.medias || rawData.medias.length === 0) {
    return rawData; 
  }

  const medias = rawData.medias || [];

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
    selectedMedia = medias.find(m => m.type === 'video' && !m.is_audio) || medias[0];
  }

  return {
    ...rawData,
    medias: selectedMedia ? [selectedMedia] : []
  };
}

module.exports = {
  downloadMedia,           
  downloadYouTubeMedia     
};
