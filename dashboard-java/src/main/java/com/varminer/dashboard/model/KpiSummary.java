package com.varminer.dashboard.model;

import java.util.Map;

public class KpiSummary {

    private int total;
    private Map<String, Integer> byStatus;

    public KpiSummary() {
    }

    public KpiSummary(int total, Map<String, Integer> byStatus) {
        this.total = total;
        this.byStatus = byStatus;
    }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public Map<String, Integer> getByStatus() { return byStatus; }
    public void setByStatus(Map<String, Integer> byStatus) { this.byStatus = byStatus; }
}
