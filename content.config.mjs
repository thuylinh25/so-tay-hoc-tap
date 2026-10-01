// Danh mục kho tài liệu: taxonomy, metadata từng tài liệu và lộ trình học.
// Script scripts/build-content.mjs đọc file này. Tài liệu gốc trong SOURCE_DIR chỉ được đọc, không bao giờ bị sửa.

export const SOURCE_DIR = 'Tài liệu học';

// Cấp cao nhất của cây Chủ đề.
// layout: 'tree'  → category chứa domain → topic → bài (phân cấp đầy đủ).
// layout: 'flat'  → bài nằm trực tiếp dưới category (không ép topic); phân loại sâu dùng tags của từng bài.
export const categories = [
  { id: 'lap-trinh', title: 'Lập trình', layout: 'tree', description: 'Automation, ngôn ngữ, web, database, DevOps, data/AI và khoa học máy tính.' },
  { id: 'suc-khoe', title: 'Sức khỏe', layout: 'tree', description: 'Kiến thức sức khỏe sưu tập tự do. Tài liệu giáo dục, không thay thế chẩn đoán hoặc điều trị y tế.' },
];

export const domains = [
  { id: 'automation', category: 'lap-trinh', title: 'Automation Testing', description: 'Playwright, locator và phỏng vấn automation — trọng tâm của kho.' },
  { id: 'languages', category: 'lap-trinh', title: 'Ngôn ngữ lập trình', description: 'Java, JavaScript, TypeScript, Python, C và C++.' },
  { id: 'web', category: 'lap-trinh', title: 'Web Development', description: 'HTML, CSS và backend.' },
  { id: 'database', category: 'lap-trinh', title: 'Database', description: 'SQL và câu hỏi phỏng vấn.' },
  { id: 'devtools', category: 'lap-trinh', title: 'Dev Tools, DevOps & Cloud', description: 'Git, DevOps, Docker, điện toán đám mây và AWS.' },
  { id: 'data-ai', category: 'lap-trinh', title: 'Data & AI', description: 'Phân tích dữ liệu, Machine Learning và AI Agent.' },
  { id: 'cs', category: 'lap-trinh', title: 'Computer Science', description: 'Kiến trúc máy tính, mạng máy tính, an ninh mạng.' },
  { id: 'other', category: 'lap-trinh', title: 'Chưa phân loại', description: 'Tài liệu mới chưa được xếp vào taxonomy.' },
  // Sức khỏe: subcategory = domain. Thêm nhóm mới (Tác động cột sống, Bấm huyệt…) chỉ cần khai thêm domain + topic ở đây.
  { id: 'giai-phau', category: 'suc-khoe', title: 'Giải phẫu', description: 'Giải phẫu cơ – xương – mô mềm phục vụ trị liệu và tác động cột sống.' },
];

export const topics = [
  { id: 'playwright', domain: 'automation', title: 'Playwright' },
  { id: 'locator', domain: 'automation', title: 'Locator & Selector' },
  { id: 'automation-interview', domain: 'automation', title: 'Phỏng vấn Automation' },
  { id: 'java', domain: 'languages', title: 'Java' },
  { id: 'javascript', domain: 'languages', title: 'JavaScript' },
  { id: 'typescript', domain: 'languages', title: 'TypeScript' },
  { id: 'python', domain: 'languages', title: 'Python' },
  { id: 'c', domain: 'languages', title: 'C' },
  { id: 'cpp', domain: 'languages', title: 'C++' },
  { id: 'html', domain: 'web', title: 'HTML' },
  { id: 'css', domain: 'web', title: 'CSS' },
  { id: 'backend', domain: 'web', title: 'Backend' },
  { id: 'sql', domain: 'database', title: 'SQL' },
  { id: 'git', domain: 'devtools', title: 'Git' },
  { id: 'devops', domain: 'devtools', title: 'DevOps' },
  { id: 'docker', domain: 'devtools', title: 'Docker' },
  { id: 'cloud', domain: 'devtools', title: 'Cloud Computing & AWS' },
  { id: 'data-analysis', domain: 'data-ai', title: 'Data Analyst' },
  { id: 'machine-learning', domain: 'data-ai', title: 'Machine Learning' },
  { id: 'ai-agent', domain: 'data-ai', title: 'AI Agent' },
  { id: 'architecture', domain: 'cs', title: 'Kiến trúc máy tính' },
  { id: 'networking', domain: 'cs', title: 'Mạng máy tính' },
  { id: 'cybersecurity', domain: 'cs', title: 'An ninh mạng' },
  { id: 'uncategorized', domain: 'other', title: 'Khác' },
  { id: 'co-giai-phau', domain: 'giai-phau', title: 'Cơ & giải phẫu học' },
];

// source: đường dẫn tương đối trong SOURCE_DIR (file, hoặc folder với tài liệu dạng ảnh).
// Mỗi bài thuộc một category qua topic (topic → domain → category). Bài thuộc category layout 'flat'
// (vd Sức khỏe) khai `category` trực tiếp và BỎ `topic`; build tự gán domain/topic ảo để tra cứu.
// qaContext: ngôn ngữ/công nghệ của câu hỏi trong qa/<slug>.md; câu nào chưa nhắc tới sẽ được ghi rõ
// ("Trong Python, …") vì trên flashcard/quiz câu hỏi đứng một mình, không còn tên tài liệu bên cạnh.
// tags: lesson-series | handbook-images | interview; bài 'flat' thêm tag nội dung để tìm kiếm.
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
    topic: 'java',
    level: 'beginner',
    tags: ['lesson-series'],
    related: ['cam-nang-java'],
  },
  {
    source: 'java-giai-doan-2-oop.md',
    slug: 'java-gd2-oop',
    title: 'Giai đoạn 2: OOP',
    topic: 'java',
    level: 'intermediate',
    tags: ['lesson-series'],
    related: ['java-co-ban-nang-cao', 'automation-interview-3-5-nam'],
  },
  {
    source: 'java-giai-doan-3-collections-exception.md',
    slug: 'java-gd3-collections-exception',
    title: 'Giai đoạn 3: Collections và Exception',
    topic: 'java',
    level: 'intermediate',
    tags: ['lesson-series'],
    related: ['java-co-ban-nang-cao', 'automation-interview-3-5-nam'],
  },
  { source: 'Cẩm Nang Java', slug: 'cam-nang-java', title: 'Cẩm nang nhập môn Java', topic: 'java', level: 'beginner', tags: ['handbook-images'], related: ['java-co-ban-nang-cao', 'java-gd1-cu-phap'] },
  { source: 'Java từ cơ bản đến nâng cao', slug: 'java-co-ban-nang-cao', title: 'Java từ cơ bản đến nâng cao', topic: 'java', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-java', 'java-gd2-oop'] },
  { source: 'Cẩm nang HTML', slug: 'cam-nang-html', title: 'Cẩm nang HTML', topic: 'html', level: 'beginner', tags: ['handbook-images'], note: 'Bộ ảnh gốc thiếu trang 12.', related: ['html-dom-selector'] },
  { source: 'Cẩm nang CSS', slug: 'cam-nang-css', title: 'Cẩm nang CSS', topic: 'css', level: 'beginner', tags: ['handbook-images'], related: ['html-dom-selector'] },
  { source: 'Cẩm nang JavaScript', slug: 'cam-nang-javascript', title: 'Cẩm nang JavaScript', topic: 'javascript', level: 'beginner', tags: ['handbook-images'], related: ['playwright-tu-so-0'] },
  { source: '50 SQL Interview Q&A', slug: 'sql-50-interview', qaContext: 'SQL', title: '50 câu phỏng vấn SQL', topic: 'sql', level: 'intermediate', tags: ['handbook-images', 'interview'], related: ['automation-interview-3-5-nam'] },
  { source: 'Cẩm nang Git', slug: 'cam-nang-git', title: 'Cẩm nang Git', topic: 'git', level: 'beginner', tags: ['handbook-images'] },
  { source: 'Cẩm nang Cloud Computing', slug: 'cam-nang-cloud-computing', title: 'Cẩm nang Cloud Computing', topic: 'cloud', level: 'beginner', tags: ['handbook-images'] },
  { source: 'Kiến trúc máy tính từ A - Z', slug: 'kien-truc-may-tinh-a-z', title: 'Kiến trúc máy tính từ A - Z', topic: 'architecture', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-kien-truc-may-tinh'] },
  { source: 'Cẩm nang kiến trúc máy tính', slug: 'cam-nang-kien-truc-may-tinh', title: 'Cẩm nang kiến trúc máy tính', subtitle: 'Bản tóm tắt để ôn nhanh', topic: 'architecture', level: 'beginner', tags: ['handbook-images'], related: ['kien-truc-may-tinh-a-z'] },
  { source: 'Cẩm nang mạng máy tính', slug: 'cam-nang-mang-may-tinh', title: 'Cẩm nang mạng máy tính', topic: 'networking', level: 'beginner', tags: ['handbook-images'] },
  { source: '70 câu hỏi SQL cơ bản đến nâng cao', slug: 'sql-70-cau-hoi', qaContext: 'SQL', title: '70 câu hỏi SQL cơ bản đến nâng cao', topic: 'sql', level: 'intermediate', tags: ['handbook-images', 'interview'], note: 'Bộ ảnh gốc chỉ có 56 câu; trang 13 trùng trang 1.', related: ['sql-50-interview'] },
  { source: '100 Câu hỏi phỏng vấn Python', slug: 'python-100-phong-van', qaContext: 'Python', title: '100 câu hỏi phỏng vấn Python', topic: 'python', level: 'intermediate', tags: ['handbook-images', 'interview'] },
  { source: 'Cẩm nang C', slug: 'cam-nang-c', title: 'Cẩm nang C', topic: 'c', level: 'beginner', tags: ['handbook-images'], note: 'Bộ ảnh gốc thiếu trang 10–16.', related: ['cam-nang-cpp'] },
  { source: 'Cẩm nang C ++', slug: 'cam-nang-cpp', title: 'Cẩm nang C++', topic: 'cpp', level: 'beginner', tags: ['handbook-images'], related: ['cam-nang-c'] },
  { source: '50 Câu hỏi phỏng vấn Backend', slug: 'backend-50-phong-van', title: '50 câu hỏi phỏng vấn Backend', topic: 'backend', level: 'intermediate', tags: ['handbook-images', 'interview'], related: ['sql-70-cau-hoi', 'cam-nang-docker'] },
  { source: 'Cẩm nang  Devops', slug: 'cam-nang-devops', title: 'Cẩm nang DevOps', topic: 'devops', level: 'beginner', tags: ['handbook-images'], related: ['cam-nang-docker', 'cam-nang-git', 'cam-nang-aws'] },
  { source: 'Cẩm nang Docker', slug: 'cam-nang-docker', title: 'Cẩm nang Docker', topic: 'docker', level: 'beginner', tags: ['handbook-images'], related: ['cam-nang-devops'] },
  { source: 'Cẩm nang AWS Fundamentals', slug: 'cam-nang-aws', title: 'Cẩm nang AWS Fundamentals', topic: 'cloud', level: 'beginner', tags: ['handbook-images'], related: ['cam-nang-cloud-computing', 'cam-nang-devops'] },
  { source: 'Cẩm nang Data Analyst', slug: 'cam-nang-data-analyst', title: 'Cẩm nang Data Analyst', topic: 'data-analysis', level: 'beginner', tags: ['handbook-images'], related: ['data-analyst-co-ban-nang-cao', 'sql-70-cau-hoi'] },
  { source: 'Data Analyst từ cơ bản đến nâng cao', slug: 'data-analyst-co-ban-nang-cao', title: 'Data Analyst từ cơ bản đến nâng cao', topic: 'data-analysis', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-data-analyst'] },
  { source: 'Cẩm nang Machine Learning', slug: 'cam-nang-machine-learning', title: 'Cẩm nang Machine Learning', topic: 'machine-learning', level: 'beginner', tags: ['handbook-images'], related: ['machine-learning-co-ban-nang-cao'] },
  { source: 'Machine Leaning từ cơ bản đến nâng cao', slug: 'machine-learning-co-ban-nang-cao', title: 'Machine Learning từ cơ bản đến nâng cao', topic: 'machine-learning', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-machine-learning', 'phong-van-ai-ml'] },
  { source: 'Cẩm nang phỏng vấn AI-ML', slug: 'phong-van-ai-ml', title: 'Cẩm nang phỏng vấn AI/ML', topic: 'machine-learning', level: 'intermediate', tags: ['handbook-images', 'interview'], related: ['machine-learning-co-ban-nang-cao'] },
  { source: 'AI Agent', slug: 'ai-agent', title: 'AI Agent', topic: 'ai-agent', level: 'intermediate', tags: ['handbook-images'], related: ['cam-nang-machine-learning'] },
  { source: 'Cẩm nang Cybersecurity', slug: 'cam-nang-cybersecurity', title: 'Cẩm nang Cybersecurity', topic: 'cybersecurity', level: 'beginner', tags: ['handbook-images'], related: ['cam-nang-mang-may-tinh'] },
  { source: 'Cơ Ức Đòn Chũm (SCM)/TÓM TẮT SINH ĐỘNG - SCM.md', slug: 'scm-tom-tat', title: 'Cơ Ức–Đòn–Chũm (SCM) — Tóm tắt sinh động', subtitle: 'Tài liệu giáo dục, không thay thế chẩn đoán/điều trị y tế', topic: 'co-giai-phau', level: 'beginner', tags: ['cột sống', 'cơ SCM', 'cổ vai gáy', 'giải phẫu', 'tác động cột sống'], related: ['scm-infographic'] },
  { source: 'Cơ Ức Đòn Chũm (SCM)', slug: 'scm-infographic', title: 'Cơ Ức–Đòn–Chũm (SCM) — Infographic gốc', topic: 'co-giai-phau', level: 'beginner', tags: ['cột sống', 'cơ SCM', 'cổ vai gáy', 'giải phẫu'], note: 'Ảnh gốc: 1,2,4,5,7 (bộ gốc không có 3 và 6).', related: ['scm-tom-tat'] },
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
    steps: ['kien-truc-may-tinh-a-z', 'cam-nang-kien-truc-may-tinh', 'cam-nang-mang-may-tinh', 'cam-nang-cybersecurity'],
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud',
    description: 'Git làm nền, rồi DevOps, Docker và điện toán đám mây với AWS.',
    steps: ['cam-nang-git', 'cam-nang-devops', 'cam-nang-docker', 'cam-nang-cloud-computing', 'cam-nang-aws'],
  },
  {
    id: 'data-ai',
    title: 'Data & AI',
    description: 'Phân tích dữ liệu với SQL, rồi Machine Learning, AI Agent và phỏng vấn AI/ML.',
    steps: [
      'cam-nang-data-analyst',
      'sql-70-cau-hoi',
      'data-analyst-co-ban-nang-cao',
      'cam-nang-machine-learning',
      'machine-learning-co-ban-nang-cao',
      'ai-agent',
      'phong-van-ai-ml',
    ],
  },
];
