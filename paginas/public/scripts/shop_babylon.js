let engine = null;
let scene = null;
let camera = null;
let previewMesh = null;

function getOrCreatePBRMaterial() {
    if (!previewMesh || !scene) return null;
    if (!(previewMesh.material instanceof BABYLON.PBRMaterial)) {
        previewMesh.material = new BABYLON.PBRMaterial("pbrMat", scene);
    }
    return previewMesh.material;
}

function applyTextureToChannel(file, channelKey) {
    const mat = getOrCreatePBRMaterial();
    if (!mat || !file) return;

    const textureUrl = URL.createObjectURL(file);
    const texture = new BABYLON.Texture(textureUrl, scene);
    const key = (channelKey || '').toLowerCase();

    if (key.includes('albedo') || key.includes('diffuse') || key.includes('main') || key.includes('base')) {
        mat.albedoTexture = texture;
    } else if (key.includes('normal') || key.includes('bump')) {
        mat.bumpTexture = texture;
    } else if (key.includes('roughness')) {
        mat.microSurfaceTexture = texture;
    } else if (key.includes('metallic') || key.includes('metal')) {
        mat.metallicTexture = texture;
    } else if (key.includes('ambient') || key.includes('ao')) {
        mat.ambientTexture = texture;
    } else {
        mat.albedoTexture = texture;
    }
}

function takeBabylonScreenshot() {
    if (!engine || !scene || !camera) return;
    BABYLON.Tools.CreateScreenshot(engine, camera, { precision: 1.0 }, function (data) {
        fetch(data)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `thumb_${selectedModelName || 'model'}.png`, { type: "image/png" });
                const container = new DataTransfer();
                container.items.add(file);
                
                const inputElement = document.getElementById('input-main-image');
                inputElement.files = container.files;
                $(inputElement).trigger('change');
            });
    });
}

function loadSelectedModel() {
    const item = MODELS.find(m => m.name === selectedModelName);
    if (!item || !item.modelFile) return;

    if (previewMesh) {
        previewMesh.dispose();
        previewMesh = null;
    }

    const lastIndex = item.modelFile.lastIndexOf('/');
    const rootUrl = item.modelFile.substring(0, lastIndex + 1);
    const sceneFilename = item.modelFile.substring(lastIndex + 1);

    BABYLON.SceneLoader.ImportMeshAsync("", rootUrl, sceneFilename, scene)
        .then(result => {
            previewMesh = BABYLON.Mesh.MergeMeshes(result.meshes, true, true, undefined, false, true);
            if (previewMesh && camera) {
                camera.target = previewMesh;
            }
        })
        .catch(err => {
            console.error("Erro ao carregar o modelo 3D:", err);
        });
}

function initBabylon() {
    const canvas = document.getElementById("babylon-canvas");
    if (!canvas) return;

    if (engine) engine.dispose();

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

    camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 3, 3, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.2;

    loadSelectedModel();

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}