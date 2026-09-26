// Helper to extract a thumbnail frame (base64 JPEG) and video duration in the background
export const extractVideoMetadata = (streamUrl) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = streamUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    // Timeout in case loading/seeking stalls
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ thumbnailUrl: null, duration: null });
    }, 6000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
      try {
        video.load();
      } catch (e) {}
    };

    let duration = null;

    const onLoadedMetadata = () => {
      duration = video.duration;
      // Seek to 1 second or 5% of duration to avoid initial black frames
      const targetTime = Math.min(1.0, video.duration * 0.05 || 1.0);
      video.currentTime = targetTime;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          cleanup();
          resolve({ thumbnailUrl: dataUrl, duration });
        } else {
          cleanup();
          resolve({ thumbnailUrl: null, duration });
        }
      } catch (err) {
        console.error('Error drawing frame to canvas:', err);
        cleanup();
        resolve({ thumbnailUrl: null, duration });
      }
    };

    const onError = (e) => {
      console.error('Error loading video for thumbnail extraction:', video.error);
      cleanup();
      resolve({ thumbnailUrl: null, duration: null });
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    
    video.load();
  });
};

// Helper to resize a local image to a compact base64 JPEG thumbnail
export const extractImageMetadata = (streamUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ thumbnailUrl: null });
    }, 6000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };

    const onLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxWidth = 640;
        let width = img.naturalWidth || 640;
        let height = img.naturalHeight || 360;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          cleanup();
          resolve({ thumbnailUrl: dataUrl });
        } else {
          cleanup();
          resolve({ thumbnailUrl: null });
        }
      } catch (err) {
        console.error('Error drawing image to canvas:', err);
        cleanup();
        resolve({ thumbnailUrl: null });
      }
    };

    const onError = (e) => {
      console.error('Error loading image for thumbnail extraction:', e);
      cleanup();
      resolve({ thumbnailUrl: null });
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = streamUrl;
  });
};
