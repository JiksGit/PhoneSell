package com.sungji.controller.dto;

import com.sungji.entity.User;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private String role;
    private LocalDateTime createdAt;
    private long postCount;
    private long watchlistCount;

    public static UserProfileResponse from(User user, long postCount, long watchlistCount) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .postCount(postCount)
                .watchlistCount(watchlistCount)
                .build();
    }
}
