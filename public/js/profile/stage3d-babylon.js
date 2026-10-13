/**
 * Palco Interativo 3D (Babylon.js WebGL + Container Godot Engine Web)
 * Renderiza um manequim 3D interativo no navegador com câmera orbital 360°,
 * iluminação de estúdio/neon, animações de aceno/dança e coroa VIP 3D.
 */
(function () {
  let engine = null;
  let scene = null;
  let avatarRoot = null;
  let rightArmPivot = null;
  let leftArmPivot = null;
  let vipCrownMesh = null;
  let studioLight = null;
  let neonLight1 = null;
  let neonLight2 = null;
  let isDancing = false;
  let isNeonMode = false;
  let animTime = 0;

  function initBabylonStage() {
    const canvas = document.getElementById("tflAvatarStage3dCanvas");
    if (!canvas || typeof BABYLON === "undefined") return;

    if (engine) {
      engine.resize();
      return;
    }

    try {
      engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.03, 0.04, 0.08, 1.0);

      // Câmera Orbital 360°
      const camera = new BABYLON.ArcRotateCamera(
        "avatarCam",
        -Math.PI / 2,
        Math.PI / 2.3,
        4.6,
        new BABYLON.Vector3(0, 1.05, 0),
        scene
      );
      camera.lowerRadiusLimit = 2.4;
      camera.upperRadiusLimit = 8.0;
      camera.wheelPrecision = 40;
      camera.attachControl(canvas, true);

      // Iluminação Base + Estúdio
      studioLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      studioLight.intensity = 0.95;

      neonLight1 = new BABYLON.PointLight("neonCyan", new BABYLON.Vector3(2.5, 2.5, -2.0), scene);
      neonLight1.diffuse = new BABYLON.Color3(0.0, 0.85, 1.0);
      neonLight1.intensity = 0.5;

      neonLight2 = new BABYLON.PointLight("neonPink", new BABYLON.Vector3(-2.5, 2.2, 2.0), scene);
      neonLight2.diffuse = new BABYLON.Color3(0.95, 0.2, 0.7);
      neonLight2.intensity = 0.4;

      // Plataforma / Pódio 3D
      const podium = BABYLON.MeshBuilder.CreateCylinder("podium", { diameter: 2.3, height: 0.14, tessellation: 48 }, scene);
      podium.position.y = 0.07;
      const podiumMat = new BABYLON.StandardMaterial("podiumMat", scene);
      podiumMat.diffuseColor = new BABYLON.Color3(0.08, 0.11, 0.18);
      podiumMat.emissiveColor = new BABYLON.Color3(0.02, 0.12, 0.25);
      podiumMat.specularColor = new BABYLON.Color3(0.3, 0.6, 0.9);
      podium.material = podiumMat;

      // Anel Luminoso no Pódio
      const ring = BABYLON.MeshBuilder.CreateTorus("ring", { diameter: 2.22, thickness: 0.04, tessellation: 64 }, scene);
      ring.position.y = 0.14;
      const ringMat = new BABYLON.StandardMaterial("ringMat", scene);
      ringMat.emissiveColor = new BABYLON.Color3(0.0, 0.75, 1.0);
      ring.material = ringMat;

      // Raiz do Avatar Humanoide 3D
      avatarRoot = new BABYLON.TransformNode("avatarRoot", scene);
      avatarRoot.position.y = 0.14;

      // Materiais do Avatar
      const skinMat = new BABYLON.StandardMaterial("skinMat", scene);
      skinMat.diffuseColor = new BABYLON.Color3(0.92, 0.74, 0.62);

      const topMat = new BABYLON.StandardMaterial("topMat", scene);
      topMat.diffuseColor = new BABYLON.Color3(0.14, 0.38, 0.85);
      topMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);

      const bottomMat = new BABYLON.StandardMaterial("bottomMat", scene);
      bottomMat.diffuseColor = new BABYLON.Color3(0.12, 0.15, 0.22);

      const shoeMat = new BABYLON.StandardMaterial("shoeMat", scene);
      shoeMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.98);

      // Pernas e Calçados
      const leftLeg = BABYLON.MeshBuilder.CreateCylinder("leftLeg", { diameterTop: 0.2, diameterBottom: 0.16, height: 0.75 }, scene);
      leftLeg.position = new BABYLON.Vector3(-0.16, 0.45, 0);
      leftLeg.material = bottomMat;
      leftLeg.parent = avatarRoot;

      const rightLeg = BABYLON.MeshBuilder.CreateCylinder("rightLeg", { diameterTop: 0.2, diameterBottom: 0.16, height: 0.75 }, scene);
      rightLeg.position = new BABYLON.Vector3(0.16, 0.45, 0);
      rightLeg.material = bottomMat;
      rightLeg.parent = avatarRoot;

      const leftShoe = BABYLON.MeshBuilder.CreateBox("leftShoe", { width: 0.2, height: 0.12, depth: 0.32 }, scene);
      leftShoe.position = new BABYLON.Vector3(-0.16, 0.06, 0.05);
      leftShoe.material = shoeMat;
      leftShoe.parent = avatarRoot;

      const rightShoe = BABYLON.MeshBuilder.CreateBox("rightShoe", { width: 0.2, height: 0.12, depth: 0.32 }, scene);
      rightShoe.position = new BABYLON.Vector3(0.16, 0.06, 0.05);
      rightShoe.material = shoeMat;
      rightShoe.parent = avatarRoot;

      // Torso (Jaqueta / Camisa 3D)
      const torso = BABYLON.MeshBuilder.CreateBox("torso", { width: 0.56, height: 0.68, depth: 0.3 }, scene);
      torso.position = new BABYLON.Vector3(0, 1.15, 0);
      torso.material = topMat;
      torso.parent = avatarRoot;

      // Cabeça
      const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.42, segments: 24 }, scene);
      head.position = new BABYLON.Vector3(0, 1.76, 0);
      head.material = skinMat;
      head.parent = avatarRoot;

      // Braços Articulados
      leftArmPivot = new BABYLON.TransformNode("leftArmPivot", scene);
      leftArmPivot.position = new BABYLON.Vector3(-0.36, 1.42, 0);
      leftArmPivot.parent = avatarRoot;

      const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", { diameter: 0.14, height: 0.62 }, scene);
      leftArm.position = new BABYLON.Vector3(0, -0.28, 0);
      leftArm.material = topMat;
      leftArm.parent = leftArmPivot;

      rightArmPivot = new BABYLON.TransformNode("rightArmPivot", scene);
      rightArmPivot.position = new BABYLON.Vector3(0.36, 1.42, 0);
      rightArmPivot.parent = avatarRoot;

      const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", { diameter: 0.14, height: 0.62 }, scene);
      rightArm.position = new BABYLON.Vector3(0, -0.28, 0);
      rightArm.material = topMat;
      rightArm.parent = rightArmPivot;

      // Coroa / Halo Dourado VIP (se o avatar for VIP)
      vipCrownMesh = BABYLON.MeshBuilder.CreateTorus("vipCrown", { diameter: 0.36, thickness: 0.045, tessellation: 32 }, scene);
      vipCrownMesh.position = new BABYLON.Vector3(0, 2.08, 0);
      const crownMat = new BABYLON.StandardMaterial("crownMat", scene);
      crownMat.diffuseColor = new BABYLON.Color3(1.0, 0.82, 0.15);
      crownMat.emissiveColor = new BABYLON.Color3(0.65, 0.45, 0.05);
      vipCrownMesh.material = crownMat;
      vipCrownMesh.parent = avatarRoot;
      vipCrownMesh.isVisible = Boolean(window.TFL_CONFIG && window.TFL_CONFIG.isVip);

      // Loop de Animação Suave (Respiração + Aceno/Dança + Coroa VIP)
      scene.registerBeforeRender(function () {
        animTime += engine.getDeltaTime() * 0.004;
        if (avatarRoot) {
          avatarRoot.position.y = 0.14 + Math.sin(animTime * 0.8) * 0.02;
          if (isDancing) {
            avatarRoot.rotation.y += 0.025;
            if (rightArmPivot) rightArmPivot.rotation.z = Math.PI * 0.65 + Math.sin(animTime * 3.5) * 0.35;
            if (leftArmPivot) leftArmPivot.rotation.z = -Math.PI * 0.25 + Math.cos(animTime * 3.5) * 0.25;
          } else {
            if (rightArmPivot) rightArmPivot.rotation.z = 0.12;
            if (leftArmPivot) leftArmPivot.rotation.z = -0.12;
          }
        }
        if (vipCrownMesh) {
          vipCrownMesh.isVisible = Boolean(window.TFL_CONFIG && window.TFL_CONFIG.isVip);
          vipCrownMesh.rotation.y += 0.03;
        }
      });

      engine.runRenderLoop(function () {
        if (scene) scene.render();
      });

      window.addEventListener("resize", function () {
        if (engine) engine.resize();
      });
    } catch (err) {
      console.warn("Aviso ao iniciar palco 3D Babylon:", err);
    }
  }

  $(document).ready(function () {
    // Inicializa quando abrir a aba de Avatares
    $(document).on("click", '.nav-item[data-view="view-avatar"]', function () {
      setTimeout(initBabylonStage, 120);
    });

    // Alternar entre Babylon.js 3D e Container Godot WebGL
    $(document).on("click", ".btn-stage3d-mode", function () {
      const mode = $(this).data("mode");
      $(".btn-stage3d-mode").removeClass("bg-cyan-600 text-white font-black").addClass("bg-slate-800 text-zinc-300 font-bold");
      $(this).removeClass("bg-slate-800 text-zinc-300 font-bold").addClass("bg-cyan-600 text-white font-black");

      if (mode === "godot") {
        $("#stage3dBabylonWrap").addClass("hidden");
        $("#stage3dGodotWrap").removeClass("hidden");
      } else {
        $("#stage3dGodotWrap").addClass("hidden");
        $("#stage3dBabylonWrap").removeClass("hidden");
        setTimeout(initBabylonStage, 60);
      }
    });

    // Botão Acenar / Dançar no Palco 3D
    $(document).on("click", "#btnStage3dActionWave", function () {
      initBabylonStage();
      isDancing = !isDancing;
      if (window.showToast) {
        window.showToast(
          isDancing ? "🕺 Animação 3D ativada no Palco!" : "Pose padrão restaurada no Palco 3D.",
          "info"
        );
      }
    });

    // Botão Alternar Luz Estúdio / Neon
    $(document).on("click", "#btnStage3dToggleLight", function () {
      initBabylonStage();
      isNeonMode = !isNeonMode;
      if (studioLight && neonLight1 && neonLight2) {
        studioLight.intensity = isNeonMode ? 0.35 : 0.95;
        neonLight1.intensity = isNeonMode ? 1.6 : 0.5;
        neonLight2.intensity = isNeonMode ? 1.4 : 0.4;
      }
      if (window.showToast) {
        window.showToast(
          isNeonMode ? "💡 Iluminação Cyberpunk Neon 3D ativada!" : "💡 Iluminação de Estúdio 3D ativada!",
          "info"
        );
      }
    });

    // Testar Sincronização da API por Token com o Container Godot
    $(document).on("click", "#btnTestGodotBridge", function () {
      $.get("/api/v1/account/overview")
        .done(function (res) {
          if (res && res.success) {
            if (window.showToast) {
              window.showToast(
                `🔌 Ponte API Token OK! Avatar #${res.activeAvatar?.id} (${res.activeAvatar?.name}) sincronizado com o Godot.`,
                "success"
              );
            }
          }
        })
        .fail(function (xhr) {
          if (window.showToast) {
            window.showToast(xhr.responseJSON?.error || "Erro ao testar ponte com o Godot.", "error");
          }
        });
    });
  });
})();
