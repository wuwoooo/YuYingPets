import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';
import { clearAdminToken, getAdminToken, setAdminToken } from '../lib/session';
import type { AdminState, UseAdminDataResult } from '../types/admin';
import { canManageClassRewards, canManageRewards } from '../utils/adminPermissions';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useAdminData(): UseAdminDataResult {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<AdminState>(() => ({
    token: getAdminToken(),
    user: null,
    scopes: [],
    classes: [],
    students: [],
    rules: [],
    honors: [],
    rewards: [],
    /** 本地已有 token 时首帧即视为加载中，避免工作台误渲染校级视图 */
    loading: Boolean(getAdminToken()),
    error: null,
  }));

  useEffect(() => {
    if (!state.token) return;

    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    adminApi
      .me(state.token)
      .then(async (me) => {
        if (active) {
          setState((prev) => ({
            ...prev,
            user: {
              ...me.data.user,
              classAssignments: me.data.classAssignments,
            },
            scopes: me.data.scopes,
          }));
        }

        const canLoadAllRewards = canManageRewards(me.data.user.roleCode);
        const canLoadClassRewards = canManageClassRewards(me.data.user.roleCode);
        const results = await Promise.allSettled([
          adminApi.classes(state.token!),
          adminApi.students(state.token!),
          adminApi.scoreRules(state.token!),
          adminApi.honors(state.token!),
          canLoadAllRewards || canLoadClassRewards
            ? adminApi.rewards(
                state.token!,
                canLoadAllRewards || canLoadClassRewards ? { includeDisabled: true } : undefined,
              )
            : Promise.resolve({ data: [] }),
        ] as const);

        const [classesResult, studentsResult, rulesResult, honorsResult, rewardsResult] = results;
        const warnings: string[] = [];

        if (classesResult.status === 'rejected') {
          warnings.push(`班级数据加载失败：${getErrorMessage(classesResult.reason, '未知错误')}`);
        }
        if (studentsResult.status === 'rejected') {
          warnings.push(`学生数据加载失败：${getErrorMessage(studentsResult.reason, '未知错误')}`);
        }
        if (rulesResult.status === 'rejected') {
          warnings.push(`积分规则加载失败：${getErrorMessage(rulesResult.reason, '未知错误')}`);
        }
        if (honorsResult.status === 'rejected') {
          warnings.push(`荣誉数据加载失败：${getErrorMessage(honorsResult.reason, '未知错误')}`);
        }
        if (rewardsResult.status === 'rejected') {
          warnings.push(`奖励数据加载失败：${getErrorMessage(rewardsResult.reason, '未知错误')}`);
        }

        return {
          me,
          classes: classesResult.status === 'fulfilled' ? classesResult.value : { data: [] },
          students: studentsResult.status === 'fulfilled' ? studentsResult.value : { data: [] },
          rules: rulesResult.status === 'fulfilled' ? rulesResult.value : { data: [] },
          honors: honorsResult.status === 'fulfilled' ? honorsResult.value : { data: [] },
          rewards: rewardsResult.status === 'fulfilled' ? rewardsResult.value : { data: [] },
          warningMessage: warnings.length > 0 ? `部分数据未加载成功：${warnings.join('；')}` : null,
        };
      })
      .then(({ me, classes, students, rules, honors, rewards, warningMessage }) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          user: {
            ...me.data.user,
            classAssignments: me.data.classAssignments,
          },
          scopes: me.data.scopes,
          classes: classes.data,
          students: students.data,
          rules: rules.data,
          honors: honors.data,
          rewards: rewards.data,
          loading: false,
          error: warningMessage,
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
