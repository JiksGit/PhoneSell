package com.sungji.controller;

import com.sungji.controller.dto.*;
import com.sungji.service.PhoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhoneController {

    private final PhoneService phoneService;

    @GetMapping("/phones")
    public ResponseEntity<ApiResponse<List<PhoneResponse>>> getAllPhones() {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.getAllPhones()));
    }

    /** 최신순 핫딜 — 브랜드·가격 범위 필터 */
    @GetMapping("/prices/recent")
    public ResponseEntity<ApiResponse<PagedResponse<PriceRecordResponse>>> getRecentDeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice) {
        return ResponseEntity.ok(ApiResponse.ok(
                phoneService.getRecentDeals(page, size, brand, minPrice, maxPrice)));
    }

    /** 가격 낮은 순 핫딜 — 브랜드·가격 범위 필터 */
    @GetMapping("/prices/lowest")
    public ResponseEntity<ApiResponse<PagedResponse<PriceRecordResponse>>> getLowestDeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice) {
        return ResponseEntity.ok(ApiResponse.ok(
                phoneService.getLowestDeals(page, size, brand, minPrice, maxPrice)));
    }

    @GetMapping("/phones/{id}/prices")
    public ResponseEntity<ApiResponse<List<PriceRecordResponse>>> getPriceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.getPriceHistory(id)));
    }

    @GetMapping("/phones/{id}/prices/latest")
    public ResponseEntity<ApiResponse<PriceRecordResponse>> getLatestLowestPrice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.getLatestLowestPrice(id)));
    }

    @GetMapping("/phones/{id}/prices/lowest")
    public ResponseEntity<ApiResponse<List<PriceRecordResponse>>> getLowestPriceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.getLowestPriceHistory(id)));
    }

    @GetMapping("/phones/search")
    public ResponseEntity<ApiResponse<List<PhoneResponse>>> searchPhones(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.searchPhones(keyword)));
    }

    @PostMapping("/watchlist")
    public ResponseEntity<ApiResponse<WatchlistResponse>> addToWatchlist(
            @Valid @RequestBody WatchlistRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.addToWatchlist(currentUserId(), request)));
    }

    @DeleteMapping("/watchlist/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFromWatchlist(@PathVariable Long id) {
        phoneService.removeFromWatchlist(currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/watchlist")
    public ResponseEntity<ApiResponse<List<WatchlistResponse>>> getWatchlist() {
        return ResponseEntity.ok(ApiResponse.ok(phoneService.getWatchlistByUserId(currentUserId())));
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getDetails();
    }
}
