export const THEME_KEY = 'so-tay-theme';

/** Chạy trong <head> trước khi vẽ trang để không nháy sai theme. */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
