package com.varminer.dashboard.controller;

import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.service.DashboardService;
import com.varminer.dashboard.service.RequirementsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Executive dashboard summary and roadmap (month-wise).
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class DashboardController {

    private final DashboardService dashboardService;
    private final RequirementsService requirementsService;

    public DashboardController(DashboardService dashboardService, RequirementsService requirementsService) {
        this.dashboardService = dashboardService;
        this.requirementsService = requirementsService;
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> summary() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("thisMonthShipments", dashboardService.getThisMonthShipments());
        out.put("nextReleaseCountdown", dashboardService.getNextReleaseCountdown());
        out.put("top5Priorities", dashboardService.getTop5Priorities());
        out.put("openActionItems", dashboardService.getOpenActionItems());
        return out;
    }

    /**
     * Roadmap by quarter: ?quarter=Q1&year=2026.
     * Returns requirements grouped by release_month (YYYY-MM). Months for Q1: 01, 02, 03.
     */
    @GetMapping("/roadmap")
    public Map<String, Object> roadmap(
            @RequestParam(defaultValue = "Q1") String quarter,
            @RequestParam(defaultValue = "2026") int year
    ) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("quarter", quarter);
        result.put("year", year);
        result.put("byMonth", requirementsService.getRoadmapByMonth(quarter, year));
        return result;
    }
}
