# data-model.js 요구사항

## 역할

마비노기 모바일 계산기에서 사용하는 데이터 분류 체계를 정의합니다. 데이터는 위치, 속성, 구분, 적용의 네 표로 구성되며 ID와 key 또는 참조 관계를 통해 연결됩니다.

## 현재 데이터 구조

- `version`: 현재 값은 `1`입니다.
- `locationTable`: 위치 ID, key, 표시 이름, 추가 가능 여부(`addable`), 사용할 속성 그룹(`attributeGroups`)을 정의합니다.
- `attributeTable`: 속성 그룹의 ID, key, 이름 및 세부 항목 목록을 정의합니다.
- `sectionTable`: 구분 ID, 소속 속성 그룹 key, 표시 이름, 적용 형식 ID 목록을 정의합니다.
- `applicationTable`: 적용 형식 ID, key, 표시 이름을 정의합니다.

## 위치 Table 현황

| ID | key | 표시 이름 | addable | attributeGroups |
|---:|---|---|---|---|
| 1000 | `level` | 레벨 | `false` | `independent1` |
| 2000 | `paladin` | 팔라딘 | `false` | `independent2` |
| 3000 | `myInfo` | 내 정보 | `false` | `stat1`~`stat6` |
| 4000 | `titleEffect` | 칭호 효과 | `false` | `stat1`~`stat6` |
| 5000 | `runeWordB` | 룬 워드 | `false` | `stat1`~`stat6` |
| 6000 | `bonusCard` | 보너스 카드 | `false` | `stat1`~`stat6` |
| 7000 | `activeCombatSkill` | 전투 스킬(액티브) | `true` | `stat1`~`stat6` |
| 8000 | `passiveCombatSkill` | 전투 스킬(패시브) | `true` | `stat1`~`stat6` |

## 속성 Table 현황

| ID | key | 표시 이름 | items |
|---:|---|---|---|
| 1100 | `independent1` | 독립1 | 클래스 레벨, 캐릭터 레벨, 시즌 스킬 레벨 |
| 2100 | `independent2` | 독립2 | 정의, 심판 |
| 3100 | `stat1` | 스탯1 | 힘, 솜씨, 지력, 의지, 행운 |
| 3200 | `stat2` | 스탯2 | 공격력 |
| 3300 | `stat3` | 스탯3 | 스킬 위력 |
| 3400 | `stat4` | 스탯4 | 치명타, 추가타 |
| 3500 | `stat5` | 스탯5 | 강타 강화, 연타 강화, 콤보 강화, 광역 강화, 궁극기 |
| 3600 | `stat6` | 스탯6 | 브레이크 |

## 구분 Table 현황

- `independent1`: 1110 클래스 레벨, 1120 캐릭터 레벨, 1130 시즌 스킬 레벨. 각 항목은 적용 ID 1111을 참조합니다.
- `independent2`: 2110 정의, 2120 심판. 각 항목은 적용 ID 1111을 참조합니다.
- `stat1`: 3110 힘, 3120 솜씨, 3130 지력, 3140 의지, 3150 행운. 각 항목은 적용 ID 1111을 참조합니다.
- `stat2`: 3210 공격력. 적용 ID 3211을 참조합니다.
- `stat3`: 3310 스킬 위력. 적용 ID 3311 및 3312를 참조합니다.
- `stat4`: 3410 치명타. 적용 ID 3311 및 3411을 참조합니다. 3420 추가타는 적용 ID 3411을 참조합니다.
- `stat5`: 3510 강타 강화, 3520 연타 강화, 3530 콤보 강화, 3540 광역 강화, 3550 궁극기. 각 항목은 적용 ID 3211을 참조합니다.
- `stat6`: 3610 브레이크. 적용 ID 3211을 참조합니다.

## 적용 Table 현황

| ID | key | 표시 이름 |
|---:|---|---|
| 1111 | `add` | + |
| 3211 | `percent` | % |
| 3311 | `damagePercent` | 데미지 % |
| 3312 | `activationPercent` | 발동 % |
| 3411 | `skillDamagePercent` | 스킬피해 % |

## 참조 및 유지 조건

- 위치 Table의 `attributeGroups`는 속성 Table의 `key`를 참조합니다.
- 구분 Table의 `group`은 속성 Table의 `key`를 참조합니다.
- 구분 Table의 `applications[].typeId`는 적용 Table의 `id`를 참조합니다.
- ID와 key는 데이터 간 참조에 사용하므로 임의로 변경하지 않습니다.
- 같은 표시 이름을 사용하는 위치가 있더라도 ID와 key로 구분합니다. 현재 ID 4000은 칭호 효과, ID 5000은 룬 워드입니다.
- 현재 `addable: true`인 위치는 ID 7000과 8000뿐입니다.
- **현재 소스 연결 상태:** `table.html`에서 `data-model.js`를 먼저 로드하고, 이어서 `table.js`를 로드합니다. `table.js`는 `MOBI_DATA_MODEL`을 참조해 위치별 열, 기본 행, 사용자 추가 행 및 적용/구분 선택 목록을 생성합니다. 따라서 현재 실제 동작에서는 데이터 모델이 테이블 UI에 연결되어 있습니다.
- `pages_js/data-model.js` 상단 주석도 현재 로드 순서와 실제 참조 관계에 맞춰, `table.html`에서 먼저 로드되고 `table.js`가 `MOBI_DATA_MODEL`을 사용해 입력 테이블 UI를 생성한다고 설명합니다.
- 현재 데이터 모델은 분류 정의와 테이블 UI 생성에 사용됩니다. JSON 저장·불러오기 및 계산 로직이 이 데이터 모델에 연결되어 있다고는 명시하지 않습니다.
- 데이터 구조나 참조 관계를 변경하면 이 문서와 `pages_js/data-model.js`, 이를 사용하는 `pages_js/table.js`의 일치 여부를 함께 확인합니다.

## 관련 파일

- `pages_js/data-model.js`: 네 개 데이터 표의 실제 정의
- `pages_js/table.js`: 데이터 모델을 이용한 테이블 UI 생성 및 상호작용
- `table.html`: 스크립트 로드 순서와 페이지 테마 상태
- `README.md`: 프로젝트 공통 요구사항
