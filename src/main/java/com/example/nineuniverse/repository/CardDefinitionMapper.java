package com.example.nineuniverse.repository;

import com.example.nineuniverse.domain.CardDefinition;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface CardDefinitionMapper {
	List<CardDefinition> findAll();

	CardDefinition findById(@Param("id") short id);
}
