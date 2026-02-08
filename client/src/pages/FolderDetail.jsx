import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 40px;
`;

const Header = styled.div`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 24px 32px;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  margin-bottom: 10px;

  &:hover { color: #63b3ed; }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  color: var(--text-secondary);
  margin: 0 0 12px 0;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  flex-wrap: wrap;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-width: 260px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const SetCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--shadow-color);
  border: 1px solid var(--border-light);
  position: relative;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }

  .preview {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    min-height: 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .preview-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
    margin-bottom: 10px;
  }

  .preview-term {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
  }

  .preview-definition {
    color: var(--text-secondary);
    font-size: 12px;
    margin-top: 4px;
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: var(--text-primary);
  }

  .meta {
    color: var(--text-secondary);
    font-size: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;

  &:hover { background: #fecaca; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
`;

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};

function FolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFolder = useCallback(async () => {
    try {
      setError(null);
      const res = await authFetch(`/api/folders/${id}`);
      if (!res.ok) throw new Error('Папка не найдена');
      const data = await res.json();
      setFolder(data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки папки');
    }
  }, [id]);

  const loadSets = useCallback(async () => {
    try {
      const res = await authFetch(API_ROUTES.DATA.SETS);
      if (!res.ok) throw new Error('Ошибка загрузки наборов');
      const data = await res.json();
      setUserSets(data || []);
    } catch (err) {
      setUserSets([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadFolder(), loadSets()]);
      setLoading(false);
    };
    load();
  }, [loadFolder, loadSets]);

  const handleAddSet = async () => {
    if (!selectedSetId) return;
    const res = await authFetch(`/api/folders/${id}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId: selectedSetId })
    });
    if (res.ok) {
      await loadFolder();
      setSelectedSetId('');
    }
  };

  const handleRemoveSet = async (setId) => {
    const res = await authFetch(`/api/folders/${id}/sets/${setId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      await loadFolder();
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Content>Загрузка...</Content>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Content>
          <EmptyState>😕 {error}</EmptyState>
          <Button onClick={() => navigate('/dashboard')}>Назад</Button>
        </Content>
      </PageContainer>
    );
  }

  const folderSets = folder?.sets || [];
  const availableSets = userSets.filter(set => !folderSets.some(fs => (fs._id || fs.id) === (set._id || set.id)));

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <BackButton onClick={() => navigate('/dashboard')}>← Назад</BackButton>
          <Title>{folder?.name || 'Папка'}</Title>
          {folder?.description && <Description>{folder.description}</Description>}
          <Meta>
            <span>📚 {folderSets.length} наборов</span>
            <span>•</span>
            <span>{folder?.isPublic ? '🌍 Публичная' : '🔒 Приватная'}</span>
          </Meta>
        </HeaderContent>
      </Header>

      <Content>
        <Controls>
          <Select value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)}>
            <option value="">Выберите набор для добавления</option>
            {availableSets.map(set => (
              <option key={set._id || set.id} value={set._id || set.id}>
                {set.title}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddSet} disabled={!selectedSetId}>Добавить в папку</Button>
        </Controls>

        {folderSets.length === 0 ? (
          <EmptyState>В папке пока нет наборов</EmptyState>
        ) : (
          <SetsGrid>
            {folderSets.map(set => (
              <SetCard key={set._id || set.id} onClick={() => navigate(`/sets/${set._id || set.id}`)}>
                <RemoveButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSet(set._id || set.id);
                  }}
                >
                  Удалить
                </RemoveButton>
                <div className="preview">
                  {set.coverImage && (
                    <img className="preview-image" src={resolveImageUrl(set.coverImage)} alt="cover" />
                  )}
                  {set.flashcards?.[0] ? (
                    <>
                      <div className="preview-term">{set.flashcards[0].term}</div>
                      <div className="preview-definition">{set.flashcards[0].definition}</div>
                    </>
                  ) : (
                    <div className="preview-definition" style={{ textAlign: 'center' }}>
                      Нет карточек
                    </div>
                  )}
                </div>
                <h3>{set.title}</h3>
                <div className="meta">
                  <span>📝 {set.flashcards?.length || 0} терминов</span>
                  <span>•</span>
                  <span>{set.isPublic ? '🌍 Публичный' : '🔒 Приватный'}</span>
                </div>
              </SetCard>
            ))}
          </SetsGrid>
        )}
      </Content>
    </PageContainer>
  );
}

export default FolderDetail;
