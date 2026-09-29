const MAX_FILE_SIZE_MB = 34;

export async function uploadImageToImgBB(file: File): Promise<string | null> {
  const IMGBB_API_KEY = "b69e043c4eb87255aa74ed5449560976";

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    console.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max is ${MAX_FILE_SIZE_MB}MB.`);
    alert(`Image is too large! Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    return null;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      return data.data.url;
    } else {
      console.error("ImgBB upload failed:", data.error);
      return null;
    }
  } catch (err) {
    console.error("Error uploading to ImgBB:", err);
    return null;
  }
}
