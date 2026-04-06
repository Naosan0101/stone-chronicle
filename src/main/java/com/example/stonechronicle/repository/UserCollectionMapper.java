package com.example.stonechronicle.repository;

import com.example.stonechronicle.domain.UserCollectionRow;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface UserCollectionMapper {
	List<UserCollectionRow> findByUserId(@Param("userId") long userId);

	Integer findQuantity(@Param("userId") long userId, @Param("cardId") short cardId);

	int upsertAdd(@Param("userId") long userId, @Param("cardId") short cardId, @Param("delta") int delta);
}
