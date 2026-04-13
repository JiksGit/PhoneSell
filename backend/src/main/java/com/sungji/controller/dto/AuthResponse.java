package com.sungji.controller.dto;

import com.sungji.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class AuthResponse {
    private Long userId;
    private String username;
    private String role;
    private String token;

    public static AuthResponse of(User user, String token) {
        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name())
                .token(token)
                .build();
    }
}
