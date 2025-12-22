import sharp from 'sharp';
import { Buffer } from 'buffer';

export async function processImage(base64String: string): Promise<string> {
  try {
    // Remove data:image/...;base64, prefix if it exists
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Process image: resize, compress, and convert to webp
    const processedBuffer = await sharp(buffer)
      .resize(1200, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    
    // Convert back to base64
    const processedBase64 = processedBuffer.toString('base64');
    return `data:image/webp;base64,${processedBase64}`;
  } catch (error) {
    console.error('Image processing error:', error);
    // Return original if processing fails
    return base64String;
  }
}
