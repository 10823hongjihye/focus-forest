/**
 * 시작 안내 화면 위치
 *
 * 이 파일의 숫자만 바꾸면 화면에 바로 반영됩니다.
 * 단위는 px 입니다. 양수는 오른쪽 / 아래입니다.
 */
export const ONBOARD_DESIGN = {
  /**
   * 첫 화면에서 곰·로고·문구 묶음을 위에서 얼마나 내릴지.
   * 키우면 아래로 내려갑니다. 시작하기 버튼은 이 값과 상관없이 화면 아래에 있습니다.
   */
  splashOffsetY: 40,
  /**
   * 곰만 위아래로 옮깁니다. 음수면 위입니다.
   * 로고와 문구는 그대로입니다.
   */
  splashBearY: -10,
  /** 레코드 위에 앉은 곰 그림 너비. 그림은 forest-img/on-record.png 이고, 고른 캐릭터와 상관없이 이 그림으로 고정입니다. */
  splashBearWidth: 200,
  /** 곰 그림과 로고 그림 사이 간격. */
  splashBearLogoGap: 7,
  /**
   * 로고만 위아래로 옮깁니다. 음수면 위입니다.
   * 문구는 아래 간격(splashLogoCopyGap)을 유지한 채 로고를 따라갑니다.
   */
  splashLogoY: -3,
  /** 로고 너비. */
  splashLogoWidth: 220,
  /** 로고에서 글자가 보이는 자리와 문구 사이 간격. */
  splashLogoCopyGap: 1,

  /**
   * 목표 시간(00 : 00)을 화면 정중앙에서 가로로 옮깁니다.
   * 0 이면 정중앙. 양수면 오른쪽입니다.
   */
  goalClockX: 0,
  /**
   * 목표 시간을 화면 정중앙에서 세로로 옮깁니다.
   * 0 이면 정중앙. 양수면 아래입니다.
   */
  goalClockY: 0,
  /** 00 숫자 크기. */
  goalNumberSize: 64,
  /** 시간과 분 사이 간격. */
  goalClockGap: 28,
  /** 숫자, 화살표, 시간/분 글자 사이 세로 간격. */
  goalRowGap: 10,
  /** 위아래 화살표 버튼 너비. */
  goalStepWidth: 72,
  /** 위아래 화살표 버튼 높이. */
  goalStepHeight: 48,
  /** 화살표 아이콘 크기. */
  goalArrowSize: 28,
} as const;
