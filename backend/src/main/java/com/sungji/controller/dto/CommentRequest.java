package com.sungji.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommentRequest {
    @NotBlank(message = "댓글 내용을 입력해 주세요")
    @Size(max = 1000, message = "댓글은 1000자 이하로 입력해 주세요")
    private String content;
}
