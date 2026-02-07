package com.varminer.dashboard.controller;

import com.varminer.dashboard.model.KpiSummary;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.service.RequirementsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RequirementsController {

    private final RequirementsService requirementsService;

    public RequirementsController(RequirementsService requirementsService) {
        this.requirementsService = requirementsService;
    }

    @GetMapping("/requirements")
    public List<Requirement> getAll() {
        return requirementsService.getAll();
    }

    @GetMapping("/kpis")
    public KpiSummary getKpis() {
        return requirementsService.getKpiSummary();
    }

    @PostMapping("/requirements")
    public Requirement add(@Valid @RequestBody Requirement requirement) {
        return requirementsService.add(requirement);
    }

    @PutMapping("/requirements/{id}")
    public ResponseEntity<Requirement> update(@PathVariable String id, @RequestBody Requirement requirement) {
        return requirementsService.update(id, requirement)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
