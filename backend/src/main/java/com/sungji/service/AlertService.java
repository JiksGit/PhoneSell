package com.sungji.service;

import com.google.firebase.messaging.*;
import com.sungji.entity.PriceRecord;
import com.sungji.entity.UserWatchlist;
import com.sungji.metrics.AppMetrics;
import com.sungji.repository.PriceRecordRepository;
import com.sungji.repository.UserWatchlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AlertService {

    private final UserWatchlistRepository userWatchlistRepository;
    private final PriceRecordRepository   priceRecordRepository;
    private final AppMetrics              appMetrics;

    // ─── 주기적 전체 체크 (30분마다) ─────────────────────────────

    @Scheduled(fixedDelayString = "${app.crawler.schedule-delay-ms:1800000}")
    public void checkAndSendAlerts() {
        log.info("[알림] 전체 관심 목록 가격 체크 시작");
        List<UserWatchlist> items = userWatchlistRepository.findAll();
        for (UserWatchlist item : items) {
            if (item.getTargetPrice() == null) continue;
            priceRecordRepository
                    .findTopByPhoneIdOrderByPriceAscCrawledAtDesc(item.getPhone().getId())
                    .ifPresent(record -> {
                        if (record.getPrice() <= item.getTargetPrice()) {
                            sendNotification(item, record);
                        }
                    });
        }
        log.info("[알림] 전체 가격 알림 체크 완료");
    }

    // ─── 크롤러가 새 가격 저장 직후 즉시 체크 ───────────────────

    public void checkAlertForNewPrice(PriceRecord record) {
        List<UserWatchlist> items =
                userWatchlistRepository.findByPhoneIdAndTargetPriceIsNotNull(record.getPhone().getId());
        for (UserWatchlist item : items) {
            if (record.getPrice() <= item.getTargetPrice()) {
                sendNotification(item, record);
            }
        }
    }

    // ─── 알림 발송 (Expo / FCM 자동 선택) ───────────────────────

    private void sendNotification(UserWatchlist watchlist, PriceRecord record) {
        // 토큰 우선순위: 유저 등록 토큰 > watchlist 레거시 토큰
        String token = null;
        if (watchlist.getUser() != null && watchlist.getUser().getDeviceToken() != null) {
            token = watchlist.getUser().getDeviceToken();
        } else if (watchlist.getDeviceToken() != null) {
            token = watchlist.getDeviceToken();
        }
        if (token == null || token.isBlank()) return;

        String title = "🎉 목표 가격 달성!";
        String body  = String.format("%s — %,d원 (목표: %,d원)",
                record.getPhone().getModelName(),
                record.getPrice(),
                watchlist.getTargetPrice());

        if (token.startsWith("ExponentPushToken[")) {
            sendExpoPush(token, title, body, record);
        } else {
            sendFcmPush(token, title, body, record);
        }
    }

    /** Expo Managed Workflow 푸시 (https://exp.host/--/api/v2/push/send) */
    private void sendExpoPush(String token, String title, String body, PriceRecord record) {
        try {
            String json = String.format("""
                    {
                      "to": "%s",
                      "title": "%s",
                      "body": "%s",
                      "sound": "default",
                      "data": {
                        "phoneId": "%d",
                        "price": "%d",
                        "sourceUrl": "%s"
                      }
                    }
                    """,
                    token, escapeJson(title), escapeJson(body),
                    record.getPhone().getId(), record.getPrice(),
                    record.getSourceUrl() != null ? record.getSourceUrl() : "");

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://exp.host/--/api/v2/push/send"))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(res -> {
                        if (res.statusCode() == 200) {
                            appMetrics.incrementAlertSent();
                            log.info("[알림] Expo 푸시 발송 성공 — {}", record.getPhone().getModelName());
                        } else {
                            log.warn("[알림] Expo 푸시 발송 실패 — status: {}, body: {}",
                                    res.statusCode(), res.body());
                        }
                    });
        } catch (Exception e) {
            log.error("[알림] Expo 푸시 예외 — token: {}, error: {}", token, e.getMessage());
        }
    }

    /** Firebase FCM 푸시 (네이티브 토큰) */
    private void sendFcmPush(String token, String title, String body, PriceRecord record) {
        try {
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title).setBody(body).build())
                    .putData("phoneId",   String.valueOf(record.getPhone().getId()))
                    .putData("price",     String.valueOf(record.getPrice()))
                    .putData("source",    record.getSource())
                    .putData("sourceUrl", record.getSourceUrl() != null ? record.getSourceUrl() : "")
                    .build();

            FirebaseMessaging.getInstance().send(message);
            appMetrics.incrementAlertSent();
            log.info("[알림] FCM 발송 성공 — {}, {}원",
                    record.getPhone().getModelName(), record.getPrice());
        } catch (FirebaseMessagingException e) {
            log.error("[알림] FCM 발송 실패 — token: {}, error: {}", token, e.getMessage());
        }
    }

    private String escapeJson(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
