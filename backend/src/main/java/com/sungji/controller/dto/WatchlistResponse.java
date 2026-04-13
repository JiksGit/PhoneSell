package com.sungji.controller.dto;

import com.sungji.entity.UserWatchlist;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class WatchlistResponse {
    private Long id;
    private Long userId;
    private Long phoneId;
    private String modelName;
    private String brand;
    private Integer targetPrice;
    private Integer currentPrice;
    private LocalDateTime createdAt;

    public static WatchlistResponse from(UserWatchlist watchlist) {
        return WatchlistResponse.builder()
                .id(watchlist.getId())
                .userId(watchlist.getUser() != null ? watchlist.getUser().getId() : null)
                .phoneId(watchlist.getPhone().getId())
                .modelName(watchlist.getPhone().getModelName())
                .brand(watchlist.getPhone().getBrand())
                .targetPrice(watchlist.getTargetPrice())
                .createdAt(watchlist.getCreatedAt())
                .build();
    }
}
