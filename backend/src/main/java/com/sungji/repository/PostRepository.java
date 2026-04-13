package com.sungji.repository;

import com.sungji.entity.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p JOIN FETCH p.user ORDER BY p.createdAt DESC")
    List<Post> findAllWithUser(Pageable pageable);

    @Query("SELECT p FROM Post p JOIN FETCH p.user u WHERE u.id = :userId ORDER BY p.createdAt DESC")
    List<Post> findByUserIdWithUser(@Param("userId") Long userId, Pageable pageable);

    long countByUserId(Long userId);

    long count();
}
