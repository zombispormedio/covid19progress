import {
  useState,
  useEffect
} from "https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module";
import { html } from "./html.js";

const spinnerConfig = {
  interval: 300,
  frames: ["🙈", "🙈", "🙉", "🙊"]
};

export const Spinner = () => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrameIndex(prev =>
        prev < spinnerConfig.frames.length - 1 ? prev + 1 : 0
      );
    }, spinnerConfig.interval);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return html`<div class="loading-spinner">${spinnerConfig.frames[frameIndex]}</div>`;
};
