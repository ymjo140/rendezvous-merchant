// 사장님이 가게를 B2C 필터에 맞춰 태깅하기 위한 옵션.
// ⚠️ B2C(wemeet_project)의 PURPOSE_CONFIG / FACILITY_KEY_MAP과 일치해야
// 손님 앱 필터에서 매칭됨. 한쪽을 바꾸면 다른 쪽도 함께 갱신할 것.

// 분위기 태그 — places.vibe_tags(한글 배열)에 저장. B2C가 ILIKE로 매칭.
export const VIBE_OPTIONS: string[] = [
  "가성비", "고급스러운", "캐주얼", "조용한", "활기찬", "감성적인",
  "뷰맛집", "프리미엄", "시끌벅적", "루프탑/야외", "라이브/음악", "안주맛집",
  "혼술", "모던/힙", "작업/스터디", "대형/넓은", "로맨틱", "야경/뷰",
  "이색적인", "격식있는", "교통편리", "반려동물동반",
];

// 편의시설 — places.features(jsonb)에 {영어키: true}로 저장. B2C가 jsonb_exists로 매칭.
export const FACILITY_OPTIONS: { label: string; key: string }[] = [
  { label: "룸/프라이빗룸", key: "private_room" },
  { label: "단체석", key: "group_seat" },
  { label: "주차", key: "parking" },
  { label: "발렛파킹", key: "valet" },
  { label: "콜키지", key: "corkage" },
  { label: "코스요리", key: "course" },
  { label: "반려동물 동반", key: "pet_friendly" },
  { label: "루프탑/야외", key: "rooftop" },
  { label: "24시간", key: "24hours" },
  { label: "콘센트/와이파이", key: "wifi" },
  { label: "예약 가능", key: "reservation" },
];
