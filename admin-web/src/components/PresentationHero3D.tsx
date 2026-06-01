import React from "react";
import "./PresentationHero3D.css";

export type PresentationHero3DHudItem = {
  label: string;
  value: string;
  tone?: "cyan" | "green" | "gold" | "red";
};

type PresentationHero3DProps = {
  compact?: boolean;
  hudItems?: Partial<
    Record<
      "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
      PresentationHero3DHudItem
    >
  >;
};

type HudPosition = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const defaultHudItems: Record<HudPosition, PresentationHero3DHudItem> = {
  topLeft: { label: "SYSTEM CORE", value: "ONLINE" },
  topRight: { label: "SYNC RATE", value: "99.9%", tone: "green" },
  bottomLeft: { label: "COORDS X-Y", value: "102.3 : 44.8" },
  bottomRight: { label: "THROUGHPUT", value: "8,421 req/s" },
};

function renderHudItem(
  position: HudPosition,
  className: string,
  item?: PresentationHero3DHudItem,
) {
  const resolved = item ?? defaultHudItems[position];
  return (
    <div
      className={`hero-hud-text ${className} tone-${resolved.tone ?? "cyan"}`}
    >
      <div className="hud-label">{resolved.label}</div>
      <div className="hud-value">{resolved.value}</div>
    </div>
  );
}

export function PresentationHero3D({
  compact = false,
  hudItems,
}: PresentationHero3DProps) {
  return (
    <div className={`hero-3d-container${compact ? " hero-3d-compact" : ""}`}>
      {/* 底部光晕底座 */}
      <div className="ai-base-glow" />

      {/* 底部全息投影光束 */}
      <div className="ai-holo-beam" />

      {/* 3D 旋转星环 */}
      <div className="ai-orbital-rings">
        <div className="ai-ring r1" />
        <div className="ai-ring r2" />
        <div className="ai-ring r3" />
      </div>



      {/* 内部高亮核心球体 */}
      <div className="ai-core-orb" />

      {/* 悬浮发光 AI 文字 */}
      <div className="ai-text-hologram">
        <div className="ai-text-glitch" data-text="育英AI">
          育英AI
        </div>
      </div>

      {/* 悬浮粒子 */}
      <div className="particle pt-1" />
      <div className="particle pt-2" />
      <div className="particle pt-3" />
      <div className="particle pt-4" />
      <div className="particle pt-5" />

      {/* HUD 悬浮面板 */}
      {renderHudItem("topLeft", "top-left", hudItems?.topLeft)}
      {renderHudItem("topRight", "top-right", hudItems?.topRight)}
      {renderHudItem("bottomLeft", "bottom-left", hudItems?.bottomLeft)}
      {renderHudItem("bottomRight", "bottom-right", hudItems?.bottomRight)}
    </div>
  );
}
