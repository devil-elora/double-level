/* =====================================================================
   DOUBLE LEVEL 홈페이지 — 내용 데이터
   (이 파일만 고치면 대표·프로듀서·곡 목록·연락처가 바뀝니다. 코드는 몰라도 됩니다)

   [고치는 법]
   · 항목 하나 = 중괄호 { } 한 덩어리. 쉼표로 이어 붙입니다.
   · 사진은 /site/img/ 폴더에 넣고 파일 이름만 적습니다. 사진이 없으면 비워 두세요("") — 이름 머리글자로 표시됩니다.
   · 비어 있는 목록( [] )은 홈페이지에서 그 화면이 자동으로 숨겨집니다.
   · 곡의 credit 은 더블레벨이 그 곡에서 맡은 일입니다. 'Lyrics'(작사) · 'Composition'(작곡) · 'Arrangement'(편곡)
     중에서 해당하는 것만 적으면 플레이어 카드에 표시됩니다. (출처: 벅스 크레딧)
   · 출처: 나무위키 '더블레벨 (DOUBLE LEVEL)' 문서(2026-09-09 기준) + 회사 제공 자료
   ===================================================================== */
window.SITE = {

  /* 회사 기본 정보 */
  company: {
    nameKo: 'DOUBLE LEVEL PRODUCTION Inc.',
    nameEn: 'DOUBLE LEVEL',
    tagline: 'MUSIC, ONE LEVEL HIGHER',
    founded: '2025.12.18',
    business: 'Songwriting & Production Publishing · Writer Management',
    email: 'dblv_official@double-level.com',
    /* 인스타그램: 여러 개면 목록으로. label 은 화면에 함께 표시되는 이름 */
    instagram: [
      { label: 'Official', url: 'https://www.instagram.com/doublelevel_official/' },
      { label: 'CEO',      url: 'https://www.instagram.com/777chiller/' },
    ],
    youtube: '',
    address: '',            // 예: '서울특별시 마포구 ○○로 00, 3층'  (비우면 표시 안 함)
    tel: '',                // 예: '02-000-0000'
  },

  /* 첫 화면: 로고가 열리면 나오는 대표
     model: 진짜 3D 캐릭터 파일(.glb)이 생기면 'site/img/ceo.glb' 처럼 적으세요 — 그림 캐릭터 대신 3D 모델이 뜹니다. */
  ceo: {
    name: 'Kim Kang San',
    en: 'CHILLER',
    title: 'CEO · Producer · Songwriter',
    greeting: 'Hi, I am CHILLER, CEO of DOUBLE LEVEL.',
    bio: 'Songwriter and producer who debuted in 2023 with Paul Kim’s “Han River”. Founded DOUBLE LEVEL to build a team that covers both lyrics and composition.',
    instagram: 'https://www.instagram.com/777chiller/',
    photo: 'ceo.jpg',       // /site/img/ceo.jpg — 첫 화면에서 3D 카드로 보이는 사진
    model: '',
  },

  /* PRODUCER — 오선지 위에 올라가는 사람들 (사진 없으면 머리글자로 표시)
     예: { name: 'CHILLER', ko: 'Kim Kang San', role: 'Producer · Songwriter', photo: 'chiller.jpg', instagram: 'https://...' } */
  producers: [
    { name: 'CHILLER', ko: 'Kim Kang San', role: 'CEO · Producer · Songwriter', photo: 'ceo.jpg', instagram: 'https://www.instagram.com/777chiller/' },
    { name: 'COLL!N',  ko: 'Kim Hyun Woo', role: 'Topliner',                   photo: 'collin.jpg' },
    { name: 'Owl',     ko: 'Jo Jung Hee', role: 'Producer',                  photo: 'owl.jpg?v=2' },
    { name: 'WuNii',   ko: '',       role: 'Producer',                    photo: 'wunii.jpg', instagram: 'https://www.instagram.com/wuniigurii' },
    { name: 'SIZZ',    ko: 'Jin So Jung',  role: 'Producer',                    photo: 'jinsojung.jpg' },
    { name: 'July',    ko: '',       role: 'Topliner',                    photo: 'july.jpg' },
    { name: 'Juflowernb', ko: 'Kim Ju Hwa', role: 'Producer',                photo: 'juflower.jpg?v=2' },
    { name: 'Saizy',   ko: 'Choi Jun Hwan', role: 'Producer',                photo: 'saizy.jpg' },
  ],

  /* SONGS — 참여한 곡 (오선지 위에 음표로 올라갑니다)
     예: { artist: '아티스트', title: '곡 제목', album: '앨범', link: 'https://...' } */
  songs: [
    { artist: 'TIOT',              title: '다섯시간의 조각들',          album: 'Time for Us', credit: ['Lyrics', 'Composition'], cover: 'covers/tiot-time-for-us.webp', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2b/6c/73/2b6c73ed-c765-738d-5896-f58eecdf714b/mzaf_12800240483291486193.plus.aac.p.m4a' },
    { artist: 'NCT WISH',          title: 'If You Love Me Let Me Know', album: 'Would You Marry Me? OST Part.3', credit: ['Lyrics', 'Composition'], cover: 'covers/nct-wish.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/86/8b/c2/868bc2c4-5da6-f27b-8a75-aae0e32df9b5/mzaf_8256727450170037493.plus.aac.p.m4a' },
    { artist: 'ENHYPEN',           title: 'Sleep Tight',              album: 'THE SIN : VANISH', credit: ['Lyrics', 'Composition'], cover: 'covers/enhypen-sleep-tight.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/22/3e/6f/223e6f7c-7b11-270a-3bc7-35bf1a2b91ae/mzaf_1374557183856800650.plus.aac.p.m4a' },
    { artist: 'PLAVE',             title: 'Blossom Parade',           album: 'Caligo Pt.2', credit: ['Composition', 'Arrangement'], cover: 'covers/plave.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2c/d4/70/2cd470ee-5111-8aca-8b88-dc52e11868ce/mzaf_9485076833344321189.plus.aac.p.m4a' },
    { artist: 'ILLIT',             title: 'Mamihlapinatapai',         album: 'MAMIHLAPINATAPAI', credit: ['Lyrics', 'Composition'], cover: 'covers/illit-mamihlapinatapai.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/88/97/04/88970483-95d9-10f7-a55c-f54707c84ca1/mzaf_1091280913231081039.plus.aac.p.m4a' },
    { artist: 'EVAN',              title: 'going home',               album: 'Death of me', credit: ['Lyrics', 'Composition'], cover: 'covers/evan-going-home.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bd/43/cb/bd43cb25-ef4a-9f02-c4c3-70aafcf5c439/mzaf_15884386153592900940.plus.aac.p.m4a' },
    { artist: 'KickFlip',          title: 'Secret Nightmare',         album: 'My First Flip', credit: ['Lyrics', 'Composition'], cover: 'covers/kickflip.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bc/d3/ce/bcd3ce68-65f7-9724-a3ac-2320bf7bd8c9/mzaf_1883341533475515798.plus.aac.p.m4a' },
    { artist: 'DAILY : DIRECTION', title: 'ROOMBADOOMBA',             album: 'FIRST : DELIVERY', credit: ['Lyrics', 'Composition', 'Arrangement'], cover: 'covers/daily-direction-roombadoomba.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b1/84/50/b18450ca-1060-d4e0-170d-4a4281082653/mzaf_8638255310874137011.plus.aac.p.m4a' },
    { artist: 'DAILY : DIRECTION', title: 'SELF',                     album: 'FIRST : DELIVERY', credit: ['Lyrics', 'Composition', 'Arrangement'], cover: 'covers/daily-direction-self.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cd/ed/63/cded6354-ed6c-9a0c-d946-1ff15d661c87/mzaf_15637956158905126590.plus.aac.p.m4a' },
    { artist: 'NouerA',            title: 'POP IT LIKE',              album: 'POP IT LIKE', credit: ['Lyrics', 'Composition', 'Arrangement'], cover: 'covers/nouera-pop-it-like.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ce/7e/95/ce7e9582-a841-8072-a1cc-543d2e19b0b5/mzaf_166528071240722169.plus.aac.p.m4a' },
    { artist: 'NouerA',            title: 'W.T.F(un)',                album: '.exe', credit: ['Lyrics', 'Composition', 'Arrangement'], cover: 'covers/nouera-w-t-f-un.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d6/a9/44/d6a94444-e643-e5a1-e509-0b12ebf7e03b/mzaf_5672324363576625878.plus.aac.p.m4a' },
    { artist: 'CLOSE YOUR EYES',   title: 'What If I Miss Love?',     album: 'OVEREXPOSED', credit: ['Lyrics'], cover: 'covers/close-your-eyes-what-if-i-miss-love.jpg', preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ef/ce/8b/efce8b9e-af36-1de0-0336-429aaf623cb4/mzaf_10825505994917345599.plus.aac.p.m4a' },
    { artist: 'Henry',             title: 'Only Today',               album: 'Only Today', credit: ['Lyrics'] },
  ],

  /* ABOUT 문단 */
  about: {
    headline: 'Songwriting and production, both.\nOne level higher.',
    body: [
      'DOUBLE LEVEL is a songwriting & production publishing and writer management company founded in December 2025.',
      'Within its first year it has placed songs on albums by ENHYPEN, PLAVE, ILLIT, NCT WISH and more. Double — both lyrics and composition. Level — one step higher. We work exactly as our name says.',
    ],
  },
};
