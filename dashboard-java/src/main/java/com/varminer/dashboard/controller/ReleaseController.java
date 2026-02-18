package com.varminer.dashboard.controller;

import com.varminer.dashboard.dto.ReleaseCommentDto;
import com.varminer.dashboard.dto.ReleaseDto;
import com.varminer.dashboard.service.ReleaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReleaseController {

    private final ReleaseService releaseService;

    public ReleaseController(ReleaseService releaseService) {
        this.releaseService = releaseService;
    }

    @GetMapping("/releases")
    public List<ReleaseDto> list() {
        return releaseService.findAll();
    }

    @GetMapping("/releases/upcoming")
    public List<ReleaseDto> upcoming() {
        return releaseService.findUpcoming();
    }

    @GetMapping("/releases/{id}")
    public ResponseEntity<ReleaseDto> get(@PathVariable Long id) {
        return releaseService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/releases")
    public ReleaseDto create(@RequestBody ReleaseDto dto) {
        return releaseService.create(dto);
    }

    @PutMapping("/releases/{id}")
    public ResponseEntity<ReleaseDto> update(@PathVariable Long id, @RequestBody ReleaseDto dto) {
        return releaseService.update(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/releases/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return releaseService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/releases/{id}/comments")
    public ResponseEntity<ReleaseCommentDto> addComment(
            @PathVariable Long id,
            Principal principal,
            @RequestBody Map<String, String> body
    ) {
        String author = principal != null ? principal.getName() : "anonymous";
        String commentBody = body != null && body.containsKey("body") ? body.get("body") : "";
        return releaseService.findById(id)
                .map(r -> ResponseEntity.ok(releaseService.addComment(id, author, commentBody)))
                .orElse(ResponseEntity.notFound().build());
    }
}
