package com.varminer.dashboard.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PrioritySetDto {
    private Long id;
    private String name;
    private String timeframe;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<PrioritySetItemDto> items = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTimeframe() { return timeframe; }
    public void setTimeframe(String timeframe) { this.timeframe = timeframe; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<PrioritySetItemDto> getItems() { return items; }
    public void setItems(List<PrioritySetItemDto> items) { this.items = items; }
}
