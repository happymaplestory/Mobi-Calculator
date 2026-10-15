/*
 * 마비노기 모바일 계산기 데이터 모델
 *
 * 네 개의 표(위치, 속성, 구분, 적용)를 ID로 연결해 관리합니다.
 * 이 파일은 데이터 정의만 보관하며, 현재 table.js UI에 자동으로 연결되지는 않습니다.
 */

const MOBI_DATA_MODEL = {
  version: 1,

  // 위치 Table: 입력 데이터가 어느 위치/출처에서 제공되는지 정의합니다.
  locationTable: [
    {
      id: 1000,
      key: "level",
      name: "레벨",
      addable: false,
      attributeGroups: ["independent1"]
    },
    {
      id: 2000,
      key: "paladin",
      name: "팔라딘",
      addable: false,
      attributeGroups: ["independent2"]
    },
    {
      id: 3000,
      key: "myInfo",
      name: "내 정보",
      addable: false,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    },
    {
      id: 4000,
      key: "titleEffect",
      name: "칭호 효과",
      addable: false,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    },
    {
      id: 5000,
      key: "runeWordB",
      name: "룬 워드",
      addable: false,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    },
    {
      id: 6000,
      key: "bonusCard",
      name: "보너스 카드",
      addable: false,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    },
    {
      id: 7000,
      key: "activeCombatSkill",
      name: "전투 스킬(액티브)",
      addable: true,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    },
    {
      id: 8000,
      key: "passiveCombatSkill",
      name: "전투 스킬(패시브)",
      addable: true,
      attributeGroups: ["stat1", "stat2", "stat3", "stat4", "stat5", "stat6"]
    }
  ],

  // 속성 Table: 속성 그룹과 각 그룹에 포함되는 속성 이름을 정의합니다.
  attributeTable: [
    {
      id: 1100,
      key: "independent1",
      name: "독립1",
      items: ["클래스 레벨", "캐릭터 레벨", "시즌 스킬 레벨"]
    },
    {
      id: 2100,
      key: "independent2",
      name: "독립2",
      items: ["정의", "심판"]
    },
    {
      id: 3100,
      key: "stat1",
      name: "스탯1",
      items: ["힘", "솜씨", "지력", "의지", "행운"]
    },
    {
      id: 3200,
      key: "stat2",
      name: "스탯2",
      items: ["공격력"]
    },
    {
      id: 3300,
      key: "stat3",
      name: "스탯3",
      items: ["스킬 위력"]
    },
    {
      id: 3400,
      key: "stat4",
      name: "스탯4",
      items: ["치명타", "추가타"]
    },
    {
      id: 3500,
      key: "stat5",
      name: "스탯5",
      items: ["강타 강화", "연타 강화", "콤보 강화", "광역 강화", "궁극기"]
    },
    {
      id: 3600,
      key: "stat6",
      name: "스탯6",
      items: ["브레이크"]
    }
  ],

  // 구분 Table: 각 세부 속성의 ID와 적용 형식을 연결합니다.
  sectionTable: [
    { id: 1110, group: "independent1", name: "클래스 레벨", applications: [{ typeId: 1111 }] },
    { id: 1120, group: "independent1", name: "캐릭터 레벨", applications: [{ typeId: 1111 }] },
    { id: 1130, group: "independent1", name: "시즌 스킬 레벨", applications: [{ typeId: 1111 }] },

    { id: 2110, group: "independent2", name: "정의", applications: [{ typeId: 1111 }] },
    { id: 2120, group: "independent2", name: "심판", applications: [{ typeId: 1111 }] },

    { id: 3110, group: "stat1", name: "힘", applications: [{ typeId: 1111 }] },
    { id: 3120, group: "stat1", name: "솜씨", applications: [{ typeId: 1111 }] },
    { id: 3130, group: "stat1", name: "지력", applications: [{ typeId: 1111 }] },
    { id: 3140, group: "stat1", name: "의지", applications: [{ typeId: 1111 }] },
    { id: 3150, group: "stat1", name: "행운", applications: [{ typeId: 1111 }] },

    { id: 3210, group: "stat2", name: "공격력", applications: [{ typeId: 3211 }] },

    {
      id: 3310,
      group: "stat3",
      name: "스킬 위력",
      applications: [{ typeId: 3311 }, { typeId: 3312 }]
    },

    {
      id: 3410,
      group: "stat4",
      name: "치명타",
      applications: [{ typeId: 3311 }, { typeId: 3411 }]
    },
    { id: 3420, group: "stat4", name: "추가타", applications: [{ typeId: 3411 }] },

    { id: 3510, group: "stat5", name: "강타 강화", applications: [{ typeId: 3211 }] },
    { id: 3520, group: "stat5", name: "연타 강화", applications: [{ typeId: 3211 }] },
    { id: 3530, group: "stat5", name: "콤보 강화", applications: [{ typeId: 3211 }] },
    { id: 3540, group: "stat5", name: "광역 강화", applications: [{ typeId: 3211 }] },
    { id: 3550, group: "stat5", name: "궁극기", applications: [{ typeId: 3211 }] },

    { id: 3610, group: "stat6", name: "브레이크", applications: [{ typeId: 3211 }] }
  ],

  // 적용 Table: 각 적용 형식의 ID와 표시 이름을 정의합니다.
  applicationTable: [
    { id: 1111, key: "add", name: "+" },
    { id: 3211, key: "percent", name: "%" },
    { id: 3311, key: "damagePercent", name: "데미지 %" },
    { id: 3312, key: "activationPercent", name: "발동 %" },
    { id: 3411, key: "skillDamagePercent", name: "스킬피해 %" }
  ]
};
