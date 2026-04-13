package com.sungji.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class PostRequest {
    @NotBlank @Size(max = 200) private String title;
    @NotBlank private String content;
}
