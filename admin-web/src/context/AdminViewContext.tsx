import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { resolveSubjectLabel } from '../constants/admin';
import type { AdminClass, AdminStudent, SessionScope, SessionUser } from '../lib/api';

const STORAGE_KEY = 'yuyingpets_admin_acting_view';

type PlatformViewOption = {
  key: 'platform';
  mode: 'platform';
  label: string;
  description: string;
};

type SubjectViewOption = {
  key: string;
  mode: 'subject';
  label: string;
  description: string;
  classId: number;
  subjectCode: string;
};

export type AdminViewOption = PlatformViewOption | SubjectViewOption;

type AdminViewContextValue = {
  originalUser: SessionUser | null;
  effectiveUser: SessionUser | null;
  effectiveScopes: SessionScope[];
  effectiveClasses: AdminClass[];
  effectiveStudents: AdminStudent[];
  availableViews: AdminViewOption[];
  activeView: AdminViewOption;
  subjectViews: SubjectViewOption[];
  activeSubjectView: SubjectViewOption | null;
  setActiveViewKey: (key: string) => void;
  isActingSubjectView: boolean;
};

type AdminViewProviderProps = {
  user: SessionUser | null;
  scopes: SessionScope[];
  classes: AdminClass[];
  students: AdminStudent[];
  children: ReactNode;
};

const defaultPlatformView: PlatformViewOption = {
  key: 'platform',
  mode: 'platform',
  label: '平台视角',
  description: '使用当前账号的主角色能力',
};

const AdminViewContext = createContext<AdminViewContextValue | null>(null);

function readStoredViewMap() {
  if (typeof window === 'undefined') return {} as Record<string, string>;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as Record<string, string>;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {} as Record<string, string>;
  }
}

function writeStoredViewMap(nextMap: Record<string, string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
}

function canUseSubjectActingView(user?: SessionUser | null) {
  if (!user?.roleCode) return false;
  return user.roleCode !== 'subject_teacher';
}

function buildPlatformLabel(user?: SessionUser | null) {
  const roleName = user?.roleName?.trim();
  return roleName ? `平台视角 · ${roleName}` : '平台视角';
}

function buildAvailableViews(user: SessionUser | null, classes: AdminClass[]): AdminViewOption[] {
  const classMap = new Map(classes.map((item) => [item.id, item]));
  const subjectAssignments = Array.from(
    new Map(
      (user?.classAssignments ?? [])
        .filter((item) => item.roleInClass === 'subject_teacher' && item.subjectCode)
        .map((item) => [`${item.classId}:${item.subjectCode}`, item]),
    ).values(),
  );
  const subjectOptions: SubjectViewOption[] = [];

  for (const assignment of subjectAssignments) {
    const classInfo = classMap.get(assignment.classId);
    const subjectLabel = resolveSubjectLabel(assignment.subjectCode);
    const classLabel = classInfo ? `${classInfo.gradeName} ${classInfo.name}` : `班级 #${assignment.classId}`;
    subjectOptions.push({
      key: `subject:${assignment.classId}:${assignment.subjectCode}`,
      mode: 'subject',
      label: `${classLabel} · ${subjectLabel}`,
      description: `在本班执教「${subjectLabel}」时使用：工作台、评价与学生列表默认只看这个班`,
      classId: assignment.classId,
      subjectCode: assignment.subjectCode ?? '',
    });
  }

  if (!user) return [];
  if (user.roleCode === 'subject_teacher') {
    return subjectOptions.length > 0 ? subjectOptions : [];
  }

  const options: AdminViewOption[] = [
    {
      ...defaultPlatformView,
      label: buildPlatformLabel(user),
    },
  ];

  if (!canUseSubjectActingView(user)) return options;
  return [...options, ...subjectOptions];
}

export function AdminViewProvider({ user, scopes, classes, students, children }: AdminViewProviderProps) {
  const availableViews = useMemo(() => buildAvailableViews(user, classes), [classes, user]);
  const [activeViewKey, setActiveViewKeyState] = useState<string>('platform');

  useEffect(() => {
    if (!user?.id) {
      setActiveViewKeyState('platform');
      return;
    }
    const storedMap = readStoredViewMap();
    const defaultKey = user.roleCode === 'subject_teacher' ? availableViews[0]?.key ?? 'platform' : 'platform';
    const nextKey = storedMap[String(user.id)] ?? defaultKey;
    const matched = availableViews.find((item) => item.key === nextKey);
    setActiveViewKeyState(matched?.key ?? defaultKey);
  }, [availableViews, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const storedMap = readStoredViewMap();
    storedMap[String(user.id)] = activeViewKey;
    writeStoredViewMap(storedMap);
  }, [activeViewKey, user?.id]);

  const activeView = useMemo(
    () => availableViews.find((item) => item.key === activeViewKey) ?? availableViews[0] ?? defaultPlatformView,
    [activeViewKey, availableViews],
  );

  const value = useMemo<AdminViewContextValue>(() => {
    const isActingSubjectView = activeView.mode === 'subject';
    const subjectViews = availableViews.filter((item): item is SubjectViewOption => item.mode === 'subject');
    const activeSubjectView = activeView.mode === 'subject' ? activeView : null;
    const effectiveUser =
      user && isActingSubjectView
        ? {
            ...user,
            roleCode: 'subject_teacher',
            roleName: '任课教师',
          }
        : user;

    const effectiveScopes =
      user && activeView.mode === 'subject'
        ? [
            {
              scopeType: 'subject_class',
              classId: activeView.classId,
              gradeCode: classes.find((item) => item.id === activeView.classId)?.gradeCode ?? null,
              subjectCode: activeView.subjectCode,
            },
          ]
        : scopes;

    const effectiveClasses =
      activeView.mode === 'subject'
        ? classes.filter((item) => item.id === activeView.classId)
        : classes;

    const effectiveStudents =
      activeView.mode === 'subject'
        ? students.filter((item) => item.classId === activeView.classId)
        : students;

    return {
      originalUser: user,
      effectiveUser,
      effectiveScopes,
      effectiveClasses,
      effectiveStudents,
      availableViews,
      activeView,
      subjectViews,
      activeSubjectView,
      setActiveViewKey: (key: string) => {
        setActiveViewKeyState(availableViews.find((item) => item.key === key)?.key ?? 'platform');
      },
      isActingSubjectView,
    };
  }, [activeView, availableViews, classes, scopes, students, user]);

  return <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>;
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (!context) {
    throw new Error('useAdminView must be used within AdminViewProvider');
  }
  return context;
}
