import { useEffect, useMemo, useState, type CSSProperties, type ChangeEvent, type FormEvent, type SyntheticEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import type { 
  PetCatalogItem,
  PetUpsertPayload,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { resolveAssetUrl, resolvePetAssetVariantUrl } from '../lib/assets';
import type {
  PetFormState
} from '../types/admin';
import {
  buildAutoCode,
  createPetForm,
  normalizeKeyword
} from '../utils/adminForms';
import { canManageAdminConfig, canManagePets } from '../utils/adminPermissions';

type PetsPageProps = {
  token: string;
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};

const PET_CARD_ACCENTS = ['#39a0ed', '#33c26b', '#f5b11f', '#ef476f', '#9b5de5', '#2ec4b6'];
const PET_STAGE_COUNT = 10;
const PET_FAMILY_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'star', label: '星宠' },
  { key: 'zodiac', label: '十二生肖' },
] as const;

type PetFamilyKey =
  | 'all'
  | 'star'
  | 'zodiac'
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'hamster'
  | 'mythical'
  | 'other';

const PET_CATEGORY_META: Record<string, { family: PetFamilyKey; label: string }> = {
  star: { family: 'star', label: '星宠' },
  zodiac: { family: 'zodiac', label: '十二生肖' },
  cat: { family: 'cat', label: '猫咪系' },
  dog: { family: 'dog', label: '犬类系' },
  rabbit: { family: 'rabbit', label: '兔子系' },
  hamster: { family: 'hamster', label: '仓鼠系' },
  mythical: { family: 'mythical', label: '神兽系' },
  bird: { family: 'other', label: '飞羽系' },
  small_pet: { family: 'other', label: '小宠系' },
  wild: { family: 'other', label: '野趣系' },
  other: { family: 'other', label: '其他' },
};

export function PetsPage({
  token,
  user,
  loading,
  error,
}: PetsPageProps) {
  const { confirm } = useConfirmDialog();
  const [tab, setTab] = useState('all');
  const [pets, setPets] = useState<PetCatalogItem[]>([]);
  const [editingPet, setEditingPet] = useState<PetCatalogItem | null>(null);
  const [selectedPet, setSelectedPet] = useState<PetCatalogItem | null>(null);
  const [showCreatePet, setShowCreatePet] = useState(false);
  const [form, setForm] = useState<PetFormState>(() => createPetForm());
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'bindCountDesc' | 'bindCountAsc'>('default');
  const [uploadingStageNo, setUploadingStageNo] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedPreviewStage, setSelectedPreviewStage] = useState(1);
  const [defaultGrowthThresholds, setDefaultGrowthThresholds] = useState<number[]>([0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500]);
  const allowManage = canManagePets(user?.roleCode);

  async function loadPets() {
    setPageLoading(true);
    setSubmitError(null);
    try {
      const petsResponse = await adminApi.pets(token);
      setPets(petsResponse.data);

      if (allowManage) {
        try {
          if (canManageAdminConfig(user?.roleCode)) {
            const settingsResponse = await adminApi.settings(token);
            if (settingsResponse.data.school.petGrowth.thresholds?.length === 10) {
              setDefaultGrowthThresholds(settingsResponse.data.school.petGrowth.thresholds);
            }
          } else {
            const growthResponse = await adminApi.petGrowthThresholds(token);
            if (growthResponse.data.thresholds?.length === 10) {
              setDefaultGrowthThresholds(growthResponse.data.thresholds);
            }
          }
        } catch {
          // 阈值拉取失败不阻断图鉴列表
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '萌宠图鉴加载失败');
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    void loadPets();
  }, [allowManage, token]);
  const rarityOptions = useMemo(
    () => Array.from(new Set(pets.map((item) => item.rarity).filter((item): item is string => Boolean(item)))),
    [pets],
  );
  const visiblePetFamilyOptions = useMemo(() => {
    const familiesWithPets = new Set(pets.map((item) => resolvePetFamily(item.category)));
    return PET_FAMILY_OPTIONS.filter((option) => option.key === 'all' || familiesWithPets.has(option.key));
  }, [pets]);

  useEffect(() => {
    if (!visiblePetFamilyOptions.some((option) => option.key === tab)) {
      setTab('all');
    }
  }, [tab, visiblePetFamilyOptions]);

  const filteredPets = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    const filtered = pets.filter((item) => {
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(item.name).includes(keyword) ||
        normalizeKeyword(item.code).includes(keyword) ||
        normalizeKeyword(item.description ?? '').includes(keyword);
      const matchesTab = tab === 'all' || resolvePetFamily(item.category) === tab;
      const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || item.sourceType === sourceFilter;
      return matchesKeyword && matchesTab && matchesRarity && matchesStatus && matchesSource;
    });

    if (sortBy === 'bindCountDesc') {
      return [...filtered].sort((left, right) => right.bindCount - left.bindCount || left.name.localeCompare(right.name, 'zh-CN'));
    }
    if (sortBy === 'bindCountAsc') {
      return [...filtered].sort((left, right) => left.bindCount - right.bindCount || left.name.localeCompare(right.name, 'zh-CN'));
    }
    return filtered;
  }, [pets, rarityFilter, searchKeyword, sortBy, sourceFilter, statusFilter, tab]);

  function openCreatePet() {
    setEditingPet(null);
    setForm({ ...createPetForm(undefined, defaultGrowthThresholds), category: 'star' });
    setShowCreatePet(true);
    setSubmitError(null);
  }

  function openEditPet(pet: PetCatalogItem) {
    if (pet.sourceType === 'system') {
      setSubmitError('系统默认宠物只读，不允许编辑。');
      return;
    }
    setEditingPet(pet);
    setForm(createPetForm(pet));
    setShowCreatePet(false);
    setSubmitError(null);
  }

  function openPetDetails(pet: PetCatalogItem) {
    setSelectedPet(pet);
    setSelectedPreviewStage(1);
  }

  function closePetDetails() {
    setSelectedPet(null);
  }

  function closePetModal(force = false) {
    if (submitting && !force) return;
    setEditingPet(null);
    setShowCreatePet(false);
    setSubmitError(null);
    setUploadingStageNo(null);
    setUploadingCover(false);
  }

  function updateStageField(stageNo: number, field: keyof PetFormState['stages'][number], value: string | number) {
    setForm((prev) => ({
      ...prev,
      stages: prev.stages.map((stage) => (stage.stageNo === stageNo ? { ...stage, [field]: value } : stage)),
    }));
  }

  async function handleStageUpload(stageNo: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingStageNo(stageNo);
    setSubmitError(null);
    try {
      const response = await adminApi.uploadPetAsset(token, file);
      updateStageField(stageNo, 'imageUrl', response.data.url);
      if (stageNo === 1 && !form.coverUrl.trim()) {
        setForm((prev) => ({ ...prev, coverUrl: response.data.url }));
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '阶段图片上传失败');
    } finally {
      setUploadingStageNo(null);
    }
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    setSubmitError(null);
    try {
      const response = await adminApi.uploadPetAsset(token, file);
      setForm((prev) => ({ ...prev, coverUrl: response.data.url }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '封面上传失败');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handlePetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const name = form.name.trim();
      if (!form.code.trim() || !name) {
        throw new Error('请填写完整的萌宠名称');
      }
      if (form.stages.some((stage) => !stage.imageUrl.trim())) {
        throw new Error('请为 10 个等级阶段全部上传形态图片');
      }
      const payload: PetUpsertPayload = {
        code: buildAutoCode('pet', form.name, editingPet?.code || form.code),
        name,
        ...(form.category.trim() ? { category: form.category.trim() } : {}),
        ...(form.rarity.trim() ? { rarity: form.rarity.trim() } : {}),
        sourceType: form.sourceType,
        ...(form.coverUrl.trim() ? { coverUrl: form.coverUrl.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        stages: form.stages.map((stage) => ({
          stageNo: stage.stageNo,
          levelNo: stage.levelNo,
          name: stage.name.trim() || `${name}·Lv.${stage.stageNo}`,
          imageUrl: stage.imageUrl.trim(),
          needScoreTotal: Number(stage.needScoreTotal.trim() || '0'),
          animationKey: stage.animationKey.trim() || 'pet-level-up',
        })),
      };
      if (editingPet) {
        await adminApi.updatePet(token, editingPet.id, payload);
      } else {
        await adminApi.createPet(token, payload);
      }
      await loadPets();
      setSubmitSuccess(editingPet ? '萌宠已更新' : '萌宠已创建');
      closePetModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '萌宠保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePetStatus(item: PetCatalogItem) {
    if (item.sourceType === 'system') {
      setSubmitError('系统图鉴不允许停用，请保留为只读默认数据。');
      return;
    }
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled';
      await adminApi.updatePetStatus(token, item.id, nextStatus);
      await loadPets();
      setSubmitSuccess(nextStatus === 'enabled' ? '萌宠已启用' : '萌宠已停用');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '萌宠状态更新失败');
    }
  }

  async function deletePet(item: PetCatalogItem) {
    if (item.sourceType === 'system') {
      setSubmitError('系统图鉴不允许删除。');
      return;
    }
    const riskText =
      item.bindCount > 0
        ? `当前已有 ${item.bindCount} 名学生绑定，后端会阻止删除。建议改为停用。`
        : '当前没有学生绑定，删除后阶段配置也会一起移除。';
    const confirmed = await confirm({
      title: '删除萌宠',
      message: `确认删除萌宠「${item.name}」吗？\n${riskText}`,
      confirmLabel: '确认删除',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      await adminApi.deletePet(token, item.id);
      await loadPets();
      setSubmitSuccess('萌宠已删除');
      if (editingPet?.id === item.id) {
        closePetModal(true);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '萌宠删除失败');
    }
  }

  function resolvePetCategoryMeta(category: string | null | undefined) {
    if (!category) return PET_CATEGORY_META.other;
    const normalized = category.trim().toLowerCase();
    if (PET_CATEGORY_META[normalized]) return PET_CATEGORY_META[normalized];
    if (normalized.includes('星宠')) return PET_CATEGORY_META.star;
    if (normalized.includes('生肖')) return PET_CATEGORY_META.zodiac;
    if (normalized.includes('猫')) return PET_CATEGORY_META.cat;
    if (normalized.includes('狗') || normalized.includes('犬')) return PET_CATEGORY_META.dog;
    if (normalized.includes('兔')) return PET_CATEGORY_META.rabbit;
    if (normalized.includes('仓鼠') || normalized.includes('鼠')) return PET_CATEGORY_META.hamster;
    if (normalized.includes('神') || normalized.includes('龙')) return PET_CATEGORY_META.mythical;
    return PET_CATEGORY_META.other;
  }

  function resolvePetFamily(category: string | null | undefined): PetFamilyKey {
    return resolvePetCategoryMeta(category).family;
  }

  function getPetFamilyLabel(category: string | null | undefined) {
    const family = resolvePetFamily(category);
    return PET_FAMILY_OPTIONS.find((option) => option.key === family)?.label ?? '其他';
  }

  function getPetSubcategoryLabel(category: string | null | undefined) {
    const meta = resolvePetCategoryMeta(category);
    const familyLabel = getPetFamilyLabel(category);
    return meta.label !== familyLabel ? meta.label : null;
  }

  function getPetAccentStyle(item: PetCatalogItem): CSSProperties {
    const familyIndex = PET_FAMILY_OPTIONS.findIndex((option) => option.key === resolvePetFamily(item.category));
    const accent = PET_CARD_ACCENTS[(familyIndex > 0 ? familyIndex - 1 : 0) % PET_CARD_ACCENTS.length];
    return { '--pet-accent': accent, '--pet-accent-rgb': hexToRgbChannels(accent) } as CSSProperties;
  }

  function hexToRgbChannels(hex: string) {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
    const int = Number.parseInt(value, 16);
    if (Number.isNaN(int)) return '57, 160, 237';
    return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
  }

  function getPetStages(item: Pick<PetCatalogItem, 'stages'>) {
    return Array.isArray(item.stages) ? item.stages : [];
  }

  function getStageByNo(item: Pick<PetCatalogItem, 'stages'>, stageNo: number) {
    return getPetStages(item).find((stage) => stage.stageNo === stageNo) ?? null;
  }

  function getCardPreviewImage(item: PetCatalogItem) {
    return getStageByNo(item, 1)?.imageUrl ?? item.coverUrl;
  }

  function getSelectedPreviewImage() {
    if (!selectedPet) return null;
    return getStageByNo(selectedPet, selectedPreviewStage)?.imageUrl ?? selectedPet.coverUrl;
  }

  function handlePetHighResFallback(event: SyntheticEvent<HTMLImageElement>, fallbackUrl: string | null | undefined) {
    const resolvedFallback = resolvePetAssetVariantUrl(fallbackUrl, 400);
    if (resolvedFallback && event.currentTarget.src !== resolvedFallback) {
      event.currentTarget.src = resolvedFallback;
    }
  }

  return (
    <Shell
      title="萌宠图鉴"
      subtitle="整理学校当前实际使用的萌宠分布，保持与展示端形象体系一致"
      loading={loading || pageLoading}
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">萌宠数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? <div className="status-card error">{submitError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>萌宠图鉴</h2>
        <div className="page-actions">
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder="搜索萌宠名称..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select className="filter-select" value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
            <option value="all">全部稀有度</option>
            {rarityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">全部状态</option>
            <option value="enabled">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <select className="filter-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}>
            <option value="all">全部来源</option>
            <option value="system">系统图鉴</option>
            <option value="custom">自定义图鉴</option>
          </select>
          <select className="filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
            <option value="default">默认排序</option>
            <option value="bindCountDesc">被选最多</option>
            <option value="bindCountAsc">被选最少</option>
          </select>
          {allowManage ? (
            <button className="btn btn-primary" type="button" onClick={openCreatePet}>
              + 新增萌宠
            </button>
          ) : null}
        </div>
      </div>
      <div className="pet-filters">
        {visiblePetFamilyOptions.map((option) => (
          <button key={option.key} type="button" className={`pet-filter-tab${tab === option.key ? ' active' : ''}`} onClick={() => setTab(option.key)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="pet-grid">
        {filteredPets.map((item) => (
          <article
            className={`pet-card pet-catalog-card${item.sourceType === 'custom' && item.status === 'disabled' ? ' is-disabled' : ''}`}
            key={item.id}
            style={getPetAccentStyle(item)}
          >
            <button className="pet-catalog-tile" type="button" onClick={() => openPetDetails(item)} aria-label={`查看${item.name}进化图谱`}>
              <div className="pet-catalog-visual">
                {getCardPreviewImage(item) ? (
                  <img src={resolveAssetUrl(getCardPreviewImage(item) ?? '')} alt="" />
                ) : (
                  <span className="pet-catalog-fallback">{item.name.slice(0, 1)}</span>
                )}
              </div>
              <div className="pet-catalog-meta">
                <span className="pet-catalog-name">{item.name}</span>
                <span className="pet-catalog-count">{item.bindCount} 名学生已选</span>
                {item.sourceType === 'custom' ? <span className="pet-catalog-kind">自定义</span> : null}
              </div>
            </button>
            {allowManage && item.sourceType === 'custom' ? (
              <div className="pet-catalog-manage">
                <button
                  className="pet-manage-btn"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditPet(item);
                  }}
                  title="编辑"
                >
                  编
                </button>
                <button
                  className="pet-manage-btn"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void togglePetStatus(item);
                  }}
                  title={item.status === 'enabled' ? '停用' : '启用'}
                >
                  {item.status === 'enabled' ? '停' : '启'}
                </button>
                <button
                  className="pet-manage-btn danger"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void deletePet(item);
                  }}
                  title="删除"
                >
                  删
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {filteredPets.length === 0 ? <div className="settings-note">当前筛选条件下暂无萌宠数据。</div> : null}
      </div>
      {selectedPet ? (
        <Modal
          title={`${selectedPet.name} · 进化图谱`}
          subtitle={selectedPet.description?.trim() || `完整展示 ${selectedPet.name} 从 Lv.1 到 Lv.${getPetStages(selectedPet).length} 的形态变化与累计积分。`}
          onClose={closePetDetails}
        >
          <div className="pet-evolution-shell">
            <div className="pet-evolution-hero">
              <div className="pet-evolution-cover">
                {getSelectedPreviewImage() ? (
                  <img
                    src={resolvePetAssetVariantUrl(getSelectedPreviewImage(), 1024)}
                    alt={selectedPet.name}
                    onError={(event) => handlePetHighResFallback(event, getSelectedPreviewImage())}
                  />
                ) : selectedPet.name.slice(0, 1)}
              </div>
              <div className="pet-evolution-summary">
                <div className="pet-catalog-tags">
                  <span className="pet-category-pill">{getPetFamilyLabel(selectedPet.category)}</span>
                  {getPetSubcategoryLabel(selectedPet.category) ? <span className="pet-subcategory-pill">{getPetSubcategoryLabel(selectedPet.category)}</span> : null}
                  <span className={`pet-source-pill ${selectedPet.sourceType}`}>
                    {selectedPet.sourceType === 'system' ? '系统图鉴' : '自定义图鉴'}
                  </span>
                  {selectedPet.sourceType === 'custom' ? (
                    <span className={`pet-status-pill ${selectedPet.status}`}>
                      {selectedPet.status === 'enabled' ? '启用中' : '已停用'}
                    </span>
                  ) : null}
                </div>
                <h4>{selectedPet.name}</h4>
                <p>{selectedPet.description?.trim() || '当前宠物已配置完整升级形态，展示端会按阶段图直接呈现升级后的外观。'}</p>
                <div className="pet-evolution-metrics">
                  <div>
                    <span>来源</span>
                    <strong>{selectedPet.sourceType === 'system' ? '系统默认图鉴' : '自定义图鉴'}</strong>
                  </div>
                  <div>
                    <span>最高等级</span>
                    <strong>Lv.{selectedPet.maxLevel}</strong>
                  </div>
                  <div>
                    <span>已被选择</span>
                    <strong>{selectedPet.bindCount} 名学生</strong>
                  </div>
                  <div>
                    <span>状态</span>
                    <strong>{selectedPet.sourceType === 'system' ? '默认启用' : selectedPet.status === 'enabled' ? '启用中' : '已停用'}</strong>
                  </div>
                </div>
                <div className="pet-growth-strip pet-growth-strip-detail" aria-label={`${selectedPet.name}阶段预览切换`}>
                  {Array.from({ length: PET_STAGE_COUNT }, (_, index) => (
                    <button
                      type="button"
                      key={index + 1}
                      className={`pet-growth-dot${index < getPetStages(selectedPet).length ? ' active' : ''}${selectedPreviewStage === index + 1 ? ' current' : ''}`}
                      title={`Lv.${index + 1}`}
                      onClick={() => setSelectedPreviewStage(index + 1)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="pet-evolution-grid">
              {getPetStages(selectedPet).map((stage) => (
                <div className="pet-evolution-card" key={stage.stageNo}>
                  <div className="pet-evolution-stage-badge">Lv.{stage.stageNo}</div>
                  <div className="pet-evolution-stage-image">
                    <img src={resolveAssetUrl(stage.imageUrl)} alt={stage.name || `${selectedPet.name} Lv.${stage.stageNo}`} />
                  </div>
                  <strong>{stage.name || `${selectedPet.name} · Lv.${stage.stageNo}`}</strong>
                  <span>累计积分 {stage.needScoreTotal}</span>
                </div>
              ))}
              {getPetStages(selectedPet).length === 0 ? <div className="settings-note">当前宠物还没有配置进化阶段图片。</div> : null}
            </div>
          </div>
        </Modal>
      ) : null}
      {showCreatePet || editingPet ? (
        <Modal
          title={editingPet ? '编辑萌宠' : '新增萌宠'}
          subtitle=""
          onClose={closePetModal}
        >
          <form className="form-grid" onSubmit={handlePetSubmit}>
            <label>
              <span>萌宠名称</span>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              <span>分类</span>
              <select value={form.category || 'star'} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                <option value="star">星宠</option>
                <option value="zodiac">十二生肖</option>
              </select>
            </label>
            <label>
              <span>稀有度</span>
              <input value={form.rarity} onChange={(event) => setForm((prev) => ({ ...prev, rarity: event.target.value }))} />
            </label>
            <label>
              <span>来源类型</span>
              <select value={form.sourceType} onChange={(event) => setForm((prev) => ({ ...prev, sourceType: event.target.value as PetFormState['sourceType'] }))}>
                <option value="custom">自定义上传</option>
                <option value="system">系统图鉴</option>
              </select>
            </label>
            <label className="span-2">
              <span>封面地址</span>
              <input value={form.coverUrl} onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))} />
            </label>
            <label className="span-2">
              <span>上传封面</span>
              <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover || submitting} />
              {form.coverUrl ? <div className="settings-note">当前封面：{form.coverUrl}</div> : null}
            </label>
            <label className="span-2">
              <span>描述</span>
              <textarea rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <div className="span-2 detail-card">
              <h4>升级形态配置</h4>
              <div className="settings-note">每个等级都可以配置独立图片，展示端和升级逻辑都会直接使用这些阶段图。</div>
              <div className="detail-list">
                {form.stages.map((stage) => (
                  <div key={stage.stageNo} className="pet-stage-row">
                    <strong>Lv.{stage.stageNo}</strong>
                    <input
                      value={stage.name}
                      onChange={(event) => updateStageField(stage.stageNo, 'name', event.target.value)}
                      placeholder={`Lv.${stage.stageNo} 名称`}
                    />
                    <input
                      value={stage.needScoreTotal}
                      onChange={(event) => updateStageField(stage.stageNo, 'needScoreTotal', event.target.value)}
                      placeholder="累计积分"
                    />
                    <input
                      value={stage.imageUrl}
                      onChange={(event) => updateStageField(stage.stageNo, 'imageUrl', event.target.value)}
                      placeholder="阶段图片地址"
                    />
                    <input
                      value={stage.animationKey}
                      onChange={(event) => updateStageField(stage.stageNo, 'animationKey', event.target.value)}
                      placeholder="动画标识"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleStageUpload(stage.stageNo, event)}
                      disabled={uploadingStageNo === stage.stageNo || submitting}
                    />
                    {stage.imageUrl ? <img className="pet-stage-thumb" src={resolveAssetUrl(stage.imageUrl)} alt={stage.name || `Lv.${stage.stageNo}`} /> : null}
                  </div>
                ))}
              </div>
            </div>
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="form-actions span-2">
              <button type="button" className="ghost-button" onClick={() => closePetModal()} disabled={submitting}>取消</button>
              <button type="submit" className="toolbar-button" disabled={submitting}>
                {submitting ? '提交中...' : editingPet ? '保存修改' : '创建萌宠'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}
