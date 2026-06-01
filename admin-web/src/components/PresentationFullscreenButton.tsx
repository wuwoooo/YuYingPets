import { PresentationGlyph } from "./PresentationGlyph";
import { usePresentationFullscreen } from "../utils/presentationFullscreen";

type PresentationFullscreenButtonProps = {
  className?: string;
};

/** 展示/投屏页右上角全屏切换按钮 */
export function PresentationFullscreenButton({
  className,
}: PresentationFullscreenButtonProps) {
  const { isFullscreen, toggle } = usePresentationFullscreen();

  return (
    <button
      type="button"
      className={className}
      aria-label={isFullscreen ? "退出全屏" : "全屏"}
      title={isFullscreen ? "退出全屏" : "全屏"}
      onClick={() => void toggle()}
    >
      <PresentationGlyph
        name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
      />
    </button>
  );
}
