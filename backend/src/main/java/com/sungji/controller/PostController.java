package com.sungji.controller;

import com.sungji.controller.dto.*;
import com.sungji.service.CommentService;
import com.sungji.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class PostController {

    private final PostService    postService;
    private final CommentService commentService;

    // ─── 게시글 CRUD ──────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PostResponse>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPosts(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPost(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody PostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(postService.createPost(currentUserId(), req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(postService.updatePost(currentUserId(), id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(currentUserId(), id, isAdmin());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── 댓글 ─────────────────────────────────────────────────────

    /** 댓글 목록 조회 (비로그인 허용) */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.ok(commentService.getComments(postId)));
    }

    /** 댓글 작성 (로그인 필요) */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(commentService.addComment(currentUserId(), postId, req)));
    }

    /** 댓글 삭제 (본인 또는 관리자) */
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        commentService.deleteComment(currentUserId(), commentId, isAdmin());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── 헬퍼 ─────────────────────────────────────────────────────

    private Long currentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getDetails();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
