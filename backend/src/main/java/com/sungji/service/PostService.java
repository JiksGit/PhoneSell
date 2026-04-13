package com.sungji.service;

import com.sungji.controller.dto.PagedResponse;
import com.sungji.controller.dto.PostRequest;
import com.sungji.controller.dto.PostResponse;
import com.sungji.entity.Post;
import com.sungji.entity.User;
import com.sungji.repository.CommentRepository;
import com.sungji.repository.PostRepository;
import com.sungji.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository    postRepository;
    private final UserRepository    userRepository;
    private final CommentRepository commentRepository;

    public PagedResponse<PostResponse> getPosts(int page, int size) {
        List<PostResponse> items = postRepository
                .findAllWithUser(PageRequest.of(page, size))
                .stream().map(p -> PostResponse.from(p, commentRepository.countByPostId(p.getId())))
                .collect(Collectors.toList());
        return new PagedResponse<>(items, page, size, postRepository.count());
    }

    public PostResponse getPost(Long id) {
        Post post = findPost(id);
        return PostResponse.from(post, commentRepository.countByPostId(post.getId()));
    }

    public PagedResponse<PostResponse> getMyPosts(Long userId, int page, int size) {
        List<PostResponse> items = postRepository
                .findByUserIdWithUser(userId, PageRequest.of(page, size))
                .stream().map(p -> PostResponse.from(p, commentRepository.countByPostId(p.getId())))
                .collect(Collectors.toList());
        return new PagedResponse<>(items, page, size, postRepository.countByUserId(userId));
    }

    @Transactional
    public PostResponse createPost(Long userId, PostRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Post post = postRepository.save(Post.builder()
                .user(user).title(req.getTitle()).content(req.getContent()).build());
        return PostResponse.from(post, 0L);
    }

    @Transactional
    public PostResponse updatePost(Long userId, Long postId, PostRequest req) {
        Post post = findPost(postId);
        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인 글만 수정할 수 있습니다");
        }
        post.setTitle(req.getTitle());
        post.setContent(req.getContent());
        return PostResponse.from(post, commentRepository.countByPostId(post.getId()));
    }

    @Transactional
    public void deletePost(Long userId, Long postId, boolean isAdmin) {
        Post post = findPost(postId);
        if (!isAdmin && !post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인 글만 삭제할 수 있습니다");
        }
        commentRepository.deleteAll(commentRepository.findByPostIdWithUser(postId));
        postRepository.delete(post);
    }

    public long countByUser(Long userId) {
        return postRepository.countByUserId(userId);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다: " + id));
    }
}
