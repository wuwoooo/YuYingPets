(function initDisplayAudio(global) {
  let audioCtx = null;
  let callAudioInterval = null;
  let audioUnlockAlerted = false;
  let unlockBound = false;

  function getAudioContext() {
    const AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    return audioCtx;
  }

  function resumeAudioContext(context) {
    if (!context || context.state !== "suspended") return;
    try {
      context.resume().catch(() => {});
    } catch (error) {}
  }

  function playScoreSound(diff, helpers = {}) {
    const isLowSpecMode = helpers.isLowSpecMode || (() => false);
    const showToast = helpers.showToast || (() => {});
    if (
      diff === 0 ||
      isLowSpecMode() ||
      document.body.classList.contains("low-spec")
    ) {
      return;
    }

    try {
      const context = getAudioContext();
      if (!context) return;
      resumeAudioContext(context);
      if (context.state === "suspended" && !audioUnlockAlerted) {
        audioUnlockAlerted = true;
        showToast(
          "检测到大屏音效受浏览器安全限制，请点击大屏任意位置以激活音效",
          "info",
        );
      }
      if (context.state !== "running") return;

      const now = context.currentTime;
      const notes =
        diff > 0
          ? [
              { freq: 523.25, time: 0, duration: 0.15, type: "sine", peak: 0.08 },
              { freq: 659.25, time: 0.08, duration: 0.15, type: "sine", peak: 0.08 },
              { freq: 783.99, time: 0.16, duration: 0.3, type: "sine", peak: 0.08 },
            ]
          : [
              { freq: 329.63, time: 0, duration: 0.18, type: "triangle", peak: 0.06 },
              { freq: 220.0, time: 0.1, duration: 0.35, type: "triangle", peak: 0.06 },
            ];

      notes.forEach((note) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, now + note.time);
        if (diff < 0 && note.freq === 220.0) {
          osc.frequency.exponentialRampToValueAtTime(
            147.0,
            now + note.time + note.duration,
          );
        }
        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(note.peak, now + note.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.time + note.duration,
        );
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(now + note.time);
        osc.stop(now + note.time + note.duration);
      });
    } catch (error) {
      console.warn("播放加减分音效失败", error);
    }
  }

  function bindAudioUnlock() {
    if (unlockBound) return;
    unlockBound = true;
    const unlock = () => {
      try {
        const context = getAudioContext();
        if (!context) return;
        if (context.state === "suspended") {
          context
            .resume()
            .then(() => {
              if (context.state === "running") audioUnlockAlerted = true;
            })
            .catch(() => {});
        }
      } catch (error) {}
    };
    ["click", "touchstart", "pointerdown", "keydown"].forEach((eventName) => {
      document.addEventListener(eventName, unlock, {
        once: true,
        passive: true,
      });
    });
  }

  function playMelodicChime() {
    try {
      const context = getAudioContext();
      if (!context) return;
      resumeAudioContext(context);
      if (context.state !== "running") return;

      const chimes = [659.25, 830.61, 987.77, 1318.51];
      const now = context.currentTime;
      chimes.forEach((freq, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.15);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + index * 0.15 + 0.8,
        );
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(context.destination);
        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.8);
      });
    } catch (error) {
      console.warn("播放音效错误", error);
    }
  }

  function playBreathPhaseCue(context, now, type) {
    // 轻柔钟罄：相位切换时短促提示，不做扫频或白噪声
    const presets = {
      inhale: { freq: 392.0, duration: 0.68, peak: 0.112, cutoff: 760 },
      exhale: { freq: 329.63, duration: 0.84, peak: 0.112, cutoff: 940 },
      hold: { freq: 349.23, duration: 0.64, peak: 0.108, cutoff: 900 },
    };
    const preset = presets[type] || presets.inhale;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(preset.freq, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(preset.cutoff || 760, now);
    filter.Q.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(preset.peak, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(context.destination);
    osc.start(now);
    osc.stop(now + preset.duration + 0.02);
  }

  function playMindfulnessCue(type = "phase", helpers = {}) {
    const isLowSpecMode = helpers.isLowSpecMode || (() => false);
    if (isLowSpecMode() || document.body.classList.contains("low-spec")) {
      return;
    }
    try {
      const context = getAudioContext();
      if (!context) return;
      resumeAudioContext(context);
      if (context.state !== "running") return;

      const now = context.currentTime;
      if (type === "inhale" || type === "exhale" || type === "hold") {
        playBreathPhaseCue(context, now, type);
        return;
      }
      const presets = {
        start: [
          { freq: 392.0, time: 0, duration: 0.46, peak: 0.088 },
          { freq: 523.25, time: 0.16, duration: 0.54, peak: 0.08 },
        ],
        phase: [{ freq: 349.23, time: 0, duration: 0.34, peak: 0.074, wave: "sine", cutoff: 1400 }],
        finish: [
          { freq: 523.25, time: 0, duration: 0.44, peak: 0.084, wave: "sine", cutoff: 1600 },
          { freq: 659.25, time: 0.18, duration: 0.6, peak: 0.074, wave: "triangle", cutoff: 1900 },
          { freq: 783.99, time: 0.36, duration: 0.78, peak: 0.064, wave: "sine", cutoff: 2200 },
        ],
      };
      const notes = presets[type] || presets.phase;
      notes.forEach((note) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();
        osc.type = note.wave || "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.time);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(note.cutoff || 1200, now + note.time);
        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(note.peak, now + note.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.time + note.duration,
        );
        osc.connect(gain);
        gain.connect(filter);
        filter.connect(context.destination);
        osc.start(now + note.time);
        osc.stop(now + note.time + note.duration);
      });
    } catch (error) {
      console.warn("播放专注提示音失败", error);
    }
  }

  function startAlertSound() {
    stopAlertSound();
    playMelodicChime();
    callAudioInterval = global.setInterval(playMelodicChime, 3000);
  }

  function stopAlertSound() {
    if (callAudioInterval) {
      global.clearInterval(callAudioInterval);
      callAudioInterval = null;
    }
  }

  global.DisplayAudio = {
    bindAudioUnlock,
    playScoreSound,
    playMelodicChime,
    playMindfulnessCue,
    startAlertSound,
    stopAlertSound,
  };
})(window);
