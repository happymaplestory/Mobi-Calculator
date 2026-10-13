# data-model.js 요구사항

## 역할

마비노기 모바일 계산기에서 사용하는 데이터 분류 체계를 정의합니다. 데이터는 위치, 속성, 구분, 적용의 네 단계로 구성하며, 각 항목은 ID와 고유 key 또는 참조 관계로 구분합니다.

## 데이터 구조

- `locationTable`: 위치별 ID, 표시 이름, 추가 가능 여부, 사용할 속성 그룹을 정의합니다.
- `attributeTable`: 속성 그룹별 ID, 표시 이름, 세부 항목 목록을 정의합니다.
- `sectionTable`: 세부 속성별 ID, 소속 속성 그룹, 표시 이름, 적용 형식 참조를 정의합니다.
- `applicationTable`: 적용 형식별 ID, 고유 key, 표시 이름을 정의합니다.
- `version`: 데이터 구조 버전입니다.

## 유지 조건

- 표에 제시된 ID는 임의로 변경하지 않습니다.
- 같은 표시 이름을 가진 위치도 ID와 key로 구분합니다. 현재 ID 4000과 5000은 모두 `룬 워드`이지만 서로 다른 위치 항목입니다.
- `addable`은 위치 Table의 추가 가능 여부를 나타냅니다. 현재 전투 스킬(액티브)과 전투 스킬(패시브)만 `true`입니다.
- `attributeGroups`는 위치에서 사용하는 속성 그룹의 key를 참조합니다.
- `sectionTable.group`은 `attributeTable.key`를 참조합니다.
- `sectionTable.applications[].typeId`는 `applicationTable.id`를 참조합니다.
- 세부 속성에 적용 형식이 둘 이상이면 `applications` 배열에 각각 기록합니다.
- 이 파일은 데이터 정의만 제공하며, 현재 `table.js` 화면 구현이나 계산 로직에 자동으로 연결되어 있지 않습니다. 연결 작업은 별도 요구사항 확정 후 진행합니다.
- 데이터가 바뀌면 이 문서와 `data-model.js`의 일관성을 함께 확인합니다.

## 관련 파일

- `pages_js/data-model.js`: 네 개 데이터 표의 정의
- `README.md`: 프로젝트 전체 요구사항 및 파일 구조
