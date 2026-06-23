(function initDisplayRealtime(global) {
  function shouldAcceptClassPayload(payload, classId) {
    return !payload?.classId || Number(payload.classId) === Number(classId);
  }

  function shouldAcceptDisplayPayload(payload, terminalCode) {
    return (
      !payload?.displayTerminalCode ||
      payload.displayTerminalCode === terminalCode
    );
  }

  function bindSocketEvents(socket, handlers = {}) {
    if (!socket) return;
    const shouldSkip = () => Boolean(handlers.shouldReceiveCallOnly?.());
    const classId = () => handlers.getClassId?.();
    const terminalCode = () => handlers.getTerminalCode?.();
    const classGuard = (payload) =>
      !shouldSkip() && shouldAcceptClassPayload(payload, classId());

    socket.on("connect", () => handlers.onConnect?.());
    socket.on("auth.ready", (payload) => handlers.onAuthReady?.(payload));
    socket.on("connect_error", (error) => handlers.onConnectError?.(error));
    socket.on("disconnect", (reason) => handlers.onDisconnect?.(reason));

    socket.on("class.config.changed", (payload) => {
      if (classGuard(payload)) handlers.onClassConfigChanged?.(payload);
    });
    socket.on("class.score.changed", (payload) => {
      if (classGuard(payload)) handlers.onClassScoreChanged?.(payload);
    });
    socket.on("class.honor.granted", (payload) => {
      if (classGuard(payload)) handlers.onClassHonorGranted?.(payload);
    });
    socket.on("class.leaderboard.changed", (payload) => {
      if (classGuard(payload)) handlers.onClassLeaderboardChanged?.(payload);
    });
    ["class.student.changed", "class.group.changed"].forEach((eventName) => {
      socket.on(eventName, (payload) => {
        if (classGuard(payload)) {
          handlers.onClassStudentOrGroupChanged?.(payload, eventName);
        }
      });
    });
    socket.on("class.group_score.changed", (payload) => {
      if (classGuard(payload)) handlers.onClassGroupScoreChanged?.(payload);
    });
    socket.on("reward.order.created", (payload) => {
      if (classGuard(payload)) handlers.onRewardOrderCreated?.(payload);
    });
    socket.on("display.unlock.changed", (payload) => {
      if (
        !shouldSkip() &&
        shouldAcceptDisplayPayload(payload, terminalCode())
      ) {
        handlers.onDisplayUnlockChanged?.(payload);
      }
    });
    socket.on("call.queue.changed", (payload) => {
      handlers.onCallQueueChanged?.(payload);
    });
  }

  function syncRoomSubscriptions(socket, state = {}) {
    if (!socket || !socket.connected || !state.socketAuthed) return state;
    const next = {
      subscribedDisplayCode: state.subscribedDisplayCode || null,
      subscribedClassId: state.subscribedClassId || null,
    };

    if (!state.terminalCode && next.subscribedDisplayCode) {
      socket.emit("unsubscribe.room", {
        room: `display:${next.subscribedDisplayCode}`,
      });
      next.subscribedDisplayCode = null;
    } else if (
      state.terminalCode &&
      next.subscribedDisplayCode !== state.terminalCode
    ) {
      if (next.subscribedDisplayCode) {
        socket.emit("unsubscribe.room", {
          room: `display:${next.subscribedDisplayCode}`,
        });
      }
      socket.emit("subscribe.display", { terminalCode: state.terminalCode });
      next.subscribedDisplayCode = state.terminalCode;
    }

    if (!state.classId && next.subscribedClassId) {
      socket.emit("unsubscribe.room", {
        room: `class:${next.subscribedClassId}`,
      });
      next.subscribedClassId = null;
    } else if (state.classId && next.subscribedClassId !== state.classId) {
      if (next.subscribedClassId) {
        socket.emit("unsubscribe.room", {
          room: `class:${next.subscribedClassId}`,
        });
      }
      socket.emit("subscribe.class", { classId: state.classId });
      next.subscribedClassId = state.classId;
    }

    return next;
  }

  global.DisplayRealtime = {
    shouldAcceptClassPayload,
    shouldAcceptDisplayPayload,
    bindSocketEvents,
    syncRoomSubscriptions,
  };
})(window);
