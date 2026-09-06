const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { Op } = require("sequelize");
const repo = require("../../repository");

const tempUploadPath = path.join(__dirname, "../../uploads/temp");
if (!fs.existsSync(tempUploadPath)) {
  fs.mkdirSync(tempUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadPath);
  },
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/shop", (req, res) => GetAll(req, res));
router.get("/shop/home", (req, res) => GetIndex(req, res));
router.post("/shop/container", upload.any(), (req, res) =>
  SaveMaterial(req, res),
);

function GetIndex(req, res) {
  const filePath = path.join(__dirname, "../../paginas/shopUpload.html");
  res.sendFile(filePath);
}

async function GetAll(req, res) {
  try {
    const page = parseInt(req.query.pg) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const query = (req.query.q || "").trim();
    const offset = page * limit;

    const whereCondition = query
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } },
          ],
        }
      : {};

    const { count, rows } = await repo.ShopContainer.findAndCountAll({
      where: whereCondition,
      include: [{ model: repo.ItemResource, as: "items" }],
      limit: limit,
      offset: offset,
      order: [["id", "DESC"]],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}/files/shop`;

    const data = rows.map((row) => {
      const container = row.toJSON();

      if (container.thumb) {
        const formattedThumb = container.thumb.replace(/\\/g, "/");
        container.thumb = `${baseUrl}/${formattedThumb}`;
      } else {
        container.thumb = "";
      }

      if (Array.isArray(container.items)) {
        container.items = container.items.map((resItem) => {
          resItem.textures_paths = resItem.textures_paths || {};
          for (const key in resItem.textures_paths) {
            if (resItem.textures_paths[key]) {
              const formattedPath = resItem.textures_paths[key].replace(
                /\\/g,
                "/",
              );
              resItem.textures_paths[key] = `${baseUrl}/${formattedPath}`;
            }
          }
          resItem.values = resItem.values || {};
          resItem.colors = resItem.colors || {};
          resItem.ints = resItem.ints || {};
          resItem.bools = resItem.bools || {};
          resItem.strings = resItem.strings || {};
          resItem.vectors = resItem.vectors || {};
          return resItem;
        });
      }

      return container;
    });

    res.status(200).json({
      success: true,
      error: "",
      data: data,
      count: data.length,
      total: count,
      offset: offset,
      limit: limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

async function SaveMaterial(req, res) {
  try {
    const payload = JSON.parse(req.body.payload || "{}");
    const files = req.files || [];

    const moveFileToModelFolder = (file, modelName) => {
      if (!file) return null;
      const modelFolder = modelName
        ? modelName.replace(/[^a-zA-Z0-9_-]/g, "")
        : "default";
      const targetDir = path.join(__dirname, "../../uploads/shop", modelFolder);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, file.filename);
      fs.renameSync(file.path, targetPath);

      return path.join(modelFolder, file.filename).replace(/\\/g, "/");
    };

    // Captura a Thumbnail (enviada via FormData como 'mainImage')
    const mainImageFile = files.find((f) => f.fieldname === "mainImage");
    const firstItemModel =
      payload.items && payload.items[0] ? payload.items[0].model : "default";
    const thumbPath = moveFileToModelFolder(mainImageFile, firstItemModel);

    // Mapeia os arquivos de textura pelo fieldname `texture_{index}_{key}`
    const textureFilesMap = {};
    files
      .filter((f) => f.fieldname.startsWith("texture_"))
      .forEach((f) => {
        textureFilesMap[f.fieldname] = f;
      });

    const containerToCreate = {
      onnerId: payload.onnerId || 0,
      title: payload.title,
      price: payload.price,
      description: payload.description,
      thumb: thumbPath,
      sales: 0,
    };

    const createdContainer = await repo.ShopContainer.create(containerToCreate);

    if (Array.isArray(payload.items)) {
      const itemsToCreate = payload.items.map((resItem, index) => {
        const mappedTexturesPaths = {};

        if (resItem.textures_paths) {
          for (const key in resItem.textures_paths) {
            const fieldKey = `texture_${index}_${key}`;
            const fileObj = textureFilesMap[fieldKey];

            if (fileObj) {
              const savedRelativePath = moveFileToModelFolder(
                fileObj,
                resItem.model,
              );
              mappedTexturesPaths[key] = savedRelativePath;
            }
          }
        }

        return {
          containerId: createdContainer.id,
          model: resItem.model,
          slot: resItem.slot,
          shader: resItem.shader,
          values: resItem.values || {},
          colors: resItem.colors || {},
          ints: resItem.ints || {},
          bools: resItem.bools || {},
          strings: resItem.strings || {},
          vectors: resItem.vectors || {},
          textures_paths: mappedTexturesPaths,
        };
      });

      await repo.ItemResource.bulkCreate(itemsToCreate);
    }

    const fullCreated = await repo.ShopContainer.findByPk(createdContainer.id, {
      include: [{ model: repo.ItemResource, as: "items" }],
    });

    res.status(201).json({
      success: true,
      error: "",
      data: fullCreated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      data: null,
    });
  }
}

module.exports = {
  router,
  GetAll,
  SaveMaterial,
};
