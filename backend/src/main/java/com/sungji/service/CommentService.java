package com.sungji.service;

import com.sungji.controller.dto.CommentRequest;
import com.sungji.controller.dto.CommentResponse;
import com.sungji.entity.Comment;
import com.sungji.entity.Post;
import com.sungji.entity.User;
import com.sungji.repository.CommentRepository;
import com.sungji.repository.PostRepository;
import com.sungji.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository    postRepository;
    private final UserRepository    userRepository;

    public List<CommentResponse> getComments(Long postId) {
        return commentRepository.findByPostIdWithUser(postId)
                .stream().map(CommentResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(Long userId, Long postId, CommentRequest req) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + postId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Comment comment = commentRepository.save(Comment.builder()
                .post(post).user(user).content(req.getContent()).build());
        return CommentResponse.from(comment);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다: " + commentId));
        if (!isAdmin && !comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인 댓글만 삭제할 수 있습니다");
        }
        commentRepository.delete(comment);
    }
}
