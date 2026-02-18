package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.PrioritySetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrioritySetRepository extends JpaRepository<PrioritySetEntity, Long> {
    List<PrioritySetEntity> findByTimeframeOrderByStartDateDesc(String timeframe);
    List<PrioritySetEntity> findByOrderByUpdatedAtDesc();
}
