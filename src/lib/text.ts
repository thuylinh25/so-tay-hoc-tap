/** Bỏ dấu tiếng Việt + chữ thường, giữ nguyên độ dài chuỗi (mỗi ký tự → đúng một ký tự) để map vị trí khi tô sáng. */
export function fold(s: string): string {
  let out = '';
  for (const ch of s) {
    const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
    const c = (base || ch)[0].toLowerCase();
    out += c === 'đ' ? 'd' : c;
    // Ký tự ngoài BMP chiếm 2 code unit: giữ đúng độ dài.
    if (ch.length === 2) out += ' ';
  }
  return out;
}

export const tokenize = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

export interface Segment {
  text: string;
  hit: boolean;
}

/** Cắt đoạn trích quanh lần xuất hiện đầu tiên của từ khóa và đánh dấu các chỗ khớp. */
export function excerpt(text: string, terms: string[], radius = 90): Segment[] {
  if (!text) return [];
  const folded = fold(text);
  const ts = terms.map(fold).filter((t) => t.length > 1);
  let first = -1;
  for (const t of ts) {
    const i = folded.indexOf(t);
    if (i >= 0 && (first < 0 || i < first)) first = i;
  }
  const start = Math.max(0, first < 0 ? 0 : first - radius);
  const end = Math.min(text.length, (first < 0 ? 0 : first) + radius * 2);
  const slice = text.slice(start, end);
  const fslice = folded.slice(start, end);
  const marks = new Array(slice.length).fill(false);
  for (const t of ts) {
    let i = fslice.indexOf(t);
    while (i >= 0) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = fslice.indexOf(t, i + t.length);
    }
  }
  const segs: Segment[] = [];
  if (start > 0) segs.push({ text: '…', hit: false });
  for (let i = 0; i < slice.length; i++) {
    const last = segs[segs.length - 1];
    if (last && last.hit === marks[i] && last.text !== '…') last.text += slice[i];
    else segs.push({ text: slice[i], hit: marks[i] });
  }
  if (end < text.length) segs.push({ text: '…', hit: false });
  return segs;
}
