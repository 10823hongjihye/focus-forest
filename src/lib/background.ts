const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE = 4 * 1024 * 1024;

export function readBackgroundFile(file: File): Promise<string> {
  if (!ACCEPT.includes(file.type)) {
    return Promise.reject(new Error('JPG, PNG, WEBP, GIF 이미지만 넣을 수 있어요.'));
  }
  if (file.size > MAX_FILE) {
    return Promise.reject(new Error('이미지는 4MB 이하만 넣을 수 있어요.'));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 처리하지 못했어요.'));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let quality = 0.72;
      let data = canvas.toDataURL('image/jpeg', quality);
      while (data.length > 900_000 && quality > 0.4) {
        quality -= 0.12;
        data = canvas.toDataURL('image/jpeg', quality);
      }
      if (data.length > 900_000) {
        reject(new Error('이미지가 너무 커요. 더 작은 사진을 선택해 주세요.'));
        return;
      }
      resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 열 수 없어요.'));
    };
    image.src = url;
  });
}
