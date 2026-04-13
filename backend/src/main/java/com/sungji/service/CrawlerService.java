package com.sungji.service;

import com.sungji.entity.Phone;
import com.sungji.entity.PriceRecord;
import com.sungji.metrics.AppMetrics;
import com.sungji.repository.PhoneRepository;
import com.sungji.repository.PriceRecordRepository;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class CrawlerService {

    private final PhoneRepository       phoneRepository;
    private final PriceRecordRepository priceRecordRepository;
    private final AppMetrics            appMetrics;
    private final AlertService          alertService;   // 즉시 알림 연동

    @Value("${app.crawler.ppomppu-url}")
    private String ppomppuUrl;

    private static final int CRAWL_PAGES = 5;

    @Scheduled(initialDelay = 10000, fixedDelayString = "${app.crawler.schedule-delay-ms:1800000}")
    public void crawlPpomppu() {
        log.info("[크롤러] 뽐뿌 크롤링 시작 ({}페이지)", CRAWL_PAGES);
        Timer.Sample sample = Timer.start();
        int totalSaved = 0;

        try {
            for (int page = 1; page <= CRAWL_PAGES; page++) {
                String url = ppomppuUrl + "&page=" + page;
                int saved = crawlPage(url, page);
                totalSaved += saved;
                if (saved == 0 && page > 1) break;
                Thread.sleep(1500);
            }
            sample.stop(appMetrics.getCrawlerDurationTimer());
            appMetrics.incrementCrawlerSuccess();
            log.info("[크롤러] 완료 — 신규 저장: {}건", totalSaved);

        } catch (Exception e) {
            sample.stop(appMetrics.getCrawlerDurationTimer());
            appMetrics.incrementCrawlerFail();
            log.error("[크롤러] 실패: {}", e.getMessage(), e);
        }
    }

    private int crawlPage(String url, int pageNum) {
        int saved = 0;
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                               "AppleWebKit/537.36 (KHTML, like Gecko) " +
                               "Chrome/124.0.0.0 Safari/537.36")
                    .referrer("https://www.ppomppu.co.kr")
                    .header("Accept-Language", "ko-KR,ko;q=0.9")
                    .timeout(20_000)
                    .get();

            Elements rows = doc.select(
                "tr.common-list1, tr.common-list0, tr[class*=baseNotice]"
            );
            log.info("[크롤러] {}페이지 — {}행 발견", pageNum, rows.size());

            for (Element row : rows) {
                try {
                    Element titleEl = findTitleElement(row);
                    if (titleEl == null) continue;

                    String title = titleEl.text().trim();
                    if (title.isEmpty()) continue;

                    String href = titleEl.absUrl("href");
                    if (href.isEmpty()) href = "https://www.ppomppu.co.kr" + titleEl.attr("href");

                    if (!containsPhoneModel(title)) continue;
                    if (priceRecordRepository.existsBySourceUrl(href)) {
                        log.debug("[크롤러] 중복 스킵: {}", href);
                        continue;
                    }

                    Integer price = extractPrice(title);
                    if (price == null) continue;

                    String modelName = extractModelName(title);
                    String brand     = detectBrand(title);

                    // 저장 후 즉시 알림 체크
                    PriceRecord record = saveOrUpdatePriceRecord(modelName, brand, price, "뽐뿌", href);
                    alertService.checkAlertForNewPrice(record);
                    saved++;
                    log.info("[크롤러] p{} 저장 — {}, {}원",
                            pageNum, modelName.substring(0, Math.min(30, modelName.length())), price);

                } catch (Exception e) {
                    log.warn("[크롤러] 행 파싱 오류: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("[크롤러] {}페이지 접근 실패: {}", pageNum, e.getMessage());
        }
        return saved;
    }

    private Element findTitleElement(Element row) {
        String[] selectors = {
            "a.baseList-title",
            "td.baseList-title a",
            "td[class*=title] a",
            "a[href*=view.php]",
            "a[href*=no=]"
        };
        for (String sel : selectors) {
            Element el = row.selectFirst(sel);
            if (el != null && !el.text().trim().isEmpty()) return el;
        }
        return null;
    }

    @Transactional
    protected PriceRecord saveOrUpdatePriceRecord(String modelName, String brand,
                                                   int price, String source, String url) {
        Phone phone = phoneRepository.findByModelNameAndBrand(modelName, brand)
                .orElseGet(() -> phoneRepository.save(
                        Phone.builder().modelName(modelName).brand(brand).build()
                ));
        return priceRecordRepository.save(PriceRecord.builder()
                .phone(phone).price(price).source(source).sourceUrl(url).build());
    }

    private boolean containsPhoneModel(String text) {
        String t = text.toLowerCase();
        return t.contains("갤럭시") || t.contains("galaxy") || t.contains("갤") ||
               t.contains("아이폰") || t.contains("iphone") ||
               t.contains("아이패드") || t.contains("ipad")  ||
               t.contains("샤오미") || t.contains("xiaomi") ||
               t.contains("픽셀")  || t.contains("pixel")   ||
               t.contains("플립")  || t.contains("폴드")     ||
               t.contains("s24")  || t.contains("s25")      ||
               t.contains("s26")  || t.contains("s23")      ||
               t.contains("a55")  || t.contains("a54")      ||
               t.contains("성지")  || t.contains("공시")      ||
               t.contains("기변")  || t.contains("번이")      ||
               t.contains("유심");
    }

    Integer extractPrice(String text) {
        if (text == null) return null;
        Matcher m1 = Pattern.compile("(\\d{1,3}(?:\\.\\d)?)\\s*만\\s*원").matcher(text);
        if (m1.find()) {
            double val = Double.parseDouble(m1.group(1)) * 10000;
            if (val >= 10000 && val <= 3000000) return (int) val;
        }
        Matcher m2 = Pattern.compile("(\\d{1,3}(?:\\.\\d)?)\\s*만(?=[\\s/,+\\-\\n]|$)").matcher(text);
        while (m2.find()) {
            try {
                double val = Double.parseDouble(m2.group(1)) * 10000;
                if (val >= 50000 && val <= 2000000) return (int) val;
            } catch (NumberFormatException ignored) {}
        }
        Matcher m3 = Pattern.compile("(\\d{1,3}(?:,\\d{3})*)\\s*원").matcher(text);
        if (m3.find()) {
            try {
                int val = Integer.parseInt(m3.group(1).replace(",", ""));
                if (val >= 50000 && val <= 2000000) return val;
            } catch (NumberFormatException ignored) {}
        }
        Matcher m4 = Pattern.compile("\\b(\\d{5,7})\\b").matcher(text);
        while (m4.find()) {
            try {
                int val = Integer.parseInt(m4.group(1));
                if (val >= 50000 && val <= 2000000) return val;
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String extractModelName(String title) {
        String cleaned = title
                .replaceAll("\\d{1,3}(?:\\.\\d)?\\s*만\\s*원?", "")
                .replaceAll("\\d{1,3}(?:,\\d{3})+\\s*원?", "")
                .replaceAll("[\\[\\]【】()（）]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return cleaned.length() > 100 ? cleaned.substring(0, 100) : cleaned;
    }

    private String detectBrand(String title) {
        String t = title.toLowerCase();
        if (t.contains("갤럭시") || t.contains("galaxy") || t.contains("갤") || t.contains("삼성")) return "삼성";
        if (t.contains("아이폰") || t.contains("iphone") || t.contains("아이패드")) return "애플";
        if (t.contains("샤오미") || t.contains("xiaomi")) return "샤오미";
        if (t.contains("픽셀")   || t.contains("pixel"))  return "구글";
        return "기타";
    }
}
