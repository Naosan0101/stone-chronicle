package com.example.stonechronicle.repository;

import com.example.stonechronicle.domain.Deck;
import java.util.List;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;

public interface DeckMapper {
	List<Deck> findByUserId(@Param("userId") long userId);

	Deck findByIdAndUserId(@Param("id") long id, @Param("userId") long userId);

	@Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
	int insert(Deck deck);

	int updateName(@Param("id") long id, @Param("userId") long userId, @Param("name") String name);

	int delete(@Param("id") long id, @Param("userId") long userId);
}
