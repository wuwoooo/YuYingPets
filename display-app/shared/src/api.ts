export const DISPLAY_API_BASE_URL =
  (globalThis as { __DISPLAY_API_BASE_URL__?: string }).__DISPLAY_API_BASE_URL__ ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://127.0.0.1:3000/api/v1');

export const DISPLAY_REALTIME_URL = DISPLAY_API_BASE_URL.replace(/\/api\/v1$/, '');

type RequestOptions = {
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${DISPLAY_API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    let message = `接口请求失败: ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export type DisplayLoginResponse = {
  code: number;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      roleCode: string;
      dutyTags?: string[];
    };
    scopes: Array<{
      scopeType: string;
      classId: number | null;
      gradeCode: string | null;
      subjectCode: string | null;
    }>;
    classAssignments: Array<{
      classId: number;
      roleInClass: string;
      subjectCode: string | null;
      isPrimary: boolean;
    }>;
  };
};

export type DisplayWeatherResponse = {
  code: number;
  message: string;
  data: {
    label: string;
    title: string;
    icon: string;
    temperatureC: number | null;
    temperatureText: string;
    conditionText: string;
    provider: string;
    observedAt: string | null;
    isStale: boolean;
  };
};

export const displayApi = {
  entryConfig(classId?: number) {
    return request(`/display/entry-config${classId ? `?classId=${classId}` : ''}`);
  },
  weather(latitude: number, longitude: number, label?: string) {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      ...(label ? { label } : {}),
    });
    return request<DisplayWeatherResponse>(`/display/weather?${query.toString()}`);
  },
  classHome(classId: number) {
    return request(`/display/classes/${classId}/home`);
  },
  leaderboard(classId: number, type = 'score') {
    return request(`/display/classes/${classId}/leaderboard?type=${type}`);
  },
  rewardCenter(classId: number) {
    return request(`/display/classes/${classId}/reward-center`);
  },
  login(username: string, password: string) {
    return request<DisplayLoginResponse>('/auth/login', {
      method: 'POST',
      body: {
        username,
        password,
        terminalType: 'display',
      },
    });
  },
  me(token: string) {
    return request('/auth/me', { token });
  },
  unlock(token: string, classId: number, displayTerminalCode: string) {
    return request('/display/unlock', {
      method: 'POST',
      token,
      body: {
        classId,
        displayTerminalCode,
      },
    });
  },
  lock(token: string, classId: number, displayTerminalCode: string) {
    return request('/display/lock', {
      method: 'POST',
      token,
      body: {
        classId,
        displayTerminalCode,
      },
    });
  },
  unlockStatus(classId: number, displayTerminalCode: string) {
    return request(
      `/display/unlock-status?classId=${classId}&displayTerminalCode=${encodeURIComponent(displayTerminalCode)}`,
    );
  },
  students(token: string, classId: number) {
    return request(`/students?classId=${classId}`, { token });
  },
  classGroups(token: string, classId: number) {
    return request(`/classes/${classId}/groups`, { token });
  },
  scoreRules(token: string, classId: number) {
    return request(`/score-rules?displayEnabled=true&scoreTarget=student&classId=${classId}`, { token });
  },
  scoreRecords(classId: number) {
    return request(`/score-records?classId=${classId}`);
  },
  createScoreRecord(
    token: string,
    body: {
      classId: number;
      studentId: number;
      ruleId: number;
      remark?: string;
      sourceTerminal: 'display';
    },
  ) {
    return request('/score-records', {
      method: 'POST',
      token,
      body,
    });
  },
  createBatchScoreRecord(
    token: string,
    body: {
      classId: number;
      studentIds: number[];
      ruleId: number;
      remark?: string;
      sourceTerminal: 'display';
    },
  ) {
    return request('/score-records/batch', {
      method: 'POST',
      token,
      body,
    });
  },
  createGroupScoreRecord(
    token: string,
    body: {
      classId: number;
      classGroupId: number;
      ruleId: number;
      remark?: string;
      sourceTerminal: 'display';
    },
  ) {
    return request('/score-records/group', {
      method: 'POST',
      token,
      body,
    });
  },
};
