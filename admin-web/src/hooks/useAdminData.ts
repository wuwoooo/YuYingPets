import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';
import { clearAdminToken, getAdminToken, setAdminToken } from '../lib/session';
import type { AdminState, UseAdminDataResult } from '../types/admin';
import { canManageRewards } from '../utils/adminPermissions';

export function useAdminData(): UseAdminDataResult {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<AdminState>({
    token: getAdminToken(),
    user: null,
    scopes: [],
    classes: [],
    students: [],
    rules: [],
    honors: [],
    rewards: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!state.token) return;

    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    adminApi
      .me(state.token)
      .then(async (me) => {
        const canLoadAllRewards = canManageRewards(me.data.user.roleCode);
        const [classes, students, rules, honors, rewards] = await Promise.all([
          adminApi.classes(state.token!),
          adminApi.students(state.token!),
          adminApi.scoreRules(state.token!),
          adminApi.honors(state.token!),
          adminApi.rewards(state.token!, canLoadAllRewards ? { includeDisabled: true } : undefined),
        ]);
        return { me, classes, students, rules, honors, rewards };
      })
      .then(({ me, classes, students, rules, honors, rewards }) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          user: me.data.user,
          scopes: me.data.scopes,
          classes: classes.data,
          students: students.data,
          rules: rules.data,
          honors: honors.data,
          rewards: rewards.data,
          loading: false,
        }));
      })
      .catch((error: Error) => {
        if (!active) return;
        clearAdminToken();
        setState((prev) => ({
          ...prev,
          token: null,
          user: null,
          scopes: [],
          loading: false,
          error: error.message,
        }));
      });

    return () => {
      active = false;
    };
  }, [reloadKey, state.token]);

  return {
    ...state,
    refresh() {
      setReloadKey((value) => value + 1);
    },
    setToken(token: string | null) {
      if (token) setAdminToken(token);
      else clearAdminToken();
      setState((prev) => ({
        ...prev,
        token,
        user: null,
        scopes: [],
        classes: [],
        students: [],
        rules: [],
        honors: [],
        rewards: [],
        loading: Boolean(token),
        error: null,
      }));
    },
  };
}
