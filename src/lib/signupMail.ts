import { encodeAccountTicket, type Account } from './accounts';

/** 가입 신청이 도착할 개발자 이메일. 친구 폰이 이 주소로 신청을 보냅니다. */
export const ADMIN_EMAIL = '26-3721@swjb.hs.kr';

export type MailResult = {
  ok: boolean;
  activate: boolean;
};

function joinLink(ticket: string): string {
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  url.searchParams.set('join', ticket);
  return url.toString();
}

async function postMail(to: string, fields: Record<string, string>): Promise<MailResult> {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _captcha: 'false',
        _template: 'box',
        ...fields,
      }),
    });
    const data = (await response.json().catch(() => null)) as { success?: boolean | string; message?: string } | null;
    const message = data?.message ?? '';
    const activate = /activat/i.test(message);
    const ok = response.ok && data?.success !== false && data?.success !== 'false' && !activate;
    return { ok, activate };
  } catch {
    return { ok: false, activate: false };
  }
}

export function sendSignupMail(account: Account): Promise<MailResult> {
  const link = joinLink(encodeAccountTicket(account));
  return postMail(ADMIN_EMAIL, {
    _subject: '포커스 포레스트 가입 신청',
    nickname: account.nickname,
    email: account.email,
    message: '링크를 열면 이 기기의 가입 신청 목록에 바로 들어와요.',
    link,
  });
}

export function sendApprovalMail(account: Account): Promise<MailResult> {
  const link = joinLink(encodeAccountTicket({ ...account, status: 'approved' }));
  return postMail(account.email, {
    _subject: '포커스 포레스트 가입이 승낙되었어요',
    nickname: account.nickname,
    message: '이 링크를 가입했던 폰에서 열면 로그인할 수 있어요.',
    link,
  });
}

const mailedKey = (id: string) => `ff-signup-mailed-${id}`;

export async function deliverSignup(account: Account): Promise<MailResult> {
  const key = mailedKey(account.id);
  const mark = localStorage.getItem(key);
  if (mark === '1' || mark === 'sending') return { ok: mark === '1', activate: false };
  if (mark === 'activate' && sessionStorage.getItem(key) === '1') return { ok: false, activate: true };
  localStorage.setItem(key, 'sending');
  const result = await sendSignupMail(account);
  if (result.ok) localStorage.setItem(key, '1');
  else if (result.activate) {
    localStorage.setItem(key, 'activate');
    sessionStorage.setItem(key, '1');
  } else localStorage.removeItem(key);
  return result;
}
