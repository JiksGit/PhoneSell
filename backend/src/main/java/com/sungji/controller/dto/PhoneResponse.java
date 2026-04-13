package com.sungji.controller.dto;

import com.sungji.entity.Phone;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PhoneResponse {
    private Long id;
    private String modelName;
    private String brand;
    private LocalDateTime createdAt;

    public static PhoneResponse from(Phone phone) {
        return PhoneResponse.builder()
                .id(phone.getId())
                .modelName(phone.getModelName())
                .brand(phone.getBrand())
                .createdAt(phone.getCreatedAt())
                .build();
    }
}
