import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../lib/api';

export const SETTINGS_UPDATED_EVENT = 'yuyingpets:settings-updated';

export function notifySettingsUpdated() {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
}

export function useCurrentSemesterName(token: string | null | undefined) {
  const location = useLocation();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setName(null);
      return;
    }

    let active = true;
    adminApi
      .settings(token)
      .then((response) => {
        if (!active) return;
        setName(response.data.semester?.name ?? null);
      })
      .catch(() => {
        if (!active) return;
        setName(null);
      });

    return () => {
      active = false;
    };
  }, [token, location.pathname]);

  useEffect(() => {
    if (!token) return;

    const reload = () => {
      adminApi
        .settings(token)
        .then((response) => setName(response.data.semester?.name ?? null))
        .catch(() => setName(null));
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, reload);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, reload);
  }, [token]);

  return name;
}
