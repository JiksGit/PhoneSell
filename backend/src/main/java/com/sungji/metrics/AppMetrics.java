package com.sungji.metrics;

import com.sungji.repository.UserWatchlistRepository;
import io.micrometer.core.instrument.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AppMetrics {

    private final MeterRegistry meterRegistry;
    private final UserWatchlistRepository userWatchlistRepository;

    private Counter crawlerSuccessCounter;
    private Counter crawlerFailCounter;
    private Counter alertSentCounter;
    private Timer crawlerDurationTimer;

    @PostConstruct
    public void initMetrics() {
        crawlerSuccessCounter = Counter.builder("crawler_success_count")
                .description("크롤링 성공 횟수")
                .tag("source", "ppomppu")
                .register(meterRegistry);

        crawlerFailCounter = Counter.builder("crawler_fail_count")
                .description("크롤링 실패 횟수")
                .tag("source", "ppomppu")
                .register(meterRegistry);

        alertSentCounter = Counter.builder("alert_sent_count")
                .description("FCM 알림 발송 횟수")
                .register(meterRegistry);

        crawlerDurationTimer = Timer.builder("crawler_duration")
                .description("크롤링 소요 시간")
                .register(meterRegistry);

        // 활성 사용자 수 Gauge - watchlist 테이블 기준
        Gauge.builder("api_active_users", userWatchlistRepository, repo -> {
            try {
                return repo.countDistinctDeviceTokens();
            } catch (Exception e) {
                return 0;
            }
        })
        .description("관심 목록 등록 사용자 수 (Gauge)")
        .register(meterRegistry);
    }

    public void incrementCrawlerSuccess() {
        crawlerSuccessCounter.increment();
    }

    public void incrementCrawlerFail() {
        crawlerFailCounter.increment();
    }

    public void incrementAlertSent() {
        alertSentCounter.increment();
    }

    public Timer getCrawlerDurationTimer() {
        return crawlerDurationTimer;
    }
}
