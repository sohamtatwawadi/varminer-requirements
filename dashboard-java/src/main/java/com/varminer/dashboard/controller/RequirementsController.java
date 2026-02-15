package com.varminer.dashboard.controller;

import com.varminer.dashboard.model.KpiSummary;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.service.RequirementsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;
import java.util.Map;

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

    @GetMapping(value = "/requirements/export", produces = "text/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) String view) {
        List<Requirement> list = "q1".equalsIgnoreCase(view)
            ? requirementsService.getByQ1Release()
            : requirementsService.getAll();
        String csv = requirementsService.toCsv(list);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", "requirements.csv");
        return ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType("text/csv")).body(csv);
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

    @DeleteMapping("/requirements/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return requirementsService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/requirements/upload")
    public ResponseEntity<?> uploadCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().body(Map.of("error", "File must be a CSV"));
        }
        try {
            int count = requirementsService.importFromCsv(file.getInputStream());
            return ResponseEntity.ok(Map.of("imported", count));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse CSV: " + e.getMessage()));
        }
    }
}
