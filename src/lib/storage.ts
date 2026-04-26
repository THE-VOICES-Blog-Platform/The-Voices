// Cloudinary image upload — no Firebase Storage needed
// Replace CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET with your values
// from https://cloudinary.com → Settings → Upload Presets (set to Unsigned)

const CLOUDINARY_CLOUD_NAME = 'daqik6bfn';
const CLOUDINARY_UPLOAD_PRESET = 'Voices';

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url as string;
};

// Upload a profile picture
export const uploadProfilePicture = async (_uid: string, file: File): Promise<string> => {
  return uploadToCloudinary(file);
};

// Upload an article cover image
export const uploadArticleImage = async (file: File): Promise<string> => {
  return uploadToCloudinary(file);
};
