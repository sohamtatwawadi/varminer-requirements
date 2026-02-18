package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.ReleaseRequirementLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReleaseRequirementLinkRepository extends JpaRepository<ReleaseRequirementLinkEntity, Long> {
    List<ReleaseRequirementLinkEntity> findByReleaseId(Long releaseId);
}
