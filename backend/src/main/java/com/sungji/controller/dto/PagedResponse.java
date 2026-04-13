package com.sungji.controller.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class PagedResponse<T> {
    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean hasNext;

    public PagedResponse(List<T> content, int page, int size, long totalElements) {
        this.content       = content;
        this.page          = page;
        this.size          = size;
        this.totalElements = totalElements;
        this.totalPages    = (int) Math.ceil((double) totalElements / size);
        this.hasNext       = page < this.totalPages - 1;
    }
}
