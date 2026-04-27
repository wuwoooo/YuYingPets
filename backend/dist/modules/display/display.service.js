"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const bigint_util_1 = require("../../common/utils/bigint.util");
const realtime_service_1 = require("../realtime/realtime.service");
const operation_log_service_1 = require("../operation-log/operation-log.service");
const pet_growth_util_1 = require("../../common/utils/pet-growth.util");
let DisplayService = class DisplayService {
    constructor(prisma, authService, configService, realtimeService, operationLogService) {
        this.prisma = prisma;
        this.authService = authService;
        this.configService = configService;
        this.realtimeService = realtimeService;
        this.operationLogService = operationLogService;
        this.weatherCache = new Map();
    }
    async terminalState(terminalCode) {
        const terminal = await this.prisma.displayTerminal.findFirst({
            where: {
                terminalCode,
                status: 'enabled',
            },
            include: {
                classroom: {
                    include: {
                        homeroomTeacher: true,
                    },
                },
            },
        });
        return {
            code: 0,
            message: 'ok',
            data: terminal
                ? {
                    terminalCode: terminal.terminalCode,
                    terminalName: terminal.terminalName,
                    isInitialized: Boolean(terminal.classId),
                    initializedAt: terminal.initializedAt,
                    lastBoundAt: terminal.lastBoundAt,
                    classId: terminal.classId ? (0, bigint_util_1.toNumber)(terminal.classId) : null,
                    classInfo: terminal.classroom
                        ? {
                            id: (0, bigint_util_1.toNumber)(terminal.classroom.id),
                            gradeName: terminal.classroom.gradeName,
                            className: terminal.classroom.name,
                            slogan: terminal.classroom.slogan,
                            homeroomTeacherName: terminal.classroom.homeroomTeacher?.name ?? null,
                        }
                        : null,
                }
                : {
                    terminalCode,
                    terminalName: `育英星宠终端-${terminalCode.slice(-6)}`,
                    isInitialized: false,
                    initializedAt: null,
                    lastBoundAt: null,
                    classId: null,
                    classInfo: null,
                },
        };
    }
    async terminals(authorization) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色不可查看大屏终端列表');
        }
        const rows = await this.prisma.displayTerminal.findMany({
            where: {
                schoolId: user.schoolId,
                status: 'enabled',
            },
            include: {
                classroom: {
                    select: {
                        id: true,
                        gradeName: true,
                        name: true,
                        displayStatus: true,
                    },
                },
            },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
        const onlineTerminalCodes = await this.realtimeService.listOnlineDisplayTerminalCodes(rows.map((item) => item.terminalCode));
        return {
            code: 0,
            message: 'ok',
            data: rows.map((row) => ({
                id: (0, bigint_util_1.toNumber)(row.id),
                terminalCode: row.terminalCode,
                terminalName: row.terminalName,
                classId: row.classId ? (0, bigint_util_1.toNumber)(row.classId) : null,
                classInfo: row.classroom
                    ? {
                        id: (0, bigint_util_1.toNumber)(row.classroom.id),
                        gradeName: row.classroom.gradeName,
                        className: row.classroom.name,
                        displayStatus: row.classroom.displayStatus,
                    }
                    : null,
                onlineStatus: onlineTerminalCodes.has(row.terminalCode) ? 'online' : 'offline',
                initializedAt: row.initializedAt,
                lastBoundAt: row.lastBoundAt,
                lastOnlineAt: row.lastOnlineAt,
            })),
        };
    }
    async terminalInitialize(authorization, dto) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (user.roleCode !== 'super_admin') {
            throw new common_1.ForbiddenException('仅超级管理员可初始化展示终端');
        }
        const classroom = await this.prisma.classroom.findFirst({
            where: {
                id: BigInt(dto.classId),
                schoolId: user.schoolId,
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                homeroomTeacher: true,
            },
        });
        if (!classroom) {
            throw new common_1.NotFoundException('要绑定的班级不存在');
        }
        const terminal = await this.prisma.displayTerminal.upsert({
            where: { terminalCode: dto.terminalCode },
            update: {
                schoolId: user.schoolId,
                classId: BigInt(dto.classId),
                terminalName: dto.terminalName,
                initializedBy: user.id,
                initializedAt: new Date(),
                lastBoundAt: new Date(),
                lastOnlineAt: new Date(),
                status: 'enabled',
            },
            create: {
                schoolId: user.schoolId,
                classId: BigInt(dto.classId),
                terminalCode: dto.terminalCode,
                terminalName: dto.terminalName,
                initializedBy: user.id,
                initializedAt: new Date(),
                lastBoundAt: new Date(),
                lastOnlineAt: new Date(),
                status: 'enabled',
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'display',
            module: 'display_terminal',
            action: 'initialize',
            targetType: 'class',
            targetId: BigInt(dto.classId),
            detail: {
                terminalCode: dto.terminalCode,
                terminalName: dto.terminalName,
                classId: dto.classId,
            },
        });
        return {
            code: 0,
            message: 'ok',
            data: {
                terminalId: (0, bigint_util_1.toNumber)(terminal.id),
                terminalCode: terminal.terminalCode,
                terminalName: terminal.terminalName,
                classId: dto.classId,
                classInfo: {
                    id: (0, bigint_util_1.toNumber)(classroom.id),
                    gradeName: classroom.gradeName,
                    className: classroom.name,
                    slogan: classroom.slogan,
                    homeroomTeacherName: classroom.homeroomTeacher?.name ?? null,
                },
            },
        };
    }
    async unlock(authorization, dto) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['homeroom_teacher', 'subject_teacher'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色不可解锁展示端操作模式');
        }
        this.authService.ensureCanAccessClass(user, dto.classId);
        const unlockMinutes = Number(this.configService.get('DISPLAY_UNLOCK_MINUTES', '15'));
        const expiresAt = new Date(Date.now() + unlockMinutes * 60 * 1000);
        const session = await this.prisma.displayUnlockSession.create({
            data: {
                classId: BigInt(dto.classId),
                displayTerminalCode: dto.displayTerminalCode,
                userId: user.id,
                roleCode: user.roleCode,
                unlockedAt: new Date(),
                expiredAt: expiresAt,
                status: 'active',
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'display',
            module: 'display',
            action: 'unlock',
            targetType: 'class',
            targetId: BigInt(dto.classId),
            detail: {
                classId: dto.classId,
                displayTerminalCode: dto.displayTerminalCode,
                expiredAt: expiresAt.toISOString(),
            },
        });
        this.realtimeService.emitDisplayUnlocked(dto.classId, dto.displayTerminalCode, {
            classId: dto.classId,
            displayTerminalCode: dto.displayTerminalCode,
            unlockedBy: user.name,
            roleCode: user.roleCode,
            expiredAt: expiresAt.toISOString(),
        });
        return {
            code: 0,
            message: 'ok',
            data: {
                classId: dto.classId,
                displayTerminalCode: dto.displayTerminalCode,
                unlockSessionId: (0, bigint_util_1.toNumber)(session.id),
                expiredAt: expiresAt.toISOString(),
            },
        };
    }
    async unlockStatus(classId, displayTerminalCode) {
        const session = await this.prisma.displayUnlockSession.findFirst({
            where: {
                classId: BigInt(classId),
                displayTerminalCode,
            },
            orderBy: { createdAt: 'desc' },
        });
        const now = new Date();
        const status = !session ? 'locked' : session.status === 'active' && session.expiredAt > now ? 'active' : 'expired';
        return {
            code: 0,
            message: 'ok',
            data: {
                classId,
                displayTerminalCode,
                status,
                unlockSessionId: session ? (0, bigint_util_1.toNumber)(session.id) : null,
                expiredAt: session?.expiredAt ?? null,
            },
        };
    }
    async lock(authorization, dto) {
        const user = await this.authService.getAuthUserFromAuthorization(authorization);
        if (!['homeroom_teacher', 'subject_teacher'].includes(user.roleCode)) {
            throw new common_1.ForbiddenException('当前角色不可锁定展示端操作模式');
        }
        this.authService.ensureCanAccessClass(user, dto.classId);
        const updated = await this.prisma.displayUnlockSession.updateMany({
            where: {
                classId: BigInt(dto.classId),
                displayTerminalCode: dto.displayTerminalCode,
                status: 'active',
            },
            data: {
                status: 'locked',
                expiredAt: new Date(),
            },
        });
        await this.operationLogService.create({
            schoolId: user.schoolId,
            userId: user.id,
            roleCode: user.roleCode,
            terminalType: 'display',
            module: 'display',
            action: 'lock',
            targetType: 'class',
            targetId: BigInt(dto.classId),
            detail: {
                classId: dto.classId,
                displayTerminalCode: dto.displayTerminalCode,
                updatedCount: updated.count,
            },
        });
        this.realtimeService.emitDisplayUnlocked(dto.classId, dto.displayTerminalCode, {
            classId: dto.classId,
            displayTerminalCode: dto.displayTerminalCode,
            status: 'locked',
            updatedCount: updated.count,
        });
        return { code: 0, message: 'ok', data: { updatedCount: updated.count } };
    }
    async entryConfig(classId) {
        const row = await this.prisma.displayConfig.findFirst({
            where: {
                classId: classId ? BigInt(classId) : null,
            },
            orderBy: { updatedAt: 'desc' },
        });
        return {
            code: 0,
            message: 'ok',
            data: row
                ? {
                    id: (0, bigint_util_1.toNumber)(row.id),
                    schoolId: (0, bigint_util_1.toNumber)(row.schoolId),
                    classId: (0, bigint_util_1.toNumber)(row.classId),
                    bgImageUrl: row.bgImageUrl,
                    title: row.title,
                    subtitle: row.subtitle,
                    animationSpeed: row.animationSpeed,
                    allowSkipAnimation: row.allowSkipAnimation,
                    defaultMode: row.defaultMode,
                }
                : null,
        };
    }
    async weather(query) {
        const location = await this.resolveWeatherLocation(query);
        const cacheKey = this.buildWeatherCacheKey(location);
        const now = Date.now();
        const cached = this.weatherCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return {
                code: 0,
                message: 'ok',
                data: cached.data,
            };
        }
        const providerErrors = [];
        const fresh = (await this.fetchWeatherFromQWeather(location).catch((error) => {
            providerErrors.push(this.toWeatherErrorMessage('qweather', error));
            return null;
        })) ??
            (await this.fetchWeatherFromOpenMeteo(location).catch((error) => {
                providerErrors.push(this.toWeatherErrorMessage('open-meteo', error));
                return null;
            }));
        if (fresh) {
            const ttlMinutes = Number(this.configService.get('DISPLAY_WEATHER_CACHE_MINUTES', '10'));
            this.weatherCache.set(cacheKey, {
                expiresAt: now + Math.max(1, ttlMinutes) * 60 * 1000,
                data: fresh,
            });
            return {
                code: 0,
                message: 'ok',
                data: fresh,
            };
        }
        if (cached) {
            return {
                code: 0,
                message: 'ok',
                data: {
                    ...cached.data,
                    isStale: true,
                    title: `${cached.data.title}（缓存）`,
                },
            };
        }
        const label = location.label;
        return {
            code: 0,
            message: 'ok',
            data: {
                label,
                title: providerErrors.length > 0
                    ? `天气接口暂时不可用：${providerErrors.join('；')}`
                    : '天气接口暂时不可用',
                icon: 'fa-cloud',
                temperatureC: null,
                temperatureText: '--°C',
                conditionText: '天气暂不可用',
                provider: 'unavailable',
                observedAt: null,
                isStale: false,
            },
        };
    }
    async home(classId) {
        const classroom = await this.prisma.classroom.findFirst({
            where: {
                id: BigInt(classId),
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                students: {
                    where: { deletedAt: null, status: 'enabled' },
                    include: {
                        profile: true,
                        studentPet: {
                            include: {
                                pet: true,
                            },
                        },
                    },
                },
                homeroomTeacher: true,
            },
        });
        if (!classroom) {
            throw new common_1.NotFoundException('班级不存在');
        }
        const topStudents = [...classroom.students]
            .sort((a, b) => (b.profile?.currentScore ?? 0) - (a.profile?.currentScore ?? 0))
            .slice(0, 5);
        return {
            code: 0,
            message: 'ok',
            data: {
                classId,
                className: classroom.name,
                gradeName: classroom.gradeName,
                slogan: classroom.slogan,
                targetScore: classroom.targetScore,
                homeroomTeacher: classroom.homeroomTeacher
                    ? {
                        id: (0, bigint_util_1.toNumber)(classroom.homeroomTeacher.id),
                        name: classroom.homeroomTeacher.name,
                    }
                    : null,
                studentCount: classroom.students.length,
                scoreSummary: {
                    currentScoreTotal: classroom.students.reduce((sum, item) => sum + (item.profile?.currentScore ?? 0), 0),
                    totalScoreTotal: classroom.students.reduce((sum, item) => sum + (item.profile?.totalScore ?? 0), 0),
                },
                topStudents: topStudents.map((student) => ({
                    id: (0, bigint_util_1.toNumber)(student.id),
                    name: student.name,
                    avatarUrl: student.avatarUrl,
                    currentScore: student.profile?.currentScore ?? 0,
                    currentPetLevel: student.profile?.currentPetLevel ?? 1,
                    petName: student.studentPet?.pet.name ?? null,
                })),
            },
        };
    }
    async resolveWeatherLocation(query) {
        if (typeof query.latitude === 'number' &&
            Number.isFinite(query.latitude) &&
            typeof query.longitude === 'number' &&
            Number.isFinite(query.longitude)) {
            return {
                label: query.label?.trim() || this.configService.get('DISPLAY_WEATHER_LABEL', '大理'),
                latitude: query.latitude,
                longitude: query.longitude,
            };
        }
        const displayConfig = await this.prisma.displayConfig.findFirst({
            where: { classId: null },
            orderBy: { updatedAt: 'desc' },
            select: {
                weatherLabel: true,
                weatherLatitude: true,
                weatherLongitude: true,
            },
        });
        return {
            label: query.label?.trim() || displayConfig?.weatherLabel || this.configService.get('DISPLAY_WEATHER_LABEL', '大理'),
            latitude: displayConfig?.weatherLatitude !== null && displayConfig?.weatherLatitude !== undefined
                ? Number(displayConfig.weatherLatitude)
                : Number(this.configService.get('DISPLAY_WEATHER_LATITUDE', '25.6065')),
            longitude: displayConfig?.weatherLongitude !== null && displayConfig?.weatherLongitude !== undefined
                ? Number(displayConfig.weatherLongitude)
                : Number(this.configService.get('DISPLAY_WEATHER_LONGITUDE', '100.2676')),
        };
    }
    buildWeatherCacheKey(location) {
        return `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}:${location.label}`;
    }
    toWeatherErrorMessage(provider, error) {
        const message = error instanceof Error ? error.message : '未知错误';
        return `${provider} ${message}`;
    }
    async fetchWeatherFromQWeather(query) {
        const apiKey = this.configService.get('QWEATHER_API_KEY')?.trim();
        if (!apiKey) {
            return null;
        }
        const apiHost = this.configService.get('QWEATHER_API_HOST')?.trim() || 'https://devapi.qweather.com';
        const url = new URL('/v7/weather/now', apiHost);
        url.searchParams.set('location', `${query.longitude},${query.latitude}`);
        url.searchParams.set('lang', 'zh');
        const response = await fetch(url, {
            headers: {
                'X-QW-Api-Key': apiKey,
            },
            signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) {
            throw new Error(`接口返回 ${response.status}`);
        }
        const payload = (await response.json());
        if (payload.code !== '200' || !payload.now) {
            throw new Error(`业务返回 ${payload.code ?? 'unknown'}`);
        }
        const temperatureC = this.parseTemperature(payload.now.temp);
        const conditionText = payload.now.text?.trim() || '天气未知';
        return this.createWeatherPayload({
            label: query.label,
            temperatureC,
            conditionText,
            icon: this.resolveQWeatherIcon(payload.now.icon),
            provider: 'qweather',
            observedAt: payload.now.obsTime ?? null,
        });
    }
    async fetchWeatherFromOpenMeteo(query) {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(query.latitude));
        url.searchParams.set('longitude', String(query.longitude));
        url.searchParams.set('current', 'temperature_2m,weather_code,is_day');
        url.searchParams.set('timezone', 'auto');
        const response = await fetch(url, {
            signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) {
            throw new Error(`接口返回 ${response.status}`);
        }
        const payload = (await response.json());
        const current = payload.current;
        if (!current) {
            throw new Error('缺少 current 数据');
        }
        const presentation = this.getOpenMeteoPresentation(current.weather_code, Number(current.is_day) === 1);
        const temperatureC = Number.isFinite(current.temperature_2m) ? Number(current.temperature_2m) : null;
        return this.createWeatherPayload({
            label: query.label,
            temperatureC,
            conditionText: presentation.text,
            icon: presentation.icon,
            provider: 'open-meteo',
            observedAt: current.time ?? null,
        });
    }
    createWeatherPayload(input) {
        const label = input.label?.trim() || '当前城市';
        const temperatureText = input.temperatureC === null || Number.isNaN(input.temperatureC)
            ? '--°C'
            : `${Math.round(input.temperatureC)}°C`;
        return {
            label,
            title: `今日天气：${temperatureText} ${input.conditionText}`,
            icon: input.icon,
            temperatureC: input.temperatureC,
            temperatureText,
            conditionText: input.conditionText,
            provider: input.provider,
            observedAt: input.observedAt,
            isStale: false,
        };
    }
    parseTemperature(value) {
        const temperature = Number(value);
        return Number.isFinite(temperature) ? temperature : null;
    }
    resolveQWeatherIcon(iconCode) {
        const code = Number(iconCode);
        if ([100, 150].includes(code))
            return code === 150 ? 'fa-moon' : 'fa-sun';
        if ([101, 102, 103, 151, 152, 153].includes(code)) {
            return code >= 151 ? 'fa-cloud-moon' : 'fa-cloud-sun';
        }
        if ([104, 154].includes(code))
            return 'fa-cloud';
        if ([300, 301, 305, 306, 307, 308, 309, 310, 311, 312, 313].includes(code)) {
            return 'fa-cloud-rain';
        }
        if ([302, 303, 304].includes(code))
            return 'fa-cloud-bolt';
        if ([400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410].includes(code)) {
            return 'fa-snowflake';
        }
        if ([500, 501, 509, 510, 514, 515].includes(code))
            return 'fa-smog';
        return 'fa-cloud';
    }
    getOpenMeteoPresentation(code, isDay = true) {
        const item = {
            0: { text: '晴', dayIcon: 'fa-sun', nightIcon: 'fa-moon' },
            1: { text: '大部晴朗', dayIcon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon' },
            2: { text: '局部多云', dayIcon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon' },
            3: { text: '阴', dayIcon: 'fa-cloud', nightIcon: 'fa-cloud' },
            45: { text: '有雾', dayIcon: 'fa-smog', nightIcon: 'fa-smog' },
            48: { text: '雾凇', dayIcon: 'fa-smog', nightIcon: 'fa-smog' },
            51: { text: '毛毛雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            53: { text: '小雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            55: { text: '中雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            56: { text: '冻毛毛雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            57: { text: '冻雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            61: { text: '小雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            63: { text: '中雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
            65: { text: '大雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
            66: { text: '冻雨', dayIcon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain' },
            67: { text: '强冻雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
            71: { text: '小雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            73: { text: '中雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            75: { text: '大雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            77: { text: '冰粒', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            80: { text: '阵雨', dayIcon: 'fa-cloud-sun-rain', nightIcon: 'fa-cloud-moon-rain' },
            81: { text: '较强阵雨', dayIcon: 'fa-cloud-sun-rain', nightIcon: 'fa-cloud-moon-rain' },
            82: { text: '强阵雨', dayIcon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy' },
            85: { text: '阵雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            86: { text: '强阵雪', dayIcon: 'fa-snowflake', nightIcon: 'fa-snowflake' },
            95: { text: '雷阵雨', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
            96: { text: '雷雨夹冰雹', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
            99: { text: '强雷雨冰雹', dayIcon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt' },
        }[Number(code)] || { text: '天气未知', dayIcon: 'fa-cloud', nightIcon: 'fa-cloud' };
        return {
            text: item.text,
            icon: isDay ? item.dayIcon : item.nightIcon,
        };
    }
    async leaderboard(classId, type) {
        const students = await this.prisma.student.findMany({
            where: {
                classId: BigInt(classId),
                deletedAt: null,
                status: 'enabled',
            },
            include: {
                profile: true,
                studentPet: {
                    include: {
                        pet: true,
                    },
                },
            },
        });
        const metric = type === 'pet-level'
            ? (item) => item.profile?.currentPetLevel ?? 1
            : (item) => item.profile?.currentScore ?? 0;
        const rows = [...students]
            .sort((a, b) => metric(b) - metric(a))
            .map((student, index) => ({
            rank: index + 1,
            id: (0, bigint_util_1.toNumber)(student.id),
            name: student.name,
            avatarUrl: student.avatarUrl,
            currentScore: student.profile?.currentScore ?? 0,
            currentPetLevel: student.profile?.currentPetLevel ?? 1,
            petName: student.studentPet?.pet.name ?? null,
        }));
        return { code: 0, message: 'ok', data: { classId, type: type === 'pet-level' ? 'pet-level' : 'score', rows } };
    }
    async petCatalog() {
        const [school, pets] = await Promise.all([
            this.prisma.school.findFirst({
                where: { status: 'enabled' },
                orderBy: { id: 'asc' },
                select: { petGrowthThresholds: true },
            }),
            this.prisma.pet.findMany({
                where: {
                    status: 'enabled',
                },
                include: {
                    stages: {
                        orderBy: { stageNo: 'asc' },
                    },
                },
                orderBy: [{ category: 'asc' }, { code: 'asc' }],
            }),
        ]);
        const petGrowthThresholds = (0, pet_growth_util_1.normalizePetGrowthThresholds)(school?.petGrowthThresholds);
        return {
            code: 0,
            message: 'ok',
            data: pets.map((pet) => ({
                id: (0, bigint_util_1.toNumber)(pet.id),
                code: pet.code,
                name: pet.name,
                category: pet.category,
                rarity: pet.rarity,
                description: pet.description,
                coverUrl: pet.coverUrl,
                sourceType: pet.sourceType,
                status: pet.status,
                stageCount: pet.stages.length,
                stages: pet.stages.map((stage) => ({
                    id: (0, bigint_util_1.toNumber)(stage.id),
                    stageNo: stage.stageNo,
                    levelNo: stage.levelNo,
                    name: stage.name,
                    imageUrl: stage.imageUrl,
                    needScoreTotal: (0, pet_growth_util_1.resolveStageNeedScoreTotal)(stage.stageNo, stage.needScoreTotal, petGrowthThresholds),
                    animationKey: stage.animationKey,
                })),
            })),
        };
    }
    async rewardCenter(classId) {
        const rewards = await this.prisma.reward.findMany({
            where: {
                status: 'enabled',
            },
            orderBy: [{ scoreCost: 'asc' }, { createdAt: 'desc' }],
        });
        const latestOrders = await this.prisma.rewardOrder.findMany({
            where: { classId: BigInt(classId) },
            include: {
                reward: true,
                student: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return {
            code: 0,
            message: 'ok',
            data: {
                classId,
                rewards: rewards.map((reward) => ({
                    id: (0, bigint_util_1.toNumber)(reward.id),
                    code: reward.code,
                    name: reward.name,
                    category: reward.category,
                    imageUrl: reward.imageUrl,
                    scoreCost: reward.scoreCost,
                    stockQty: reward.stockQty,
                    isInfiniteStock: reward.isInfiniteStock,
                })),
                latestOrders: latestOrders.map((order) => ({
                    id: (0, bigint_util_1.toNumber)(order.id),
                    studentId: (0, bigint_util_1.toNumber)(order.studentId),
                    studentName: order.student.name,
                    rewardId: (0, bigint_util_1.toNumber)(order.rewardId),
                    rewardName: order.reward.name,
                    scoreCost: order.scoreCost,
                    status: order.status,
                    createdAt: order.createdAt,
                })),
            },
        };
    }
};
exports.DisplayService = DisplayService;
exports.DisplayService = DisplayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        config_1.ConfigService,
        realtime_service_1.RealtimeService,
        operation_log_service_1.OperationLogService])
], DisplayService);
//# sourceMappingURL=display.service.js.map