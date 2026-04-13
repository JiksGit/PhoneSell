package com.sungji.controller.dto;

import com.sungji.entity.PriceRecord;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PriceRecordResponse {
    private Long id;
    private Long phoneId;
    private String modelName;
    private Integer price;
    private String source;
    private String sourceUrl;
    private LocalDateTime crawledAt;

    public static PriceRecordResponse from(PriceRecord record) {
        return PriceRecordResponse.builder()
                .id(record.getId())
                .phoneId(record.getPhone().getId())
                .modelName(record.getPhone().getModelName())
                .price(record.getPrice())
                .source(record.getSource())
                .sourceUrl(record.getSourceUrl())
                .crawledAt(record.getCrawledAt())
                .build();
    }
}
