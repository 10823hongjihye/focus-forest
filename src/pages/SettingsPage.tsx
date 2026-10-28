import { useEffect, useRef, useState } from 'react';
import { Bell, Leaf, Music, Plus, Timer, UserRound } from 'lucide-react';
import type { SettingsTab } from '../types';
import { Bear } from '../components/Bear';
import { ThemeArt } from '../components/Illustrations';
import { Segmented, Switch } from '../components/ui';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/Auth';
import { usePlayer } from '../context/Player';
import { useTimer } from '../context/Timer';
import { useNav } from '../context/nav';
import { ACCENT_SWATCHES, BG_SWATCHES, CHARACTERS, POMODORO_OPTIONS, SUBJECTS, THEME_ORDER, THEME_PRESETS } from '../lib/constants';
import { normalizeHex } from '../lib/color';
import { readBackgroundFile } from '../lib/background';
import { cx } from '../lib/cx';
import { formatGoal } from '../lib/time';

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Leaf }> = [
  { id: 'theme', label: '테마', icon: Leaf },
  { id: 'music', label: '음악', icon: Music },
  { id: 'timer', label: '타이머', icon: Timer },
  { id: 'alert', label: '알림', icon: Bell },
  { id: 'account', label: '계정', icon: UserRound },
];

export function SettingsPage() {
  const { data, updateSettings, applyTheme, showToast, resetAll, replayIntro, addCustomTracks, removeCustomTrack } = useAppState();
  const { session, accounts, approveAccount, rejectAccount, removeAccount, logout, syncNotice, approvalFocus, clearApprovalFocus } = useAuth();
  const { resetTimer } = useTimer();
  const player = usePlayer();
  const { go } = useNav();
  const [tab, setTab] = useState<SettingsTab>(approvalFocus && session?.role === 'developer' ? 'account' : 'theme');
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    approvalFocus && session?.role === 'developer' ? 'pending' : 'all',
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [adderOpen, setAdderOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { settings } = data;

  useEffect(() => {
    if (!approvalFocus || session?.role !== 'developer') return;
    setTab('account');
    setMemberFilter('pending');
    clearApprovalFocus();
  }, [approvalFocus, clearApprovalFocus, session]);

  const enableNotifications = async (on: boolean) => {
    updateSettings({ notifications: on });
    if (!on || typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return;
    try {
      const result = await Notification.requestPermission();
      if (result !== 'granted') showToast('브라우저에서 알림이 허용되지 않았어요. 앱 안 알림은 그대로 보여요.');
    } catch {
      showToast('이 브라우저에서는 알림을 쓸 수 없어요.');
    }
  };

  return (
    <div className="page settings-page">
      <h1 className="page-title">설정 & 테마</h1>
      <div className="settings-nav">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button key={item.id} type="button" className={cx(active && 'is-on')} onClick={() => setTab(item.id)} aria-pressed={active}>
              <span className="bubble">
                <Icon size={18} />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'theme' && (
        <>
          <section className="card stack">
            <h2 className="section-label">글자 크기</h2>
            <label className="field">
              <span>{Math.round(settings.fontScale * 100)}%</span>
              <input
                type="range"
                min={85}
                max={130}
                step={5}
                value={Math.round(settings.fontScale * 100)}
                aria-label="글자 크기"
                onChange={(event) => updateSettings({ fontScale: Number(event.target.value) / 100 })}
              />
            </label>
            <p className="font-sample">안녕하세요, 포커스 포레스트</p>
          </section>
          <h2 className="section-label">테마 선택</h2>
          <div className="theme-picks">
            {THEME_ORDER.map((id) => (
              <button key={id} type="button" className={cx('theme-pick', settings.theme === id && 'is-on')} onClick={() => applyTheme(id)}>
                <span className="theme-pick-art">
                  <ThemeArt theme={id} />
                </span>
                <span>{THEME_PRESETS[id].name.replace(' 테마', '')}</span>
              </button>
            ))}
          </div>
          <h2 className="section-label">색상 커스터마이징</h2>
          <p className="swatch-label">포인트</p>
          <div className="swatches">
            {[...ACCENT_SWATCHES, ...settings.customAccents].map((hex) => (
              <button
                key={hex}
                type="button"
                className={cx('swatch', sameHex(settings.accent, hex) && 'is-on')}
                style={{ background: hex }}
                aria-label={`포인트 컬러 ${hex}`}
                aria-pressed={sameHex(settings.accent, hex)}
                onClick={() => updateSettings({ accent: hex })}
              />
            ))}
            <ColorAdd
              label="포인트 색상 추가"
              current={settings.accent}
              existing={[...ACCENT_SWATCHES, ...settings.customAccents]}
              onAdd={(hex) => {
                const known = [...ACCENT_SWATCHES, ...settings.customAccents].some((item) => sameHex(item, hex));
                updateSettings(known ? { accent: hex } : { customAccents: [...settings.customAccents, hex], accent: hex });
              }}
            />
          </div>
          <p className="swatch-label">배경</p>
          <div className="swatches">
            {[...BG_SWATCHES, ...settings.customBgColors].map((hex) => (
              <button
                key={hex}
                type="button"
                className={cx('swatch light', !settings.bgImage && sameHex(settings.bg, hex) && 'is-on')}
                style={{ background: hex }}
                aria-label={`배경색 ${hex}`}
                aria-pressed={!settings.bgImage && sameHex(settings.bg, hex)}
                onClick={() => updateSettings({ bg: hex, bgImage: '' })}
              />
            ))}
            {settings.savedBgImage && (
              <button
                type="button"
                className={cx('swatch image-swatch', settings.bgImage && 'is-on')}
                style={{ backgroundImage: `url("${settings.savedBgImage}")` }}
                aria-label="배경 이미지"
                aria-pressed={Boolean(settings.bgImage)}
                onClick={() => updateSettings({ bgImage: settings.savedBgImage })}
              />
            )}
            <BackgroundAdd
              current={settings.bg}
              existing={[...BG_SWATCHES, ...settings.customBgColors]}
              onColor={(hex) => {
                const known = [...BG_SWATCHES, ...settings.customBgColors].some((item) => sameHex(item, hex));
                updateSettings(known ? { bg: hex, bgImage: '' } : { customBgColors: [...settings.customBgColors, hex], bg: hex, bgImage: '' });
              }}
              onImage={(image) => updateSettings({ savedBgImage: image, bgImage: image })}
            />
          </div>
          <h2 className="section-label">캐릭터 선택</h2>
          <div className="characters">
            {CHARACTERS.map((character) => (
              <button
                key={character.id}
                type="button"
                className={cx('character', settings.character === character.id && 'is-on')}
                aria-label={character.name}
                aria-pressed={settings.character === character.id}
                onClick={() => updateSettings({ character: character.id })}
              >
                <Bear character={character.id} crop="face" size={48} />
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost wide" onClick={() => go('study', 'shop')}>
            캐릭터 옷 입히기
          </button>
        </>
      )}

      {tab === 'music' && (
        <section className="card stack">
          <h2 className="section-label">음악 설정</h2>
          <Switch on={settings.musicEnabled} label="배경 음악" onChange={(musicEnabled) => updateSettings({ musicEnabled })} />
          <label className="field">
            <span>음량 {Math.round(settings.musicVolume * 100)}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(event) => updateSettings({ musicVolume: Number(event.target.value) / 100 })}
            />
          </label>
          <div className="track-list" role="listbox" aria-label="재생할 음악">
            {player.tracks.map((song, index) => {
              const mine = song.id.startsWith('user-');
              return (
                <div key={song.id} className={cx('track-line', mine && 'is-mine')}>
                  <button
                    type="button"
                    role="option"
                    className={cx('track-pick', index === player.trackIndex && 'is-on')}
                    aria-selected={index === player.trackIndex}
                    onClick={() => player.select(index)}
                  >
                    {song.title}
                  </button>
                  {mine && (
                    <button
                      type="button"
                      className="track-remove"
                      aria-label={`${song.title} 삭제`}
                      onClick={() => {
                        if (player.track.id === song.id) player.stop();
                        removeCustomTrack(song.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="muted">목록의 이름은 넣어 둔 음악 파일 이름이에요. 공부 화면에서 재생하면 고른 곡이 나와요.</p>
          <button
            type="button"
            className="btn-ghost wide"
            aria-expanded={adderOpen}
            onClick={() => setAdderOpen((open) => !open)}
          >
            <Plus size={16} />
            음악 추가하기
          </button>
          {adderOpen && (
            <div
              className={cx('music-drop', dragOver && 'is-over')}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setDragOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                void addCustomTracks(event.dataTransfer.files);
              }}
            >
              <p>mp3 파일을 이 칸으로 끌어다 놓으세요</p>
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                파일 선택
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".mp3,audio/mpeg"
                multiple
                hidden
                onChange={(event) => {
                  void addCustomTracks(event.target.files);
                  event.target.value = '';
                }}
              />
            </div>
          )}
        </section>
      )}

      {tab === 'timer' && (
        <section className="stack">
          <h2 className="section-label">타이머 설정</h2>
          <Segmented
            label="타이머 모드"
            value={settings.timerMode}
            onChange={(timerMode) => updateSettings({ timerMode })}
            options={[
              { id: 'pomodoro', label: '포모도로' },
              { id: 'countup', label: '순공 타이머' },
            ]}
          />
          <div className="card stack">
            <p className="kicker">집중 시간</p>
            <div className="chip-row">
              {POMODORO_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={cx('chip', settings.pomodoroMin === minutes && 'is-on')}
                  onClick={() => updateSettings({ pomodoroMin: minutes })}
                >
                  {minutes}분
                </button>
              ))}
            </div>
            <label className="field">
              <span>하루 목표 {formatGoal(settings.dailyGoalMin)}</span>
              <input
                type="range"
                min={1}
                max={12}
                value={Math.round(settings.dailyGoalMin / 60)}
                onChange={(event) => updateSettings({ dailyGoalMin: Number(event.target.value) * 60 })}
              />
            </label>
          </div>
          <div className="card goal-edit">
            <p className="kicker">과목별 주간 목표</p>
            {SUBJECTS.map((subject) => (
              <label key={subject.id} className="field inline-field">
                <span>{subject.name}</span>
                <input
                  type="number"
                  min={0.5}
                  max={40}
                  step={0.5}
                  value={settings.subjectGoals[subject.id] / 60}
                  onChange={(event) => {
                    const hours = Number(event.target.value);
                    if (!Number.isFinite(hours)) return;
                    updateSettings({
                      subjectGoals: {
                        ...settings.subjectGoals,
                        [subject.id]: Math.min(2400, Math.max(30, Math.round(hours * 60))),
                      },
                    });
                  }}
                />
                <em>시간</em>
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === 'alert' && (
        <section className="card stack">
          <h2 className="section-label">알림 설정</h2>
          <Switch on={settings.notifications} label="타이머 종료 알림" onChange={(on) => void enableNotifications(on)} />
          <p className="muted">포모도로가 끝나면 브라우저 알림과 앱 안 메시지를 보여줘요. 권한을 허용해야 브라우저 알림이 도착해요.</p>
        </section>
      )}

      {tab === 'account' && (
        <section className="card stack">
          <h2 className="section-label">계정</h2>
          {session?.role === 'developer' && (
            <div className="stack">
              <h3 className="section-label">회원 가입 신청</h3>
              <p className="muted">가입 신청은 이 목록에 모여요. 승인된 계정만 로그인할 수 있고, 비밀번호는 표시하지 않아요.</p>
              {syncNotice && <p className="auth-notice">{syncNotice}</p>}
              <Segmented
                label="회원 상태"
                value={memberFilter}
                onChange={setMemberFilter}
                options={[
                  { id: 'all', label: '전체' },
                  { id: 'pending', label: '대기' },
                  { id: 'approved', label: '승인' },
                  { id: 'rejected', label: '거절' },
                ]}
              />
              {accounts.length === 0 && <p className="muted">아직 가입한 사용자가 없어요.</p>}
              <ul className="member-list">
                {accounts
                  .filter((account) => memberFilter === 'all' || account.status === memberFilter)
                  .map((account) => (
                  <li key={account.id} className="member-row">
                    <div className="member-facts">
                      <strong>{account.nickname}</strong>
                      <span>{account.email}</span>
                      <span>
                        {new Date(account.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {account.status === 'approved' ? '승인됨' : account.status === 'rejected' ? '거절됨' : '승인 대기'}
                      </span>
                    </div>
                    <div className="member-actions">
                      {account.status !== 'approved' && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            void approveAccount(account.id).then((result) => {
                              if (!result) return;
                              if (result.ok) {
                                showToast('승인했어요. 이제 로그인할 수 있어요.');
                                return;
                              }
                              if (result.needsVerify) {
                                showToast('승인 목록이 아직 활성화되지 않아 저장하지 못했어요.');
                                return;
                              }
                              showToast('승인을 저장하지 못했어요. 다시 눌러 주세요.');
                            });
                          }}
                        >
                          승인
                        </button>
                      )}
                      {account.status !== 'rejected' && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            void rejectAccount(account.id).then((result) => {
                              if (!result) return;
                              if (result.ok) {
                                showToast('가입을 거절했어요. 그 계정은 로그인할 수 없어요.');
                                return;
                              }
                              if (result.needsVerify) {
                                showToast('승인 목록이 아직 활성화되지 않아 거절을 저장하지 못했어요.');
                                return;
                              }
                              showToast('거절을 저장하지 못했어요. 다시 눌러 주세요.');
                            });
                          }}
                        >
                          거절
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          void removeAccount(account.id).then((result) => {
                            if (result.ok) {
                              showToast('가입 정보를 지웠어요.');
                              return;
                            }
                            if (result.needsVerify) {
                              showToast('승인 목록이 아직 활성화되지 않아 지우지 못했어요.');
                              return;
                            }
                            showToast('가입 정보를 지우지 못했어요. 다시 눌러 주세요.');
                          });
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {accounts.length > 0 && accounts.every((account) => memberFilter !== 'all' && account.status !== memberFilter) && (
                <p className="muted">이 상태의 가입자가 없어요.</p>
              )}
            </div>
          )}
          <label className="field">
            <span>이름</span>
            <input
              value={settings.displayName}
              maxLength={20}
              onChange={(event) => updateSettings({ displayName: event.target.value })}
              placeholder="이름을 입력해 주세요"
            />
          </label>
          <p className="muted">홈 화면 인사말에 이 이름이 보여요.</p>
          <button type="button" className="btn-ghost" onClick={replayIntro}>
            시작 안내 다시 보기
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              player.stop();
              logout();
            }}
          >
            로그아웃
          </button>
          {confirmReset ? (
            <div className="confirm-box">
              <p>할 일, 다이어리, 공부 기록을 모두 지울까요?</p>
              <div className="row-gap">
                <button
                  type="button"
                  className="btn-ghost danger"
                  onClick={() => {
                    player.stop();
                    resetTimer();
                    resetAll();
                  }}
                >
                  초기화
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-ghost danger" onClick={() => setConfirmReset(true)}>
              데이터 초기화
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function sameHex(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function ColorAdd({
  label,
  current,
  existing,
  onAdd,
}: {
  label: string;
  current: string;
  existing: string[];
  onAdd: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);
  const [error, setError] = useState('');
  const preview = normalizeHex(draft) ?? current;

  const confirm = () => {
    const hex = normalizeHex(draft);
    if (!hex) {
      setError('색상 코드를 확인해 주세요. 예: #6F8B62');
      return;
    }
    if (existing.some((item) => sameHex(item, hex)) && sameHex(current, hex)) {
      setError('이미 선택된 색이에요.');
      return;
    }
    onAdd(hex);
    setError('');
    setOpen(false);
  };

  return (
    <div className={cx('add-anchor', open && 'is-open')}>
      <button type="button" className={cx('add-swatch', open && 'is-on')} aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Plus size={16} />
      </button>
      {open && (
        <div className="picker">
          <div className="picker-row">
            <span className="picker-preview" style={{ background: preview }} aria-hidden />
            <input
              type="color"
              aria-label="색상 팔레트"
              value={normalizeHex(draft) ?? '#6F8B62'}
              onChange={(event) => {
                setDraft(event.target.value);
                setError('');
              }}
            />
            <input
              className="hex-input"
              value={draft}
              maxLength={7}
              spellCheck={false}
              aria-label="색상 코드"
              placeholder="#6F8B62"
              onChange={(event) => {
                setDraft(event.target.value);
                setError('');
              }}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="row-gap">
            <button type="button" className="btn-primary slim" onClick={confirm}>
              추가
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackgroundAdd({
  current,
  existing,
  onColor,
  onImage,
}: {
  current: string;
  existing: string[];
  onColor: (hex: string) => void;
  onImage: (image: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);
  const [previewImage, setPreviewImage] = useState('');
  const [error, setError] = useState('');
  const color = normalizeHex(draft) ?? current;

  const confirmColor = () => {
    const hex = normalizeHex(draft);
    if (!hex) {
      setError('색상 코드를 확인해 주세요. 예: #F6F1E6');
      return;
    }
    if (existing.some((item) => sameHex(item, hex)) && sameHex(current, hex) && !previewImage) {
      setError('이미 선택된 배경색이에요.');
      return;
    }
    onColor(hex);
    setPreviewImage('');
    setError('');
    setOpen(false);
  };

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const image = await readBackgroundFile(file);
      setPreviewImage(image);
      setError('');
    } catch (reason) {
      setPreviewImage('');
      setError(reason instanceof Error ? reason.message : '이미지를 열 수 없어요.');
    }
  };

  return (
    <div className={cx('add-anchor', open && 'is-open')}>
      <button type="button" className={cx('add-swatch', open && 'is-on')} aria-label="배경 추가" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Plus size={16} />
      </button>
      {open && (
        <div className="picker">
          <div className="picker-row">
            <span
              className="picker-preview"
              style={previewImage ? { backgroundImage: `url("${previewImage}")` } : { background: color }}
              aria-hidden
            />
            <input
              type="color"
              aria-label="배경 색상 팔레트"
              value={normalizeHex(draft) ?? '#F6F1E6'}
              onChange={(event) => {
                setDraft(event.target.value);
                setPreviewImage('');
                setError('');
              }}
            />
            <input
              className="hex-input"
              value={draft}
              maxLength={7}
              spellCheck={false}
              aria-label="배경 색상 코드"
              placeholder="#F6F1E6"
              onChange={(event) => {
                setDraft(event.target.value);
                setPreviewImage('');
                setError('');
              }}
            />
          </div>
          <div className="row-gap">
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
              이미지 선택
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                void chooseFile(file);
              }}
            />
            {previewImage && (
              <button
                type="button"
                className="btn-primary slim"
                onClick={() => {
                  onImage(previewImage);
                  setOpen(false);
                }}
              >
                이미지 적용
              </button>
            )}
          </div>
          <p className="muted">JPG, PNG, WEBP, GIF · 4MB 이하. 색을 고르면 이미지는 잠시 내려가요.</p>
          {error && <p className="form-error">{error}</p>}
          <div className="row-gap">
            <button type="button" className="btn-primary slim" onClick={confirmColor}>
              색상 추가
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
