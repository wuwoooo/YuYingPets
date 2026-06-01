import { useCallback, useEffect, useState } from "react";

/** 在用户点击等手势回调中进入全屏 */
export async function requestPresentationFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // 浏览器拒绝或环境不支持时静默忽略
  }
}

/** 退出全屏 */
export async function exitPresentationFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    // 浏览器拒绝或环境不支持时静默忽略
  }
}

/** 展示/投屏页全屏状态与切换 */
export function usePresentationFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => Boolean(document.fullscreenElement),
  );

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // 浏览器拒绝或环境不支持时静默忽略
    }
  }, []);

  return { isFullscreen, toggle };
}
