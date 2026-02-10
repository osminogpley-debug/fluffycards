import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SearchBar from '../components/Library/SearchBar';
import SetCard from '../components/Library/SetCard';
import MergeSetsModal from '../components/Library/MergeSetsModal';
import { API_ROUTES, authFetch } from '../constants/api';
import useAuth from '../hooks/useAuth';



// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-primary);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  transition: opacity 0.3s ease;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  &::before, &::after {
    content: '📚';
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const SearchSection = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px var(--shadow-color);
`;

const FiltersSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
`;

const CategorySelect = styled.select`
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  padding: 4px;
`;

const FilterInput = styled.input`
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;
  padding: 4px 2px;
  min-width: 140px;

  &::placeholder {
    color: var(--text-muted);
    font-weight: 500;
  }
`;

const SortButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' : 'var(--bg-secondary)'};
  color: ${props => props.$active ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${props => props.$active ? '#63b3ed' : 'var(--border-color)'};
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.2);
  }
`;

const ClearFiltersButton = styled.button`
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }
`;

const MergeButton = styled.button`
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
  margin-left: auto;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const ActiveFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem auto 0;
  max-width: 1200px;
`;

const FilterChip = styled.button`
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }
`;

const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  transition: all 0.8s ease;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  grid-column: 1 / -1;
`;

const EmptyIcon = styled.div`
  font-size: 5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

// New styled components for empty library state
const EmptyLibraryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  transition: all 0.8s ease;
`;

const PlantIcon = styled.div`
  font-size: 6rem;
  margin-bottom: 2rem;
  transition: transform 0.2s ease;
`;

const EmptyLibraryTitle = styled.h2`
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-weight: 700;
`;

const EmptyLibraryText = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 500px;
  line-height: 1.6;
`;

const SeoHiddenText = styled.p`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const CreateSetButton = styled.button`
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.4);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: #63b3ed;
  border-radius: 50%;
  animation: none;
  margin: 3rem auto;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  grid-column: 1 / -1;
`;

const LoadingText = styled.p`
  color: var(--text-secondary);
  margin-top: 1rem;
  font-size: 1.1rem;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  padding: 1.5rem;
`;

const PageButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' : 'var(--bg-secondary)'};
  color: ${props => props.$active ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${props => props.$active ? '#63b3ed' : 'var(--border-color)'};
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.2);
  }
`;

const PageInfo = styled.span`
  color: var(--text-secondary);
  font-size: 0.95rem;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  background: var(--bg-secondary);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(99, 179, 237, 0.15);
  }
`;

const StatIcon = styled.span`
  font-size: 1.5rem;
`;

const StatValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const StatLabel = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const Toast = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: opacity 0.3s ease;
  z-index: 1000;
`;

// Categories list
const categories = ['Все', 'Языки', 'Наука', 'История', 'Математика', 'Искусство', 'Технологии', 'Литература'];
const languageOptions = ['Все', 'Английский', 'Испанский', 'Французский', 'Немецкий', 'Китайский', 'Японский', 'Корейский', 'Русский', 'Итальянский'];
const levelOptions = ['Все', 'Начинающий', 'Средний', 'Продвинутый', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const examOptions = ['Все', 'ЕГЭ', 'ОГЭ', 'TOEFL', 'IELTS', 'HSK', 'JLPT', 'DELF', 'SAT', 'GRE'];

function PublicLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedLanguage, setSelectedLanguage] = useState('Все');
  const [selectedLevel, setSelectedLevel] = useState('Все');
  const [selectedExam, setSelectedExam] = useState('Все');
  const [selectedTag, setSelectedTag] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, new, alphabetical
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSets, setTotalSets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [userSets, setUserSets] = useState([]);
  
  const itemsPerPage = 6;
  const loaderRef = useRef(null);

  // Вычисляем статистику на основе реальных данных
  const stats = React.useMemo(() => {
    const totalCards = sets.reduce((sum, set) => sum + (set.flashcards?.length || 0), 0);
    const uniqueAuthors = new Set(sets.map(set => set.owner?._id?.toString()).filter(Boolean)).size;
    return { totalCards, uniqueAuthors };
  }, [sets]);

  // Debounce tag input to avoid excessive requests
  useEffect(() => {
    const handle = setTimeout(() => {
      setSelectedTag(tagInput.trim());
    }, 300);

    return () => clearTimeout(handle);
  }, [tagInput]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLanguage, selectedLevel, selectedExam, selectedTag, sortBy]);

  const loadSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory !== 'Все') params.set('category', selectedCategory);
      if (selectedLanguage !== 'Все') params.set('language', selectedLanguage);
      if (selectedLevel !== 'Все') params.set('level', selectedLevel);
      if (selectedExam !== 'Все') params.set('exam', selectedExam);
      if (selectedTag) params.set('tags', selectedTag);
      params.set('sort', sortBy);
      params.set('page', currentPage.toString());
      params.set('limit', itemsPerPage.toString());

      const apiUrl = `${API_ROUTES.DATA.SETS}/public?${params.toString()}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success) {
        setSets(result.data || []);
        setTotalSets(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        setSets([]);
        setTotalSets(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading public sets:', error);
      setSets([]);
      setTotalSets(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLanguage, selectedLevel, selectedExam, selectedTag, sortBy, currentPage, itemsPerPage]);

  const loadUserSets = useCallback(async () => {
    if (!user) {
      setUserSets([]);
      return;
    }
    try {
      const res = await authFetch(API_ROUTES.DATA.SETS);
      if (!res.ok) throw new Error('Не удалось загрузить ваши наборы');
      const data = await res.json();
      setUserSets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading user sets:', error);
      setUserSets([]);
    }
  }, [user]);

  // Load public sets from API
  useEffect(() => {
    loadSets();
  }, [loadSets]);

  useEffect(() => {
    if (isMergeModalOpen) {
      loadUserSets();
    }
  }, [isMergeModalOpen, loadUserSets]);

  const handleMerge = (mergedData) => {
    const mergedTitle = mergedData?.title || mergedData?.name || 'новый набор';
    setToastMessage(`🔀 Наборы объединены в "${mergedTitle}"!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveSet = (savedSet) => {
    setToastMessage(`✅ Набор "${savedSet.title}" сохранен в вашу библиотеку!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCreateSet = () => {
    navigate('/dashboard');
  };

  const handleOpenMerge = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsMergeModalOpen(true);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCategory !== 'Все' ||
    selectedLanguage !== 'Все' ||
    selectedLevel !== 'Все' ||
    selectedExam !== 'Все' ||
    selectedTag
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Все');
    setSelectedLanguage('Все');
    setSelectedLevel('Все');
    setSelectedExam('Все');
    setTagInput('');
    setSelectedTag('');
  };

  // Empty library state
  const renderEmptyLibrary = () => (
    <EmptyLibraryContainer>
      <PlantIcon>🌱</PlantIcon>
      <EmptyLibraryTitle>Публичная библиотека пока пуста</EmptyLibraryTitle>
      <EmptyLibraryText>
        Станьте первым! Создайте набор и поделитесь им с сообществом. 
        Ваши знания могут помочь тысячам других учеников! 📚✨
      </EmptyLibraryText>
      <CreateSetButton onClick={handleCreateSet}>
        <span>➕</span>
        Создать набор
      </CreateSetButton>
    </EmptyLibraryContainer>
  );

  return (
    <PageContainer>
      <Helmet>
        <title>Публичная библиотека наборов — FluffyCards</title>
        <meta
          name="description"
          content="Публичная библиотека наборов флеш-карточек. Ищите, изучайте и сохраняйте наборы для обучения."
        />
        <link rel="canonical" href="https://fluffycards.ru/library" />
        <meta property="og:title" content="Публичная библиотека — FluffyCards" />
        <meta property="og:description" content="Наборы флеш-карточек для обучения и практики." />
        <meta property="og:url" content="https://fluffycards.ru/library" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://fluffycards.ru/logo192.png" />
      </Helmet>
      <SeoHiddenText>
        Публичные наборы флеш-карточек по языкам, экзаменам и школьным предметам.
      </SeoHiddenText>
      <Header>
        <Title>Публичная библиотека</Title>
        <Subtitle>
          Откройте для себя тысячи наборов карточек, созданных сообществом! 🌟
        </Subtitle>

        <StatsBar>
          <StatItem>
            <StatIcon>📚</StatIcon>
            <div>
              <StatValue>{totalSets.toLocaleString()}</StatValue>
              <StatLabel>наборов</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>👥</StatIcon>
            <div>
              <StatValue>{stats.uniqueAuthors}</StatValue>
              <StatLabel>авторов</StatLabel>
            </div>
          </StatItem>
          <StatItem>
            <StatIcon>🎯</StatIcon>
            <div>
              <StatValue>{stats.totalCards.toLocaleString()}</StatValue>
              <StatLabel>карточек</StatLabel>
            </div>
          </StatItem>
        </StatsBar>
      </Header>

      <ControlsContainer>
        <SearchSection>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Ищите по названию, теме или тегу..."
          />
        </SearchSection>

        <FiltersSection>
          <FilterGroup>
            <FilterLabel>🏷️ Категория:</FilterLabel>
            <CategorySelect 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </CategorySelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>🌍 Язык:</FilterLabel>
            <CategorySelect
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {languageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </CategorySelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>📈 Уровень:</FilterLabel>
            <CategorySelect
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levelOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </CategorySelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>🎓 Экзамен:</FilterLabel>
            <CategorySelect
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              {examOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </CategorySelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>🔖 Тег:</FilterLabel>
            <FilterInput
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Введите тег"
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>📊 Сортировка:</FilterLabel>
            <SortButton 
              $active={sortBy === 'popular'}
              onClick={() => setSortBy('popular')}
            >
              🔥 Популярные
            </SortButton>
            <SortButton 
              $active={sortBy === 'new'}
              onClick={() => setSortBy('new')}
            >
              🆕 Новые
            </SortButton>
            <SortButton 
              $active={sortBy === 'alphabetical'}
              onClick={() => setSortBy('alphabetical')}
            >
              🔤 A-Z
            </SortButton>
          </FilterGroup>

          {hasActiveFilters && (
            <ClearFiltersButton onClick={clearAllFilters}>
              ✨ Сбросить фильтры
            </ClearFiltersButton>
          )}

          <MergeButton onClick={handleOpenMerge}>
            🔀 Объединить наборы
          </MergeButton>
        </FiltersSection>

        {hasActiveFilters && (
          <ActiveFilters>
            {searchQuery && (
              <FilterChip onClick={() => setSearchQuery('')}>
                🔍 {searchQuery} ×
              </FilterChip>
            )}
            {selectedCategory !== 'Все' && (
              <FilterChip onClick={() => setSelectedCategory('Все')}>
                🏷️ {selectedCategory} ×
              </FilterChip>
            )}
            {selectedLanguage !== 'Все' && (
              <FilterChip onClick={() => setSelectedLanguage('Все')}>
                🌍 {selectedLanguage} ×
              </FilterChip>
            )}
            {selectedLevel !== 'Все' && (
              <FilterChip onClick={() => setSelectedLevel('Все')}>
                📈 {selectedLevel} ×
              </FilterChip>
            )}
            {selectedExam !== 'Все' && (
              <FilterChip onClick={() => setSelectedExam('Все')}>
                🎓 {selectedExam} ×
              </FilterChip>
            )}
            {selectedTag && (
              <FilterChip onClick={() => { setTagInput(''); setSelectedTag(''); }}>
                🔖 {selectedTag} ×
              </FilterChip>
            )}
          </ActiveFilters>
        )}
      </ControlsContainer>

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Загружаем библиотеку... ✨</LoadingText>
        </LoadingContainer>
      ) : totalSets === 0 && !hasActiveFilters ? (
        renderEmptyLibrary()
      ) : (
        <>
          <SetsGrid>
            {sets.length > 0 ? (
              sets.map((set, index) => (
                <SetCard
                  key={set._id}
                  set={set}
                  isPopular={set.popularity > 90 && index < 3}
                  onSave={handleSaveSet}
                  showSaveButton={true}
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))
            ) : (
              <EmptyState>
                <EmptyIcon>🔍</EmptyIcon>
                <EmptyTitle>Ничего не найдено</EmptyTitle>
                <p>Попробуйте изменить поисковый запрос или фильтры 🌈</p>
              </EmptyState>
            )}
          </SetsGrid>

          {totalPages > 1 && (
            <PaginationContainer>
              <PageButton 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                $disabled={currentPage === 1}
              >
                ◀
              </PageButton>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PageButton
                  key={page}
                  $active={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              ))}
              
              <PageButton 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                $disabled={currentPage === totalPages}
              >
                ▶
              </PageButton>
              
              <PageInfo>
                Страница {currentPage} из {totalPages}
              </PageInfo>
            </PaginationContainer>
          )}
        </>
      )}

      <div ref={loaderRef} style={{ height: '20px' }} />

      <MergeSetsModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        userSets={userSets}
        onMerge={handleMerge}
      />

      {showToast && (
        <Toast>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          {toastMessage}
        </Toast>
      )}
    </PageContainer>
  );
}

export default PublicLibrary;
