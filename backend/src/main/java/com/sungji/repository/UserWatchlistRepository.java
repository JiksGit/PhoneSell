package com.sungji.repository;

import com.sungji.entity.UserWatchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserWatchlistRepository extends JpaRepository<UserWatchlist, Long> {

    List<UserWatchlist> findByDeviceToken(String deviceToken);

    List<UserWatchlist> findByUserId(Long userId);

    List<UserWatchlist> findByPhoneIdAndTargetPriceIsNotNull(Long phoneId);

    long countByUserId(Long userId);

    @Query("SELECT COUNT(DISTINCT w.deviceToken) FROM UserWatchlist w")
    long countDistinctDeviceTokens();
}
