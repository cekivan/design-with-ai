# Eleştiri Listesi

Her maddeyi **0, 1 veya 2** ile puanlayın: 0 = yok/kötü, 1 = kısmen, 2 = iyi. En yüksek puan 20'dir.

AI'ın kendi raporuna güvenmeyin; ekranlara **siz** bakın.

| # | Madde | Tur 1 | Tur 2 | Tur 3 |
| --- | --- | --- | --- | --- |
| 1 | **Hiyerarşi:** Her ekranda gözün ilk gittiği tek bir şey var. | 1 | 2 | 2 |
| 2 | **Ana aksiyon:** Her ekranda ne yapmam gerektiği 2 saniyede belli. | 0 | 0 | 2 |
| 3 | **Kontrast:** Metinler **iki temada da** rahat okunuyor (4.5:1, [kontrol et](https://webaim.org/resources/contrastchecker/)). | 0 | 2 | 2 |
| 4 | **Renk:** Gri tonlar taşıyor; vurgu rengi sadece seçili / güncel olanda. | 0 | 2 | 2 |
| 5 | **Tipografi:** Tek aile, en fazla 5 boyut, rakamlar sütunda hizalı. | 1 | 0 | 1 |
| 6 | **Boşluk:** Ait olan şeyler yakın, gruplar arası nefes alıyor. | 0 | 1 | 2 |
| 7 | **Tıklama ve durumlar:** Butonlar rahat tıklanır (ana buton ≥ 44px); hover, odak ve boş/hata durumları var. | 2 | 2 | 2 |
| 8 | **Form:** Alanların görünür etiketi var, hata durumu düşünülmüş. | 0 | 1 | 2 |
| 9 | **Özgünlük:** "AI yaptı" belli değil (gradient, emoji ikon, her şey ortalı vb. yok). | 0 | 1 | 2 |
| 10 | **Persona:** Bu tasarım DESIGN.md'deki kişiye gerçekten uygun. | 2 | 1 | 2 |
| | **Toplam (20)** | **6** | **12** | **19** |

## Tur 3: Hedefli geri bildirim

Tur 2'de en düşük puan alan 3 madde için AI'a **somut** geri bildirim verin.

| ❌ Belirsiz | ✅ Hedefli |
| --- | --- |
| "Daha güzel yap." | "Listede tarih kaybolmuş; tarihi ilk sütuna al, değeri 15px medium, gün adını soluk yaz." |
| "Daha modern olsun." | "Gölgeleri kaldır; derinliği panel → inset katmanı ve 1px çizgiyle ver." |
| "Buton kötü." | "Kayıt butonu açık temada vurgu renginde ve 3.1:1; --btn rengine al, 44px yap, formun sağ altına koy." |

Yazdığınız geri bildirimler:

1. **Ana aksiyon (#2):** `+ Yeni teslim ekle` ana aksiyon butonu sayfa altında kalmış; `Bu Hafta` başlığının sağ üstüne (`48px`, scroll etmeden görünür) al. Haftalık programa **Düzenleme Modu** ekle: sürükleyip gün/saat değiştirme, üst/alt kenardan süre uzatma/kısaltma, ders/etkinlik ekleme-çıkarma ve `Geri al (Ctrl+Z)` çalışsın.
2. **Tipografi (#5):** Yazı boyutları bilgisayarda göz konforu için küçük kalıyor; 5'li ölçeği bir kademe büyüt (`14 / 16 / 19 / 28 / 34px`), takvim bloklarında ders adını `16px medium (--text)`, saat ve yeri `14px (--text-2)` yap.
3. **Form (#8):** Yeni teslim, yeni ders/etkinlik ve sağ panel not formlarında her alanın üstüne görünür etiket + `Zorunlu / İsteğe bağlı` bilgisi, altına kısa yardımcı metin ve anlık doğrulama hatası ekle.

## Tur 3: Skill'e işleyin

Bu turda öğrendiğiniz en az **2 kuralı** `skills/ui-design/SKILL.md` dosyasının en altındaki **Team learnings** bölümüne yazın (Kural / Neden / Örnek). Sonra AI'a skill'i yeniden okutup `round-3/index.html`'i üretin.

Böylece bir dahaki sefere aynı hatayı düzeltmenize gerek kalmaz: skill artık sizin zevkinizi biliyor.
