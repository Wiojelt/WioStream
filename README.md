# WioStream

Canlı adres: https://wiojelt.github.io/

## Siteyi kendin düzenle

1. [site-content.js dosyasını aç](https://github.com/Wiojelt/wiojelt.github.io/edit/main/site-content.js) ve GitHub hesabınla giriş yap.
2. Kalem simgesinden metni veya bağlantıyı değiştir. Tırnak işaretlerini ve virgülleri koru.
3. **Commit changes** düğmesine bas. GitHub Pages değişikliği birkaç dakika içinde yayınlar. Gerekirse sayfayı `Ctrl+F5` ile yenile.

`site-content.js` içinde varsayılan tema, duyuru, kurulum kodu, iletişim ve destek bağlantıları, durum metinleri ve kartların kısa açıklamaları bulunur. Bir kartın `repo`, `logo` veya `sources` değerini değiştirmek istersen ilgili kartın içine aynı adlarla yeni alan ekleyebilirsin. Örnek:

Site her açıldığında koyu temaya döner ve altı paletten birini önceki açılıştan farklı seçer. `appearance` bölümünde `rotatePaletteOnLoad: false` yaparsan seçilen palet kalıcı olur; `rememberTheme: true` yaparsan açık/koyu tercihi de hatırlanır.

```js
WioKids: {
  summary: 'Yeni kısa açıklama.',
  repo: 'https://raw.githubusercontent.com/Wiojelt/WioKids/main/repo.json',
  sources: ['ÇizgiMax', 'Minika Çocuk']
}
```

Renkler ve hareketler `site.css` içinde; sayfa düzeni ve ayrıntılı eklenti açıklamaları `index.html` içindedir. Büyük değişikliklerden önce GitHub'da dosyanın önceki sürümüne **History** bölümünden dönebilirsin.

## Yerel önizleme

```powershell
python -m http.server 8765
```

Site GitHub Pages üzerinde `Wiojelt/wiojelt.github.io` deposunun `main` dalından yayınlanır. Bu `WioStream` deposu aynı sitenin proje kopyasıdır; kendi yaptığın küçük değişiklikleri yayına almak için **wiojelt.github.io** deposunu düzenle.


