package com.sungji.controller;

import com.sungji.controller.dto.*;
import com.sungji.entity.User;
import com.sungji.repository.UserRepository;
import com.sungji.repository.UserWatchlistRepository;
import com.sungji.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository         userRepository;
    private final UserWatchlistRepository watchlistRepository;
    private final PostService            postService;

    /** 내 프로필 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        Long userId = currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        long postCount      = postService.countByUser(userId);
        long watchlistCount = watchlistRepository.countByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(
                UserProfileResponse.from(user, postCount, watchlistCount)));
    }

    /** 내 게시글 목록 */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<PagedResponse<PostResponse>>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getMyPosts(currentUserId(), page, size)));
    }

    /** 디바이스 토큰 업데이트 (앱 재시작 시 토큰 갱신) */
    @PatchMapping("/device-token")
    public ResponseEntity<ApiResponse<Void>> updateDeviceToken(
            @RequestBody DeviceTokenRequest req) {
        Long userId = currentUserId();
        userRepository.findById(userId).ifPresent(user -> {
            user.setDeviceToken(req.getDeviceToken());
            userRepository.save(user);
        });
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long currentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getDetails();
    }
}
