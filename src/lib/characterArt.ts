import type { CharacterId } from '../types';
import basic from '../../forest-img/basic.png';
import basic2 from '../../forest-img/basic2.png';
import basic3 from '../../forest-img/basic3.png';
import basic4 from '../../forest-img/basic4.png';
import clothes from '../../forest-img/change-clothes.png';
import clothes2 from '../../forest-img/change-clothes2.png';
import clothes3 from '../../forest-img/change-clothes3.png';
import clothes4 from '../../forest-img/change-clothes4.png';
import record from '../../forest-img/on-record.png';
import record2 from '../../forest-img/on-record2.png';
import record3 from '../../forest-img/on-record3.png';
import record4 from '../../forest-img/on-record4.png';

type CharacterArt = { face: string; full: string; record: string };

/** 캐릭터 선택 순서와 같습니다. 2·3·4번째는 파일 이름 뒤에 숫자가 붙은 그림입니다. */
const ART: Record<CharacterId, CharacterArt> = {
  cream: { face: basic, full: clothes, record },
  brown: { face: basic2, full: clothes2, record: record2 },
  gray: { face: basic3, full: clothes3, record: record3 },
  charcoal: { face: basic4, full: clothes4, record: record4 },
};

export function characterArt(id: CharacterId): CharacterArt {
  return ART[id] ?? ART.cream;
}
