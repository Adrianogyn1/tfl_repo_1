const cloudinary = require("cloudinary").v2;
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

// 1. Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 2. Configura Supabase Storage Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Upload de buffer para Cloudinary
 */
function uploadToCloudinary(buffer, folder = "avatars") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `tfl/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          provider: "cloudinary",
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload de buffer para Supabase Storage
 */
async function uploadToSupabase(buffer, filename, mimetype = "image/png", bucket = "avatars") {
  if (!supabase) throw new Error("Supabase não configurado.");
  const filePath = `${Date.now()}_${filename}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: mimetype, upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return {
    provider: "supabase",
    publicId: filePath,
    url: publicUrlData.publicUrl,
  };
}

/**
 * Upload Unificado com Failover / Multi-storage
 */
async function uploadMedia(file, folder = "avatars") {
  const extension = path.extname(file.originalname || "image.png");
  const randomName = `${crypto.randomBytes(8).toString("hex")}${extension}`;

  // Tenta Cloudinary primeiro; se falhar, tenta Supabase
  try {
    return await uploadToCloudinary(file.buffer, folder);
  } catch (errCloudinary) {
    console.warn("⚠️ Falha upload Cloudinary, tentando Supabase...", errCloudinary.message);
    try {
      return await uploadToSupabase(file.buffer, randomName, file.mimetype, folder);
    } catch (errSupabase) {
      console.error("❌ Erro em todos os provedores de storage:", errSupabase.message);
      throw new Error("Não foi possível realizar o upload da imagem em nenhum provedor.");
    }
  }
}

/**
 * Proxy de imagem: busca a imagem do storage original e serve diretamente via stream,
 * evitando expor as URLs do Cloudinary e Supabase para o cliente.
 */
async function streamMediaProxy(targetUrl, res) {
  try {
    const response = await axios({
      method: "GET",
      url: targetUrl,
      responseType: "stream",
      timeout: 10000,
    });
    res.setHeader("Content-Type", response.headers["content-type"] || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 dia de cache
    response.data.pipe(res);
  } catch (err) {
    console.error("Erro no stream proxy de imagem:", err.message);
    res.status(404).send("Imagem não encontrada");
  }
}

module.exports = {
  uploadMedia,
  uploadToCloudinary,
  uploadToSupabase,
  streamMediaProxy,
};
