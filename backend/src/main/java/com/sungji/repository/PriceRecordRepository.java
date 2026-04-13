package com.sungji.repository;

import com.sungji.entity.PriceRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceRecordRepository extends JpaRepository<PriceRecord, Long> {

    List<PriceRecord> findByPhoneIdOrderByCrawledAtDesc(Long phoneId, Pageable pageable);

    @Query("SELECT pr FROM PriceRecord pr WHERE pr.phone.id = :phoneId ORDER BY pr.price ASC, pr.crawledAt DESC")
    List<PriceRecord> findLowestPriceByPhoneId(@Param("phoneId") Long phoneId, Pageable pageable);

    Optional<PriceRecord> findTopByPhoneIdOrderByPriceAscCrawledAtDesc(Long phoneId);

    @Query("SELECT pr FROM PriceRecord pr WHERE pr.phone.id = :phoneId AND pr.source = :source ORDER BY pr.crawledAt DESC")
    List<PriceRecord> findLatestByPhoneIdAndSource(@Param("phoneId") Long phoneId, @Param("source") String source, Pageable pageable);

    boolean existsBySourceUrl(String sourceUrl);

    // ─── 최신순 (필터 지원) ──────────────────────────────────────

    @Query("""
        SELECT pr FROM PriceRecord pr JOIN FETCH pr.phone p
        WHERE (:brand IS NULL OR p.brand = :brand)
          AND (:minPrice IS NULL OR pr.price >= :minPrice)
          AND (:maxPrice IS NULL OR pr.price <= :maxPrice)
        ORDER BY pr.crawledAt DESC
        """)
    List<PriceRecord> findRecentDealsFiltered(
            @Param("brand") String brand,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            Pageable pageable);

    @Query("""
        SELECT COUNT(pr) FROM PriceRecord pr JOIN pr.phone p
        WHERE (:brand IS NULL OR p.brand = :brand)
          AND (:minPrice IS NULL OR pr.price >= :minPrice)
          AND (:maxPrice IS NULL OR pr.price <= :maxPrice)
        """)
    long countDealsFiltered(
            @Param("brand") String brand,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice);

    // ─── 가격 낮은 순 (필터 지원) ────────────────────────────────

    @Query("""
        SELECT pr FROM PriceRecord pr JOIN FETCH pr.phone p
        WHERE (:brand IS NULL OR p.brand = :brand)
          AND (:minPrice IS NULL OR pr.price >= :minPrice)
          AND (:maxPrice IS NULL OR pr.price <= :maxPrice)
        ORDER BY pr.price ASC, pr.crawledAt DESC
        """)
    List<PriceRecord> findDealsOrderByPriceFiltered(
            @Param("brand") String brand,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            Pageable pageable);

    // 전체 수 (페이지 계산용, 필터 없음)
    @Query("SELECT COUNT(pr) FROM PriceRecord pr")
    long countAllDeals();
}
