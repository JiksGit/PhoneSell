package com.sungji.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_records", indexes = {
    @Index(name = "idx_price_records_phone_id", columnList = "phone_id"),
    @Index(name = "idx_price_records_crawled_at", columnList = "crawled_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phone_id", nullable = false)
    private Phone phone;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false, length = 50)
    private String source;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "crawled_at", updatable = false)
    private LocalDateTime crawledAt;

    @PrePersist
    protected void onCreate() {
        crawledAt = LocalDateTime.now();
    }
}
