package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.PrioritySetItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrioritySetItemRepository extends JpaRepository<PrioritySetItemEntity, Long> {
    List<PrioritySetItemEntity> findByPrioritySetIdOrderBySortOrderAsc(Long prioritySetId);
    void deleteByPrioritySetId(Long prioritySetId);
}
