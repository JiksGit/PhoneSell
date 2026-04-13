package com.sungji.service;

import com.sungji.controller.dto.*;
import com.sungji.entity.Phone;
import com.sungji.entity.User;
import com.sungji.entity.UserWatchlist;
import com.sungji.repository.PhoneRepository;
import com.sungji.repository.PriceRecordRepository;
import com.sungji.repository.UserRepository;
import com.sungji.repository.UserWatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhoneService {

    private final PhoneRepository         phoneRepository;
    private final PriceRecordRepository   priceRecordRepository;
    private final UserWatchlistRepository  userWatchlistRepository;
    private final UserRepository          userRepository;

    public List<PhoneResponse> getAllPhones() {
        return phoneRepository.findAll().stream()
                .map(PhoneResponse::from).collect(Collectors.toList());
    }

    /** 최신순 — 브랜드·가격 범위 필터 지원 */
    public PagedResponse<PriceRecordResponse> getRecentDeals(
            int page, int size, String brand, Integer minPrice, Integer maxPrice) {
        String b   = (brand == null || brand.isBlank()) ? null : brand;
        List<PriceRecordResponse> items = priceRecordRepository
                .findRecentDealsFiltered(b, minPrice, maxPrice, PageRequest.of(page, size))
                .stream().map(PriceRecordResponse::from).collect(Collectors.toList());
        long total = priceRecordRepository.countDealsFiltered(b, minPrice, maxPrice);
        return new PagedResponse<>(items, page, size, total);
    }

    /** 가격 낮은 순 — 브랜드·가격 범위 필터 지원 */
    public PagedResponse<PriceRecordResponse> getLowestDeals(
            int page, int size, String brand, Integer minPrice, Integer maxPrice) {
        String b   = (brand == null || brand.isBlank()) ? null : brand;
        List<PriceRecordResponse> items = priceRecordRepository
                .findDealsOrderByPriceFiltered(b, minPrice, maxPrice, PageRequest.of(page, size))
                .stream().map(PriceRecordResponse::from).collect(Collectors.toList());
        long total = priceRecordRepository.countDealsFiltered(b, minPrice, maxPrice);
        return new PagedResponse<>(items, page, size, total);
    }

    public List<PriceRecordResponse> getPriceHistory(Long phoneId) {
        phoneRepository.findById(phoneId)
                .orElseThrow(() -> new IllegalArgumentException("폰을 찾을 수 없습니다: " + phoneId));
        return priceRecordRepository
                .findByPhoneIdOrderByCrawledAtDesc(phoneId, PageRequest.of(0, 100))
                .stream().map(PriceRecordResponse::from).collect(Collectors.toList());
    }

    public PriceRecordResponse getLatestLowestPrice(Long phoneId) {
        phoneRepository.findById(phoneId)
                .orElseThrow(() -> new IllegalArgumentException("폰을 찾을 수 없습니다: " + phoneId));
        return priceRecordRepository
                .findTopByPhoneIdOrderByPriceAscCrawledAtDesc(phoneId)
                .map(PriceRecordResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("가격 정보가 없습니다"));
    }

    public List<PriceRecordResponse> getLowestPriceHistory(Long phoneId) {
        phoneRepository.findById(phoneId)
                .orElseThrow(() -> new IllegalArgumentException("폰을 찾을 수 없습니다: " + phoneId));
        return priceRecordRepository
                .findLowestPriceByPhoneId(phoneId, PageRequest.of(0, 100))
                .stream().map(PriceRecordResponse::from).collect(Collectors.toList());
    }

    public List<PhoneResponse> searchPhones(String keyword) {
        return phoneRepository.findByModelNameContainingIgnoreCase(keyword)
                .stream().map(PhoneResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public WatchlistResponse addToWatchlist(Long userId, WatchlistRequest request) {
        Phone phone = phoneRepository.findById(request.getPhoneId())
                .orElseThrow(() -> new IllegalArgumentException("폰을 찾을 수 없습니다: " + request.getPhoneId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        UserWatchlist watchlist = UserWatchlist.builder()
                .user(user).phone(phone).targetPrice(request.getTargetPrice()).build();
        return WatchlistResponse.from(userWatchlistRepository.save(watchlist));
    }

    @Transactional
    public void removeFromWatchlist(Long userId, Long watchlistId) {
        UserWatchlist watchlist = userWatchlistRepository.findById(watchlistId)
                .orElseThrow(() -> new IllegalArgumentException("관심 목록을 찾을 수 없습니다: " + watchlistId));
        if (!watchlist.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 관심 목록만 삭제할 수 있습니다");
        }
        userWatchlistRepository.deleteById(watchlistId);
    }

    public List<WatchlistResponse> getWatchlistByUserId(Long userId) {
        return userWatchlistRepository.findByUserId(userId).stream()
                .map(item -> {
                    WatchlistResponse res = WatchlistResponse.from(item);
                    priceRecordRepository
                            .findTopByPhoneIdOrderByPriceAscCrawledAtDesc(item.getPhone().getId())
                            .ifPresent(r -> res.setCurrentPrice(r.getPrice()));
                    return res;
                }).collect(Collectors.toList());
    }
}
