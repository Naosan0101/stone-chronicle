package com.example.stonechronicle.repository;

import com.example.stonechronicle.domain.CardDefinition;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface CardDefinitionMapper {
	List<CardDefinition> findAll();

	CardDefinition findById(@Param("id") short id);
}
