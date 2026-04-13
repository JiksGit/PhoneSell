package com.sungji.controller.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WatchlistRequest {

    @NotNull(message = "phoneId는 필수입니다")
    private Long phoneId;

    private Integer targetPrice;
}
