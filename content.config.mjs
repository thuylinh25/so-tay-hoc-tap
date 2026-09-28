// Danh mục kho tài liệu: taxonomy, metadata từng tài liệu và lộ trình học.
// Script scripts/build-content.mjs đọc file này. Tài liệu gốc trong SOURCE_DIR chỉ được đọc, không bao giờ bị sửa.

export const SOURCE_DIR = 'Tài liệu học';

export const domains = [
  { id: 'automation', title: 'Automation Testing', description: 'Playwright, locator và phỏng vấn automation — trọng tâm của kho.' },
  { id: 'java', title: 'Java', description: 'Java cho automation, nhập môn và nâng cao.' },
  { id: 'web', title: 'Web Fundamentals', description: 'HTML, CSS và JavaScript.' },
  { id: 'database', title: 'Database', description: 'SQL và câu hỏi phỏng vấn.' },
  { id: 'devtools', title: 'Dev Tools & Cloud', description: 'Git và điện toán đám mây.' },
  { id: 'cs', title: 'Computer Science', description: 'Kiến trúc máy tính, mạng máy tính.' },
  { id: 'other', title: 'Chưa phân loại', description: 'Tài liệu mới chưa được xếp vào taxonomy.' },
];

export const topics = [
  { id: 'playwright', domain: 'automation', title: 'Playwright' },
  { id: 'locator', domain: 'automation', title: 'Locator & Selector' },
  { id: 'automation-interview', domain: 'automation', title: 'Phỏng vấn Automation' },
  { id: 'java-automation', domain: 'java', title: 'Java cho Automation' },
  { id: 'java-intro', domain: 'java', title: 'Nhập môn Java' },
  { id: 'java-full', domain: 'java', title: 'Java cơ bản → nâng cao' },
  { id: 'html', domain: 'web', title: 'HTML' },
  { id: 'css', domain: 'web', title: 'CSS' },
  { id: 'javascript', domain: 'web', title: 'JavaScript' },
  { id: 'sql', domain: 'database', title: 'SQL' },
  { id: 'git', domain: 'devtools', title: 'Git' },
  { id: 'cloud', domain: 'devtools', title: 'Cloud Computing' },
  { id: 'architecture', domain: 'cs', title: 'Kiến trúc máy tính' },
  { id: 'networking', domain: 'cs', title: 'Mạng máy tính' },
  { id: 'machine-learning', domain: 'cs', title: 'Machine Learning' },
  { id: 'uncategorized', domain: 'other', title: 'Khác' },
];

// source: đường dẫn tương đối trong SOURCE_DIR (file, hoặc folder với tài liệu dạng ảnh).
// tags: lesson-series | handbook-images | interview
export const docs = [
  {
    source: 'Playwright-tu-so-0.html',
    slug: 'playwright-tu-so-0',
    title: 'Playwright từ số 0',
    topic: 'playwright',
    level: 'beginner',
    tags: ['lesson-series'],
    attachments: [{ source: 'Playwright từ số 0.pdf', label: 'Bản PDF' }],
    related: ['html-dom-selector', 'cam-nang-javascript'],
  },
  {
    source: 'module-html-css-selector.md',
    slug: 'html-dom-selector',
    title: 'HTML, DOM và Selector cho Web Automation',
    topic: 'locator',
    level: 'beginner',
    tags: ['lesson-series'],
    related: ['cam-nang-html', 'cam-nang-css', 'playwright-tu-so-0'],
  },
  {
    source: 'Automation interview question.pdf',
    slug: 'automation-interview-3-5-nam',
    title: 'Phỏng vấn Automation Test Engineer (3–5 năm)',
    subtitle: 'Vikas Pratik — Deloitte interview guide',
    topic: 'automation-interview',
    level: 'intermediate',
    tags: ['interview'],
    related: ['java-gd2-oop', 'java-gd3-collections-exception', 'sql-50-interview'],
  },
  {
    source: 'java-giai-doan-1.md',
    slug: 'java-gd1-cu-phap',
    title: 'Giai đoạn 1: Cú pháp nền tảng',
    topic: 'java-automation',
    level: 'beginner',
    tags: ['lesson-series'],
    related: ['cam-nang-java'],
  },
  {
    source: 'java-giai-doan-2-oop.md',
    slug: 'java-gd2-oop',
    title: 'Giai đoạn 2: OOP',
    topic: 'java-automation',
    level: 'intermediate',
    tags: ['lesson-series'],
    related: ['java-co-ban-nang-cao', 'automation-interview-3-5-nam'],
  },
  {
    source: 'java-giai-doan-3-collections-exception.md',
    slug: 'java-gd3-collections-exception',
    title: 'Giai đoạn 3: Collections và Exception',
    topic: 'java-automation',
    level: 'intermediate',
    tags: ['lesson-series'],
    related: ['java-co-ban-nang-cao', 'automation-interview-3-5-nam'],
  },
  { source: 'Cẩm Nang Java', slug: 'cam-nang-java', title: 'Cẩm nang nhập môn Java', topic: 'java-intro', level: 'beginner', tags: ['handbook-images'], related: ['java-co-ban-nang-cao', 'java-gd1-cu-phap'] },
  { source: 'Java từ cơ bản đến nâng cao', slug: 'java-co-ban-nang-cao', title: 'Java từ cơ bản đến nâng cao', topic: 'java-full', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-java', 'java-gd2-oop'] },
  { source: 'Cẩm nang HTML', slug: 'cam-nang-html', title: 'Cẩm nang HTML', topic: 'html', level: 'beginner', tags: ['handbook-images'], note: 'Bộ ảnh gốc thiếu trang 12.', related: ['html-dom-selector'] },
  { source: 'Cẩm nang CSS', slug: 'cam-nang-css', title: 'Cẩm nang CSS', topic: 'css', level: 'beginner', tags: ['handbook-images'], related: ['html-dom-selector'] },
  { source: 'Cẩm nang JavaScript', slug: 'cam-nang-javascript', title: 'Cẩm nang JavaScript', topic: 'javascript', level: 'beginner', tags: ['handbook-images'], related: ['playwright-tu-so-0'] },
  { source: '50 SQL Interview Q&A', slug: 'sql-50-interview', title: '50 câu phỏng vấn SQL', topic: 'sql', level: 'intermediate', tags: ['handbook-images', 'interview'], related: ['automation-interview-3-5-nam'] },
  { source: 'Cẩm nang Git', slug: 'cam-nang-git', title: 'Cẩm nang Git', topic: 'git', level: 'beginner', tags: ['handbook-images'] },
  { source: 'Cẩm nang Cloud Computing', slug: 'cam-nang-cloud-computing', title: 'Cẩm nang Cloud Computing', topic: 'cloud', level: 'beginner', tags: ['handbook-images'] },
  { source: 'Kiến trúc máy tính từ A - Z', slug: 'kien-truc-may-tinh-a-z', title: 'Kiến trúc máy tính từ A - Z', topic: 'architecture', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-kien-truc-may-tinh'] },
  { source: 'Cẩm nang kiến trúc máy tính', slug: 'cam-nang-kien-truc-may-tinh', title: 'Cẩm nang kiến trúc máy tính', subtitle: 'Bản tóm tắt để ôn nhanh', topic: 'architecture', level: 'beginner', tags: ['handbook-images'], related: ['kien-truc-may-tinh-a-z'] },
  { source: 'Cẩm nang mạng máy tính', slug: 'cam-nang-mang-may-tinh', title: 'Cẩm nang mạng máy tính', topic: 'networking', level: 'beginner', tags: ['handbook-images'] },
];

// File trong SOURCE_DIR không phải tài liệu học.
export const ignore = [/\.lnk$/i, /^desktop\.ini$/i, /^thumbs\.db$/i, /^~\$/];

export const roadmaps = [
  {
    id: 'automation-tester',
    title: 'Lộ trình Automation Tester',
    description: 'Đi từ Java nền tảng tới Playwright và phỏng vấn. HTML & Selector có thể học song song với Java GĐ1.',
    steps: [
      'java-gd1-cu-phap',
      'html-dom-selector',
      'java-gd2-oop',
      'java-gd3-collections-exception',
      'playwright-tu-so-0',
      'automation-interview-3-5-nam',
      'sql-50-interview',
    ],
  },
  {
    id: 'java',
    title: 'Java',
    description: 'Nhập môn bằng cẩm nang, học sâu theo 3 giai đoạn, rồi mở rộng sang phần nâng cao.',
    steps: ['cam-nang-java', 'java-gd1-cu-phap', 'java-gd2-oop', 'java-gd3-collections-exception', 'java-co-ban-nang-cao'],
  },
  {
    id: 'web',
    title: 'Web Fundamentals',
    description: 'HTML và CSS trước, rồi tới selector cho automation và JavaScript.',
    steps: ['cam-nang-html', 'cam-nang-css', 'html-dom-selector', 'cam-nang-javascript'],
  },
  {
    id: 'computer-science',
    title: 'Computer Science',
    description: 'Kiến trúc máy tính (bản đầy đủ, rồi bản ôn nhanh) và mạng máy tính.',
    steps: ['kien-truc-may-tinh-a-z', 'cam-nang-kien-truc-may-tinh', 'cam-nang-mang-may-tinh'],
  },
];
