package com.varminer.dashboard.controller;

import com.varminer.dashboard.dto.PrioritySetDto;
import com.varminer.dashboard.service.PrioritySetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class PrioritySetController {

    private final PrioritySetService prioritySetService;

    public PrioritySetController(PrioritySetService prioritySetService) {
        this.prioritySetService = prioritySetService;
    }

    @GetMapping("/priority-sets")
    public List<PrioritySetDto> list(@RequestParam(required = false) String timeframe) {
        return prioritySetService.findByTimeframe(timeframe);
    }

    @GetMapping("/priority-sets/{id}")
    public ResponseEntity<PrioritySetDto> get(@PathVariable Long id) {
        return prioritySetService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/priority-sets")
    public PrioritySetDto create(@RequestBody PrioritySetDto dto) {
        return prioritySetService.create(dto);
    }

    @PutMapping("/priority-sets/{id}")
    public ResponseEntity<PrioritySetDto> update(@PathVariable Long id, @RequestBody PrioritySetDto dto) {
        return prioritySetService.update(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/priority-sets/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return prioritySetService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
