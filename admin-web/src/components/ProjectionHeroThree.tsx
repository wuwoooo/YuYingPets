import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { PresentationHero3D } from "./PresentationHero3D";
import "./ProjectionHeroThree.css";

type ProjectionHeroThreeProps = {
  className?: string;
};

// 颲�𨭌�賣㺭嚗𡁶��園𡺨颲曉�摨衣�蝵烐聢摨訫漣嚗�僎�滨蔭�嗆𦻖�園狍敶�
function makeRadarDisk() {
  const group = new THREE.Group();
  const ringGeometries: THREE.RingGeometry[] = [];
  const lineGeometries: THREE.BufferGeometry[] = [];

  const baseMaterial = new THREE.LineBasicMaterial({
    color: 0x1268b8,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // 1. �����
  const radii = [0.8, 1.4, 2.0];
  radii.forEach((r, idx) => {
    const geom = new THREE.RingGeometry(r - 0.015, r + 0.015, 64, 1);
    ringGeometries.push(geom);
    const lineMat = new THREE.MeshBasicMaterial({
      color: idx === 1 ? 0x1268b8 : 0x3ab7ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geom, lineMat);
    ring.rotation.x = Math.PI / 2;
    ring.receiveShadow = true; // �交𤣰�游蔣
    group.add(ring);
  });

  // 2. �曉��嗅�摨衣�蝥�
  const lineCount = 16;
  const positions: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
    const rStart = 1.4;
    const rEnd = 1.95;
    positions.push(
      Math.cos(angle) * rStart, 0, Math.sin(angle) * rStart,
      Math.cos(angle) * rEnd, 0, Math.sin(angle) * rEnd
    );
  }
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  lineGeometries.push(lineGeom);

  const lines = new THREE.LineSegments(lineGeom, baseMaterial);
  group.add(lines);

  return {
    group,
    dispose: () => {
      ringGeometries.forEach((g) => g.dispose());
      lineGeometries.forEach((g) => g.dispose());
      baseMaterial.dispose();
    },
  };
}

// 颲�𨭌�賣㺭嚗𡁶��鞉窒��𪂹摰��閫������舐�鈭烐㺭��
function createRuleRing(radius: number, count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorTemp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0; // 摰���典像�Ｖ�嚗䔶���僚
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    // �臭�皜𣂼�憸𡏭𠧧
    const ratio = i / count;
    colorTemp.setHSL(0.55 + ratio * 0.1, 0.95, 0.5 + Math.random() * 0.2);
    colors[i * 3] = colorTemp.r;
    colors[i * 3 + 1] = colorTemp.g;
    colors[i * 3 + 2] = colorTemp.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// 辅助函数：初始化黑客帝国高逼真数字雨 Canvas 引擎（高性能显式历史字符队列，清除堆积残影，确保超高清字迹下落）
function initRainCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let disposed = false;
  let frameId = 0;

  // 观察尺寸
  const resizeObserver = new ResizeObserver(() => {});
  resizeObserver.observe(canvas);

  const charPool = "0101XY89ABCDEFØZ7".split("");
  const fontSize = 10; // 调整为更精致小巧的 10px 字体
  const columnWidth = 16; // 铺满背景时，列宽设为 16px，大幅增加通道内的雨列密度

  interface RainCol {
    y: number;         // 头部行位置
    speed: number;     // 速度
    history: string[]; // 历史队列，长度缩短至 5
  }

  const rainCols: RainCol[] = [];
  let lastDrawTime = 0;

  const draw = (now: number) => {
    if (disposed) return;

    frameId = requestAnimationFrame(draw);

    // 控制渲染更新频率，大约 24 FPS (每隔 42ms 绘制一帧)
    if (now - lastDrawTime < 42) {
      return;
    }
    lastDrawTime = now;

    // 核心优化 1：动态根据屏幕物理 DPI 进行高清缩放，彻底消除任何拉伸压扁畸变！
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // 实际 CSS 盒子宽高
    const targetWidth = Math.round(rect.width) || 800;
    const targetHeight = Math.round(rect.height) || 400;

    // 对应的 Retina 屏物理像素宽高
    const pixelWidth = Math.round(targetWidth * dpr);
    const pixelHeight = Math.round(targetHeight * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    // 动态同步列数，适应大屏全宽背景
    const neededColumns = Math.ceil(targetWidth / columnWidth);
    while (rainCols.length < neededColumns) {
      const history: string[] = [];
      for (let h = 0; h < 5; h++) {
        history.push(charPool[Math.floor(Math.random() * charPool.length)]);
      }
      rainCols.push({
        y: Math.random() * -20, // 更加随机的起步高度
        speed: 0.28 + Math.random() * 0.42, // 稍微提升速度，使数字雨更加充沛流利
        history
      });
    }

    ctx.save();
    // 缩放上下文，使我们之后的绘图坐标可以直接使用标准的 CSS 逻辑像素坐标！
    ctx.scale(dpr, dpr);

    // 每次改变像素尺寸后必须重新配置字体状态，否则 canvas 状态会重置
    ctx.font = `bold ${fontSize}px Consolas, Monaco, Courier, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 核心优化 2：彻底擦除 Canvas，确保底色 100% 透明无残留
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    const isOutdoor = document.querySelector(".projection-theme-outdoor") !== null;

    // 避让区精细定义：
    // 1. 中间 32% - 68% 避开 3D 模型与文字公转轨道
    // 2. 左右两侧卡片遮挡区各 205px 避开半透明卡片文字重叠
    let midStart = targetWidth * 0.32;
    let midEnd = targetWidth * 0.68;
    let leftLimit = 205;
    let rightLimit = 205;

    // 兼容小屏大屏适配，当宽度不足时自动缩减避让边界，防止无雨可下
    if (targetWidth < 768) {
      leftLimit = 80;
      rightLimit = 80;
      midStart = targetWidth * 0.35;
      midEnd = targetWidth * 0.65;
    }

    for (let i = 0; i < neededColumns; i++) {
      const col = rainCols[i];
      if (!col) continue;

      // 每一列在 X 轴上居中摆放
      const x = i * columnWidth + columnWidth / 2;

      // 精细化避障检测：如果处于左侧卡片后、右侧卡片后，或者正中间的 3D 反应堆后，都跳过绘制
      const isInLeftCard = x <= leftLimit;
      const isInRightCard = x >= targetWidth - rightLimit;
      const isInCenterModel = x >= midStart && x <= midEnd;

      if (isInLeftCard || isInRightCard || isInCenterModel) {
        col.y += col.speed;
        if ((col.y - col.history.length) * (fontSize + 3) > targetHeight) {
          col.y = Math.random() * -8;
          col.speed = 0.28 + Math.random() * 0.42;
          for (let h = 0; h < col.history.length; h++) {
            col.history[h] = charPool[Math.floor(Math.random() * charPool.length)];
          }
        }
        continue;
      }

      // 字符跳变控制：头部 20% 跳变，尾部仅 3% 概率在下落中原地闪变，克制而不刺眼
      if (Math.random() < 0.20) {
        col.history[0] = charPool[Math.floor(Math.random() * charPool.length)];
      }
      for (let h = 1; h < col.history.length; h++) {
        if (Math.random() < 0.03) {
          col.history[h] = charPool[Math.floor(Math.random() * charPool.length)];
        }
      }

      // 缩短后的 5 深度衰减透明度，尾迹更加精简秀丽
      const opacities = [1.0, 0.70, 0.42, 0.20, 0.06];
      for (let h = 0; h < col.history.length; h++) {
        const charY = (col.y - h) * (fontSize + 3);
        if (charY > 0 && charY < targetHeight + fontSize) {
          const baseOpacity = opacities[h];
          
          if (h === 0 && Math.random() < 0.15) {
            // 头部有 15% 概率高亮
            ctx.fillStyle = isOutdoor ? "rgba(5, 53, 122, 1.0)" : "rgba(255, 255, 255, 1.0)";
          } else {
            if (isOutdoor) {
              // 户外模式：根据透明度衰减，使用深蓝色
              ctx.fillStyle = `rgba(5, 53, 122, ${baseOpacity * 0.95})`;
            } else {
              // 室内模式：根据透明度衰减，使用青蓝色
              ctx.fillStyle = `rgba(0, 243, 255, ${baseOpacity})`;
            }
          }

          ctx.fillText(col.history[h], x, charY);
        }
      }

      // 每一帧下落更新
      col.y += col.speed;

      // 越界重置
      if ((col.y - col.history.length) * (fontSize + 3) > targetHeight) {
        col.y = Math.random() * -8; // 随机的起步高度
        col.speed = 0.28 + Math.random() * 0.42; // 重新计算速度
        for (let h = 0; h < col.history.length; h++) {
          col.history[h] = charPool[Math.floor(Math.random() * charPool.length)];
        }
      }
    }

    ctx.restore();
  };

  frameId = requestAnimationFrame(draw);

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
  };
}

// 颲�𨭌�賣㺭嚗𡁶��嗯�𡏭��婢I�嘥�摮㛖�擃睃笆瘥𥪜漲 3D 瘚桃征蝡衤�摮堒�嚗䔶蝙�典�撅� Plane嚗��摮�+�讐蔭�游蔣嚗㕑𨯫�䭾楛���蝛粹𡢿閫�榆銝𡒊�雿𤘪�
function createSingleCharSprite(char: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 128, 128);
  ctx.font = "bold 82px 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // �桅�𡁏�颲對��其�����砌��滚榆
  ctx.strokeStyle = "rgba(4, 20, 50, 0.8)";
  ctx.lineWidth = 8;
  ctx.strokeText(char, 64, 64);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(char, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // 1. 甇�𢒰�砌��鞱捶 (擃睃笆瘥𥪜漲�賢�/�穃�摮�)
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // 2. �𡡞𢒰�游蔣�鞱捶 (瘛梯𠧧蝖祆�敶梧��其��冽�摨訫�瘛勗�銝𠰴�頧桀���氖嚗���删�雿栞�撌�)
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending, // �游蔣雿輻鍂甇�虜瘛瑕�嚗𣬚鍂�仿��∟��荔�隞舘�峕��游撩�𡝗�摮埈𧋦頨怎�皜�苊摨�
    color: 0x031220,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.PlaneGeometry(0.85, 0.85);
  
  // �𥕦遣銝�銝芸��函�隞亙�鋆����� Plane
  const group = new THREE.Group();

  // �訫蔣 Plane (蝔滚凝敺��喃��讐蔭嚗�僎敺桅����)
  const meshShadow = new THREE.Mesh(geometry, shadowMaterial);
  meshShadow.position.set(0.024, -0.024, -0.015);
  group.add(meshShadow);

  // 銝餃� Plane (蝔滚凝�典�嚗�耦�鞟�����㰘�撌�)
  const meshFront = new THREE.Mesh(geometry, frontMaterial);
  meshFront.position.set(0, 0, 0.012);
  group.add(meshFront);
  
  return { mesh: group, frontMaterial, shadowMaterial, texture, geometry };
}

export function ProjectionHeroThree({ className }: ProjectionHeroThreeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // �噼� Ref 餈質葵嚗䔶�霂�銁 DOM ��蝸��遙雿閙𧒄�粹��� 100% �𣂼�閫血��嘥��吔�閫��擐硋葷銝� null ���頧賣𧒄�� Bug
  const rainCleanupRef = useRef<(() => void) | null>(null);
  const rainDOMRef = useRef<HTMLCanvasElement | null>(null);

  const rainCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    rainDOMRef.current = canvas;
    if (rainCleanupRef.current) {
      rainCleanupRef.current();
      rainCleanupRef.current = null;
    }
    if (canvas) {
      rainCleanupRef.current = initRainCanvas(canvas);
    }
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    let disposed = false;
    let frameId = 0;
    let textAngle = 0;
    let lastTime = 0;



    // 韏��皜���𡑒”
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    let envRenderTarget: THREE.WebGLRenderTarget | null = null;
    let radarResourcesCleanup: () => void = () => {};

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglFailed(true);
      return undefined;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // ���� 撘��臬��嗆��屸狍敶� ����
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xeaf5ff, 0.038);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.85, 6.8);
    camera.lookAt(0, 0.1, 0);

    const root = new THREE.Group();
    root.rotation.x = -0.15;
    root.position.y = 0.38; // �港�銝羓宏�砍�嚗�銁撅誩�摨閧�銝𧢲䲮�曉枂�𨀣�瘚株��啣躹�萘�閫���嗵蒾
    scene.add(root);

    // ���� PMREM �冽��㴓憓�斐�曄��𣂼膥 ����
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // 撱箇�銝�銝芸��脤�鈭桀��厩㴓憓�䔉�𡁜�撠��嚗𣬚��条縧���撠�捶��
    const tempScene = new THREE.Scene();
    const sphereGeomTemp = new THREE.SphereGeometry(0.3, 8, 8);
    const matA = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const matB = new THREE.MeshBasicMaterial({ color: 0xff8c00 });
    const matC = new THREE.MeshBasicMaterial({ color: 0x9c27b0 });
    const mA = new THREE.Mesh(sphereGeomTemp, matA); mA.position.set(0.8, 0.5, -0.5); tempScene.add(mA);
    const mB = new THREE.Mesh(sphereGeomTemp, matB); mB.position.set(-0.8, -0.5, 0.5); tempScene.add(mB);
    const mC = new THREE.Mesh(sphereGeomTemp, matC); mC.position.set(0, 0.8, 0.8); tempScene.add(mC);

    envRenderTarget = pmremGenerator.fromScene(tempScene);
    scene.environment = envRenderTarget.texture;

    // 皜�����銝湔𧒄韏��
    sphereGeomTemp.dispose();
    matA.dispose();
    matB.dispose();
    matC.dispose();
    pmremGenerator.dispose();

    // ���� �㗇�霈曄蔭銝𡡞狍敶望�撠� ����
    const ambient = new THREE.AmbientLight(0x00f3ff, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0x7ee7ff, 6, 12);
    keyLight.position.set(2, 3, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0025;
    scene.add(keyLight);

    const goldLight = new THREE.PointLight(0xffa726, 3, 10);
    goldLight.position.set(-2, -1, 2);
    goldLight.castShadow = true;
    goldLight.shadow.mapSize.width = 1024;
    goldLight.shadow.mapSize.height = 1024;
    goldLight.shadow.camera.near = 0.5;
    goldLight.shadow.camera.far = 15;
    goldLight.shadow.bias = -0.0025;
    scene.add(goldLight);

    // ���� 1. �冽��瑁噢摨閧� ����
    const radar = makeRadarDisk();
    radar.group.position.y = -1.35;
    root.add(radar.group);
    radarResourcesCleanup = radar.dispose;

    // ���� 2. �屸��冽���摮𣂷�蝥踵��毺㴓 (蝥踵辺�啁眏 3 �譍蛹 2嚗䔶誑雿踹�閫�凒銝箸��賢⏚��) ����
    const orbitGroup = new THREE.Group();
    root.add(orbitGroup);

    const ringConfigs = [
      { radius: 2.25, count: 180, color: new THREE.Color("#00e5ff"), tilt: [1.15, 0.15, 0] },
      { radius: 3.00, count: 280, color: new THREE.Color("#ffb300"), tilt: [1.15, 0.15, 0] }
    ];

    const rings = ringConfigs.map((config) => {
      const geom = createRuleRing(config.radius, config.count);
      geometries.push(geom);

      // A. 閫�����雿梶瑪獢�㴓 (LineLoop)
      const lineMat = new THREE.LineBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materials.push(lineMat);
      const lineLoop = new THREE.LineLoop(geom, lineMat);
      lineLoop.rotation.set(config.tilt[0], config.tilt[1], config.tilt[2]);
      orbitGroup.add(lineLoop);

      // B. 閫������函�鈭𤑳�摮� (Points)
      const pointMat = new THREE.PointsMaterial({
        size: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materials.push(pointMat);
      const points = new THREE.Points(geom, pointMat);
      points.rotation.set(config.tilt[0], config.tilt[1], config.tilt[2]);
      orbitGroup.add(points);

      return { lineLoop, points, pointMat, lineMat, config };
    });

    // ���� 3. �誩��朞�蝎鍦��瑟�蝟餌� ����
    const jetCount = 280;
    const jetGeometry = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetCount * 3);
    const jetColors = new Float32Array(jetCount * 3);

    const jetSpeeds = new Float32Array(jetCount);
    const jetBaseRadii = new Float32Array(jetCount);
    const jetAngles = new Float32Array(jetCount);

    const jetColorA = new THREE.Color("#00eeff");
    const jetColorB = new THREE.Color("#ffd54f");

    for (let i = 0; i < jetCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 1.6;
      const y = -1.35 - Math.random() * 1.2;

      jetPositions[i * 3] = Math.cos(angle) * radius;
      jetPositions[i * 3 + 1] = y;
      jetPositions[i * 3 + 2] = Math.sin(angle) * radius;

      jetSpeeds[i] = 0.012 + Math.random() * 0.018;
      jetBaseRadii[i] = radius;
      jetAngles[i] = angle;

      const baseCol = i % 3 === 0 ? jetColorB : jetColorA;
      const finalCol = baseCol.clone().multiplyScalar(0.7 + Math.random() * 0.4);
      jetColors[i * 3] = finalCol.r;
      jetColors[i * 3 + 1] = finalCol.g;
      jetColors[i * 3 + 2] = finalCol.b;
    }

    jetGeometry.setAttribute("position", new THREE.BufferAttribute(jetPositions, 3));
    jetGeometry.setAttribute("color", new THREE.BufferAttribute(jetColors, 3));
    geometries.push(jetGeometry);

    const jetMaterial = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(jetMaterial);

    const jetPoints = new THREE.Points(jetGeometry, jetMaterial);
    root.add(jetPoints);

    // ���� 4. 擃条漣�拍�韐冽��峕瓲敹� (���憓𧼮之嚗𣬚宏�文蒂撠𤥁�蝞剖仍����孵��函瑪獢�) ����
    const coreGroup = new THREE.Group();
    root.add(coreGroup);

    // A. 憭㚚�嚗𡁜�蝢𡒊�頞��蝏��摨血����憯� (�𠰴�隞� 1.35 �拙之�� 1.55)
    const outerCoreGeom = new THREE.SphereGeometry(1.55, 64, 64);
    geometries.push(outerCoreGeom);
    const outerCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0x095cd6,
      emissive: 0x002288,
      emissiveIntensity: 0.8,
      metalness: 0.1, // �滢��穃�摨佗��踹�擃㗛�撅𧼮漲�滚�憭㚚��堒�鈭抒�暺𤏸器
      roughness: 0.12,
      transparent: true,
      opacity: 0.45,
      transmission: 0.72,
      thickness: 1.0, // ��漲�滢��𡁜漲嚗��撠烐�撠��䭾���器蝻䀹�颲�
      ior: 1.48, // 靚�㟲�睃���秐�渲䌊�嗥��餌����嚗屸��滩�摨行�撠�
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      // �駁膄 DoubleSide嚗���𤩺��餌�皜脫��閖𢒰�湔遬�𡁻�𧶏�銝𥪯�隡𡁜��屸𢒰�滚�撖潸稲�脫�撠磰器蝻睃�暺�
    });
    materials.push(outerCoreMat);
    const outerCoreMesh = new THREE.Mesh(outerCoreGeom, outerCoreMat);
    outerCoreMesh.castShadow = true;
    outerCoreMesh.receiveShadow = false; // �餌�憭硋ㄢ銝滚��交𤣰�游蔣嚗屸俈甇Ｖ漣�罸狍敶梢���
    coreGroup.add(outerCoreMesh);

    // [DELETE] ��𧋦��ㄨ�典�����寞ㄠ閫垍瑪獢� (boxWireframe) 撌脰◤敶餃�蝘駁膄嚗諹圾�喃��𨅯蒂蝞剖仍蝥蹂�蝏𤑳����萘�閫����僚�麄��

    // C. ���嚗𡁏瓲�質��匧������ (�𠰴�隞� 0.6 �拙之�� 0.7)
    const innerCoreGeom = new THREE.SphereGeometry(0.7, 48, 48);
    geometries.push(innerCoreGeom);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(innerCoreMat);
    const innerCoreMesh = new THREE.Mesh(innerCoreGeom, innerCoreMat);
    innerCoreMesh.receiveShadow = true;
    coreGroup.add(innerCoreMesh);

    // ���� 5. �冽��急�瞈��厩㴓 ����
    const scanRingGeom = new THREE.RingGeometry(1.70, 1.75, 32); // �滚�����睃之嚗峕醌�𤩺��厩㴓�𠰴��詨�敺株�憭�
    geometries.push(scanRingGeom);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push(scanRingMat);
    const scanRing = new THREE.Mesh(scanRingGeom, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    root.add(scanRing);

    // ���� 6. �𡏭��婢I�� 3D 撘抒𠶖�舐����蝏�辣 (�訫����嚗諹斐����Ｗ���) ����
    const textOrbitGroup = new THREE.Group();
    root.add(textOrbitGroup);

    const chars = ["��", "��", "A", "I"];
    const textSpritesData: Array<{
      sprite: THREE.Group;
      frontMaterial: THREE.MeshBasicMaterial;
      shadowMaterial: THREE.MeshBasicMaterial;
      texture: THREE.Texture;
      angleOffset: number;
    }> = [];

    // �芸�銋匧�銝芸�蝚血銁��𪂹頧券�銝羓�撘批漲�讐宏嚗����㘚����嚗�
    // �𡏭��嘥��𡏭㘚�嗪𡢿頝苷蛹 0.40嚗𢞖�𡏭㘚�嘥��𦯷�嗪𡢿頝苷蛹 0.40嚗��撘�銝�撠讐�隞亥�撅閙�摮梹�嚗𥡝�𢞖�𦯷�嘥��𦔒�嗪𡢿頝苷蛹 0.26嚗��餈睲�撠讐�雿輯㘚���瘥齿㟲雿𤘪��游末嚗�
    const angleOffsets = [-0.60, -0.20, 0.20, 0.46];
    const textRadius = 1.68; // 蝝扯斐����讐蔭 (���敺�蛹 1.55)

    chars.forEach((char, index) => {
      const result = createSingleCharSprite(char);
      if (result) {
        const { mesh, frontMaterial, shadowMaterial, texture, geometry } = result;
        textures.push(texture);
        materials.push(frontMaterial);
        materials.push(shadowMaterial);
        geometries.push(geometry); // �墧𤣰 Plane �牐�雿�

        // 霈∠�撅��典��典����雿踹�隞交�摮𦯀葉頧游摩�脫�撣��敶Ｘ�摰𣬚���㴓敶Ｙ����摮烾曎嚗�
        const angleOffset = angleOffsets[index];
        mesh.position.set(
          textRadius * Math.sin(angleOffset),
          0,
          textRadius * Math.cos(angleOffset)
        );
        
        // �喲睸�拍��嘥�嚗朞悟 Plane �Ｘ�蝥踵��𤑳�憭碶儒嚗諹��琿��祈蓮�贝蓮�嗡儒�Ｖ�鈭抒��讛�蝻拍�嚗峕�蝏� Sprite 靘折𢒰�滚� Bug嚗�
        mesh.rotation.y = angleOffset;

        textOrbitGroup.add(mesh);
        textSpritesData.push({
          sprite: mesh,
          frontMaterial,
          shadowMaterial,
          texture,
          angleOffset
        });
      }
    });



    // ���� 7. �剖遣 EffectComposer �擧�颲匧�憭��蝞∠瑪 ����
    const size = new THREE.Vector2();
    renderer.getSize(size);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      1.2,
      0.6,
      0.35
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // ���� 憿菟𢒰 Resize ��� ����
    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    // ���� 銝駁��滩𠧧銝舘��匧��啣𢆡��像皛� Lerp �鍦�� ����
    const clock = new THREE.Clock();
    
    // 銝駁�餈�腹�嗆����啁𤌍��
    const themeTransition = {
      ambientColor: new THREE.Color(),
      ambientIntensity: 0.8,
      keyLightColor: new THREE.Color(),
      goldLightColor: new THREE.Color(),
      coreColor: new THREE.Color(),
      coreEmissive: new THREE.Color(),
      coreEmissiveIntensity: 0.6,
      innerColor: new THREE.Color(),
      fogColor: new THREE.Color(),
      radarOpacity: 0.25,
      scanRingColor: new THREE.Color(),
      // 颲匧���㺭�格�
      bloomStrength: 1.2,
      bloomThreshold: 0.35,
      // 蝎鍦�擃睃�撌桀�蝎烾�蝵�
      ringPointSize: 0.035,
      jetPointSize: 0.038,
      ringPointOpacity: 0.65,
      jetPointOpacity: 0.9,
      // 憭𡝗瓲�餌��拍�撅墧�折�蝵�
      glassOpacity: 0.45,
      glassRoughness: 0.12,
      glassThickness: 1.6,
      // �急�瞈��劐����撅墧��
      scanRingOpacity: 0.7,
      textColor: new THREE.Color(),
    };

    const animate = () => {
      if (disposed) return;

      const elapsed = clock.getElapsedTime();
      const delta = elapsed - lastTime;
      lastTime = elapsed;
      const safeDelta = Math.min(delta, 0.1);

      // 璉�瘚𧢲�憭𡝗芋撘�
      const isOutdoor = document.querySelector(".projection-theme-outdoor") !== null;

      // 1. 霈曄蔭銝滚�璅∪�銝讠��鍦�潛𤌍��
      if (isOutdoor) {
        themeTransition.ambientColor.setHex(0xffffff);
        themeTransition.ambientIntensity = 1.65;
        themeTransition.keyLightColor.setHex(0x0a3d6b); 
        themeTransition.goldLightColor.setHex(0xc07800);
        themeTransition.coreColor.setHex(0x0a5cd6); // �瑕�銝衤���滲甇���漁銝賜�摰肽��莎��脫迫�滚��煾�
        themeTransition.coreEmissive.setHex(0x002288); // 摰肽��脰䌊�穃��睃�
        themeTransition.coreEmissiveIntensity = 0.55; 
        themeTransition.innerColor.setHex(0xd48500); 
        themeTransition.fogColor.setHex(0xe8eef5); 
        themeTransition.radarOpacity = 0.5;
        themeTransition.scanRingColor.setHex(0x0a4a7a);
        themeTransition.scanRingOpacity = 0.9;
        themeTransition.textColor.setHex(0xffffff); // 鈭桀�嚗𡁶蒾摮埈𨰹�� Canvas �讛器

        // �瑕�擃䀹��堆�蝎鍦��删� 3 �滢誑銝𠰴僎摰硺��吔�蝏苷�蝔���
        themeTransition.ringPointSize = 0.12;
        themeTransition.jetPointSize = 0.11;
        themeTransition.ringPointOpacity = 1.0;
        themeTransition.jetPointOpacity = 1.0;

        // �餌��睃�嚗𣬚ㄗ���憓𧼮捐嚗峕䲮靘輸��滚��閙�
        themeTransition.glassOpacity = 0.90;
        themeTransition.glassRoughness = 0.35;
        themeTransition.glassThickness = 2.5;

        // 瘚�𠧧�峕艶銝衤���閬���删憧蝻���㗇�
        themeTransition.bloomStrength = 0.18;
        themeTransition.bloomThreshold = 0.95;
      } else {
        themeTransition.ambientColor.setHex(0x00a2ff); // �𥪜�銝��寧��坿���
        themeTransition.ambientIntensity = 0.55;       // �滢��臬��㚁�霈� 3D �詨�撖寞�摨行凒擃�
        themeTransition.keyLightColor.setHex(0x00d2ff); // �滢�銝餃�皞鞱𠧧靚�撩摨�
        themeTransition.goldLightColor.setHex(0xd48500); // �滢��𤏸𠧧颲�𨭌�㗇�
        themeTransition.coreColor.setHex(0x095cd6); 
        themeTransition.coreEmissive.setHex(0x001a66); // �滢��芸��厩��脣蔗鈭桀��
        themeTransition.coreEmissiveIntensity = 0.75;  // �滢�憭抒��芸��匧撩摨佗��脫迫������餈��
        themeTransition.innerColor.setHex(0xff0066); 
        themeTransition.fogColor.setHex(0x020810);     // �亙凝靚���暹�摨閗𠧧
        themeTransition.radarOpacity = 0.28;
        themeTransition.scanRingColor.setHex(0x00d2ff); // �急��舀揢�冽��屸���
        themeTransition.scanRingOpacity = 0.65;
        themeTransition.textColor.setHex(0x00f3ff); 

        themeTransition.ringPointSize = 0.045;
        themeTransition.jetPointSize = 0.045;
        themeTransition.ringPointOpacity = 0.75;
        themeTransition.jetPointOpacity = 0.95;

        themeTransition.glassOpacity = 0.50;
        themeTransition.glassRoughness = 0.12;
        themeTransition.glassThickness = 1.6;

        themeTransition.bloomStrength = 0.85; // 颲匧�撘箏漲�� 1.6 憭批��滩秐 0.85嚗峕��斗��匧��潭�
        themeTransition.bloomThreshold = 0.24; // 颲匧����潛眏 0.15 ��秐 0.24嚗䔶�霈抵�擃䀝漁憭�漣�毺移�游凝��
      }

      // 2. 撟單�餈�腹��㺭 (Lerp �餃側�笔漲 0.04)
      ambient.color.lerp(themeTransition.ambientColor, 0.04);
      ambient.intensity = THREE.MathUtils.lerp(ambient.intensity, themeTransition.ambientIntensity, 0.04);
      keyLight.color.lerp(themeTransition.keyLightColor, 0.04);
      goldLight.color.lerp(themeTransition.goldLightColor, 0.04);
      
      outerCoreMat.color.lerp(themeTransition.coreColor, 0.04);
      outerCoreMat.emissive.lerp(themeTransition.coreEmissive, 0.04);
      outerCoreMat.emissiveIntensity = THREE.MathUtils.lerp(outerCoreMat.emissiveIntensity, themeTransition.coreEmissiveIntensity, 0.04);
      outerCoreMat.opacity = THREE.MathUtils.lerp(outerCoreMat.opacity, themeTransition.glassOpacity, 0.04);
      outerCoreMat.roughness = THREE.MathUtils.lerp(outerCoreMat.roughness, themeTransition.glassRoughness, 0.04);
      outerCoreMat.thickness = THREE.MathUtils.lerp(outerCoreMat.thickness, themeTransition.glassThickness, 0.04);

      innerCoreMat.color.lerp(themeTransition.innerColor, 0.04);
      scanRingMat.color.lerp(themeTransition.scanRingColor, 0.04);
      scanRingMat.opacity = THREE.MathUtils.lerp(scanRingMat.opacity, themeTransition.scanRingOpacity, 0.04);

      // �冽��凒�啣�摮堒憫�� 3D ������蝏�辣����脣��𤩺�摨佗�霈拇迤�Ｗ�蝖祆�敶望�韐函𡠺蝡𧢲���
      textSpritesData.forEach((item) => {
        item.frontMaterial.color.lerp(themeTransition.textColor, 0.04);
        
        // �訫蔣�游蔣憸𡏭𠧧�鍦�潘��瑕�璅∪�銝衤蛹��楛�嗪��脖誑靽肽��賢�颲寧�嚗峕��脫芋撘譍�銝箇滲暺煾�蝵�
        const targetShadowColor = new THREE.Color(isOutdoor ? 0x031220 : 0x000105);
        item.shadowMaterial.color.lerp(targetShadowColor, 0.04);

        // 霈∠�霂亙�敶枏��其��𣬚征�港����頧祈�摨�
        const curAngle = textOrbitGroup.rotation.y + item.angleOffset;
        const cosVal = Math.cos(curAngle);

        // 甇�𢒰 (cosVal=1) �𤩺�摨� 1.0嚗䔶儒�� (cosVal=0) �𤩺�摨� 0.15 (瘛∪��脩忽璅�)嚗諹��� (cosVal=-1) �𤩺�摨� 0.45 (�讛�憭抒��餌��睃�)
        let opacityFactor = 0.15;
        if (cosVal > 0) {
          opacityFactor = 0.15 + 0.85 * Math.pow(cosVal, 1.8);
        } else {
          opacityFactor = 0.15 + 0.30 * Math.pow(-cosVal, 1.5);
        }
        const baseOpacity = isOutdoor ? 1.0 : 0.95;
        
        // 甇�𢒰����𤩺�摨�
        item.frontMaterial.opacity = baseOpacity * opacityFactor;
        // �訫蔣蝖祇狍敶梁��𤩺�摨西���
        item.shadowMaterial.opacity = baseOpacity * opacityFactor * 0.72;
      });



      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(themeTransition.fogColor, 0.04);
        const targetDensity = isOutdoor ? 0.002 : 0.038;
        scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetDensity, 0.04);
      }

      // �冽��凒�啁�摮𣂷�蝥踵�撅墧�� (�冽�憭𡝗芋撘譍�撠�瑪獢��𤩺�摨行�擃睃� 0.85嚗𣬚�摮𣂼�蝎梹���之憓𧼮撩撖寞�摨�)
      rings.forEach((ring, idx) => {
        ring.pointMat.size = THREE.MathUtils.lerp(ring.pointMat.size, themeTransition.ringPointSize, 0.05);
        ring.pointMat.opacity = THREE.MathUtils.lerp(ring.pointMat.opacity, themeTransition.ringPointOpacity, 0.05);
        ring.lineMat.opacity = THREE.MathUtils.lerp(ring.lineMat.opacity, isOutdoor ? 0.85 : 0.45, 0.04);
      });
      jetMaterial.size = THREE.MathUtils.lerp(jetMaterial.size, themeTransition.jetPointSize, 0.05);
      jetMaterial.opacity = THREE.MathUtils.lerp(jetMaterial.opacity, themeTransition.jetPointOpacity, 0.05);

      bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, themeTransition.bloomStrength, 0.04);
      bloomPass.threshold = THREE.MathUtils.lerp(bloomPass.threshold, themeTransition.bloomThreshold, 0.04);

      radar.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, isOutdoor ? 0.52 : 0.28, 0.04);
        }
        if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, isOutdoor ? 0.38 : 0.18, 0.04);
        }
      });

      // 3. �冽��凒�圈�摮鞱��賜�摮𣂼𪃾瘚��蝵� (CPU 霈∠�)
      const positions = jetGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < jetCount; i++) {
        let y = positions[i * 3 + 1];
        y += jetSpeeds[i];

        const progress = Math.max(0, Math.min(1, (y + 1.35) / 1.35));
        const shrinkFactor = 1.0 - Math.pow(progress, 2.2);
        
        jetAngles[i] += 0.012;
        const radius = jetBaseRadii[i] * shrinkFactor;

        positions[i * 3] = Math.cos(jetAngles[i]) * radius;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(jetAngles[i]) * radius;

        if (y > 0.4 || radius < 0.04) {
          y = -1.35 - Math.random() * 0.6;
          jetAngles[i] = Math.random() * Math.PI * 2;
          jetBaseRadii[i] = 0.6 + Math.random() * 1.6;
          positions[i * 3 + 1] = y;
        }
      }
      jetGeometry.attributes.position.needsUpdate = true;

      // ���� 3D ���隞嗆�頧砌��冽��冽� ����
      const pulse = 1.0 + Math.sin(elapsed * 2.2) * 0.04;
      const fastPulse = 1.0 + Math.sin(elapsed * 3.6) * 0.08;

      root.rotation.y = Math.sin(elapsed * 0.24) * 0.08;
      
      // 閫����㴓�滚�敺𣂼�頧砍𢆡
      orbitGroup.rotation.y = elapsed * 0.16;
      rings.forEach((ring, idx) => {
        // ��㴓銝羓�蝎鍦��刻��嗵瑪獢�㴓銝𠰴像皛烐�銵峕���
        ring.points.rotation.z = elapsed * (0.58 - idx * 0.15);
      });

      // �詨�����贝蓮
      outerCoreMesh.rotation.x = elapsed * 0.28;
      outerCoreMesh.rotation.y = -elapsed * 0.4;
      outerCoreMesh.scale.setScalar(pulse);

      innerCoreMesh.scale.setScalar(fastPulse);
      radar.group.rotation.y = -elapsed * 0.08;
      
      // �冽��急�瞈��厩㴓�讐�雿枏�憭扯�𣬚�敺桀像蝘餅醌�讛���
      scanRing.position.y = Math.sin(elapsed * 1.6) * 1.65;

      // 3D ���蝏�◇�園��祈蓮嚗帋蝙�券��園�撖寧妍��挾靚��嚗�迤�Ｘ��Ｗ�蝷箝����Ｖ誑��擃� 15 撘批漲/蝘垍�頞���笔漲�芰緵蝛踹�嚗䔶蝙�屸𢒰�𦦵��園𡢿蝎曉�蝻拍��� 0.5 蝘鍦椰�喉�
      if (textOrbitGroup) {
        const cosValForSpeed = Math.cos(textAngle);
        let speedMultiplier = 1.0;
        
        if (cosValForSpeed > 0) {
          // 甇�𢒰�𠰴� (cosVal 隞� 1.0 �滚� 0.0)嚗𡁻�笔漲銋䀹㺭�� [0.15, 0.70] 銋钅𡢿撟單�餈�腹嚗峕��𥕦辣�踵�摮堒銁甇�𢒰���蝷箸𧒄��
          speedMultiplier = 0.15 + 0.55 * (1.0 - cosValForSpeed);
        } else {
          // �屸𢒰�𠰴� (cosVal 隞� 0.0 �滚� -1.0)嚗𡁻�笔漲銋䀹㺭隞� 0.70 �亙�憌坔��單�憭� 16.70嚗諹悟����芰鍂蝥� 0.5 蝘㘾緾�唳�餈����
          const backProgress = -cosValForSpeed; // 0.0 -> 1.0
          speedMultiplier = 0.7 + 16.0 * Math.pow(backProgress, 1.8);
        }
        
        const baseSpeed = 0.9; // �鞾��箇��笔漲嚗屸���迤�Ｖ�銋䀹㺭�諹��ａ�銋䀹㺭嚗峕�憭扳迤�屸𢒰�滚榆
        textAngle -= baseSpeed * safeDelta * speedMultiplier;

        textOrbitGroup.rotation.y = textAngle;
        textOrbitGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.12;
      }

      // 敺芰㴓�𨅯�瞈�瘣餅㦤�塚�憒�� DOM ���撌脣銁憿菟𢒰撠梁貌嚗䔶��曹� React 皜脫��嗅��碶艇�潭芋撘讛秤��撖潸稲皜���交�銝箇征嚗�銁甇支蜓�典𤧅�埝㺭摮烾𢂚嚗���� 100% �𣂼���
      if (rainDOMRef.current && !rainCleanupRef.current) {
        rainCleanupRef.current = initRainCanvas(rainDOMRef.current);
      }

      // 雿輻鍂 EffectComposer 皜脫�
      composer.render();
      frameId = window.requestAnimationFrame(animate);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglFailed(true);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      
      // 瘛勗漲�𦠜𦆮韏��
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      if (envRenderTarget) {
        envRenderTarget.dispose();
      }
      radarResourcesCleanup();
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglFailed) {
    return (
      <div className={`projection-three-core is-fallback${className ? ` ${className}` : ""}`}>
        <PresentationHero3D compact />
      </div>
    );
  }

  return (
    <div className={`projection-three-core${className ? ` ${className}` : ""}`} ref={hostRef}>
      {/* �蓥葵 2D Canvas �啣��刻��荔��箸說�港葵�∠��峕艶嚗䔶葉�湧�霈� */}
      <canvas ref={rainCanvasRef} className="projection-rain-canvas" aria-hidden="true" />

      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="projection-three-core__status is-left" aria-hidden="true">
        �滚���瓲敹�
      </div>
      <div className="projection-three-core__status is-right" aria-hidden="true">
        摰墧𧒄�峕郊
      </div>
    </div>
  );
}
