import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../lib/api';
import { normalizeAcademicPeriodLabel } from '../utils/academicImport';
import { canManageAdminConfig } from '../utils/adminPermissions';

export const SETTINGS_UPDATED_EVENT = 'yuyingpets:settings-updated';

export function notifySettingsUpdated() {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
}

export function useCurrentSemesterName(token: string | null | undefined, roleCode?: string | null) {
  const location = useLocation();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // 投屏页使用受限 token，/admin/settings 会 403；学期名改由投屏快照自行加载
    if (
      !token ||
      !canManageAdminConfig(roleCode) ||
      location.pathname.startsWith('/projection')
    ) {
      setName(null);
      return;
    }

    let active = true;
    adminApi
      .settings(token)
      .then((response) => {
        if (!active) return;
        setName(response.data.semester?.name ? normalizeAcademicPeriodLabel(response.data.semester.name) : null);
      })
      .catch(() => {
        if (!active) return;
        setName(null);
      });

    return () => {
      active = false;
    };
  }, [token, roleCode, location.pathname]);

  useEffect(() => {
    if (
      !token ||
      !canManageAdminConfig(roleCode) ||
      location.pathname.startsWith('/projection')
    ) {
      return;
    }

    const reload = () => {
      adminApi
        .settings(token)
        .then((response) => setName(response.data.semester?.name ? normalizeAcademicPeriodLabel(response.data.semester.name) : null))
        .catch(() => setName(null));
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, reload);
  }, [token, roleCode, location.pathname]);

  return name;
}
