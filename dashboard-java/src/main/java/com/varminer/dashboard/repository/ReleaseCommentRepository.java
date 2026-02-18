package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.ReleaseCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReleaseCommentRepository extends JpaRepository<ReleaseCommentEntity, Long> {
    List<ReleaseCommentEntity> findByReleaseIdOrderByCreatedAtAsc(Long releaseId);
}
