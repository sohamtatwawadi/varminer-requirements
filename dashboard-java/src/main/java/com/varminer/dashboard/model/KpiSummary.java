package com.varminer.dashboard.model;

import java.util.Map;

public class KpiSummary {

    private int total;
    private int notStarted;
    private int inDev;
    private int inUat;
    private int devCompleted;
    private int closed;
    private Map<String, Integer> byStatus;

    public KpiSummary() {
    }

    public KpiSummary(int total, int notStarted, int inDev, int inUat, int devCompleted, int closed, Map<String, Integer> byStatus) {
        this.total = total;
        this.notStarted = notStarted;
        this.inDev = inDev;
        this.inUat = inUat;
        this.devCompleted = devCompleted;
        this.closed = closed;
        this.byStatus = byStatus;
    }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public int getNotStarted() { return notStarted; }
    public void setNotStarted(int notStarted) { this.notStarted = notStarted; }
    public int getInDev() { return inDev; }
    public void setInDev(int inDev) { this.inDev = inDev; }
    public int getInUat() { return inUat; }
    public void setInUat(int inUat) { this.inUat = inUat; }
    public int getDevCompleted() { return devCompleted; }
    public void setDevCompleted(int devCompleted) { this.devCompleted = devCompleted; }
    public int getClosed() { return closed; }
    public void setClosed(int closed) { this.closed = closed; }
    public Map<String, Integer> getByStatus() { return byStatus; }
    public void setByStatus(Map<String, Integer> byStatus) { this.byStatus = byStatus; }
}
