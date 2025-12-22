export async function processImage(base64String: string): Promise<string> {
  try {
    // Check if it's already a data URL
    if (base64String.includes(';base64,')) {
      const [header, data] = base64String.split(';base64,');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64String);
          
          // Calculate new dimensions (max 1200x800)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;
          const maxHeight = 800;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        };
        
        img.onerror = () => resolve(base64String);
        img.src = base64String;
      });
    }
    
    return base64String;
  } catch (error) {
    console.error('Image processing error:', error);
    return base64String;
  }
}
