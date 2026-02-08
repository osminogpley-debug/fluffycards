import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_BASE_URL, FILE_BASE_URL, authFetch } from '../constants/api';
import { useAuth } from '../hooks/useAuth';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 32px 16px;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Logo = styled.div`
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  cursor: pointer;
  span { color: #63b3ed; }
`;

const ShareLabel = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #63b3ed22, #805ad522);
  border: 1px solid #63b3ed44;
  color: #63b3ed;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
`;

const CoverImage = styled.img`
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 24px;
`;

const SetTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px;

  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const SetMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const AuthorChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text-primary);
`;

const AuthorAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

const CardCount = styled.span`
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
`;

const PrimaryBtn = styled.button`
  padding: 12px 28px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #63b3ed, #805ad5);
  color: white;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    transform: none;
  }
`;

const SecondaryBtn = styled.button`
  padding: 12px 28px;
  border-radius: 12px;
  border: 2px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: #63b3ed;
  }
`;

const CardsSection = styled.div`
  margin-top: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const CardItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 8px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const CardSide = styled.div`
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
`;

const CardDivider = styled.div`
  width: 2px;
  background: var(--border-light);
  border-radius: 1px;

  @media (max-width: 600px) {
    width: 100%;
    height: 1px;
  }
`;

const CardImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const LoadingWrapper = styled.div`
  text-align: center;
  padding: 80px 16px;
  font-size: 18px;
  color: var(--text-secondary);
`;

const ErrorWrapper = styled.div`
  text-align: center;
  padding: 80px 16px;

  h2 {
    font-size: 28px;
    margin-bottom: 12px;
  }

  p {
    color: var(--text-secondary);
    font-size: 16px;
    margin-bottom: 24px;
  }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #22c55e;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  z-index: 9999;
  animation: fadeInUp 0.3s ease;

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${FILE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function SharedSetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchSharedSet = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/sets/share/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Набор не найден');
        }
        const data = await res.json();
        setSetData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedSet();
  }, [id]);

  const handleCopy = async () => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }
    setCopying(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/sets/${id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const copied = await res.json();
        setToast('Набор скопирован в вашу библиотеку!');
        setTimeout(() => {
          setToast('');
          navigate(`/sets/${copied._id}`);
        }, 1500);
      } else {
        const err = await res.json();
        setToast(err.message || 'Ошибка копирования');
        setTimeout(() => setToast(''), 2500);
      }
    } catch {
      setToast('Ошибка сети');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setCopying(false);
    }
  };

  const handleStudy = () => {
    if (authState.isAuthenticated) {
      navigate(`/sets/${id}`);
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingWrapper>⏳ Загрузка набора...</LoadingWrapper>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <ErrorWrapper>
            <h2>😕 Набор недоступен</h2>
            <p>{error}</p>
            <SecondaryBtn onClick={() => navigate('/')}>На главную</SecondaryBtn>
          </ErrorWrapper>
        </Container>
      </PageWrapper>
    );
  }

  const cards = setData.cards || [];
  const ownerName = setData.owner?.username || 'Пользователь';
  const ownerAvatar = setData.owner?.profileImage
    ? resolveImageUrl(setData.owner.profileImage)
    : null;

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Logo onClick={() => navigate('/')}>
            Fluffy<span>Cards</span> 🐾
          </Logo>
          <ShareLabel>🔗 Вам поделились набором</ShareLabel>
        </Header>

        {setData.coverImage && (
          <CoverImage
            src={resolveImageUrl(setData.coverImage)}
            alt={setData.title}
          />
        )}

        <SetTitle>{setData.title}</SetTitle>

        <SetMeta>
          <AuthorChip>
            {ownerAvatar && <AuthorAvatar src={ownerAvatar} alt="" />}
            {ownerName}
          </AuthorChip>
          <CardCount>📚 {cards.length} карт</CardCount>
          {setData.description && <span>{setData.description}</span>}
        </SetMeta>

        <ButtonRow>
          <PrimaryBtn onClick={handleCopy} disabled={copying}>
            {copying ? '⏳ Копирование...' : '📥 Добавить к себе'}
          </PrimaryBtn>
          <SecondaryBtn onClick={handleStudy}>
            📖 Учить
          </SecondaryBtn>
        </ButtonRow>

        <CardsSection>
          <SectionTitle>Карточки ({cards.length})</SectionTitle>
          {cards.map((card, i) => (
            <CardItem key={card._id || i}>
              <CardSide>
                {card.image && (
                  <CardImage src={resolveImageUrl(card.image)} alt="" />
                )}
                {card.term}
              </CardSide>
              <CardDivider />
              <CardSide>{card.definition}</CardSide>
            </CardItem>
          ))}
        </CardsSection>
      </Container>

      {toast && <Toast>{toast}</Toast>}
    </PageWrapper>
  );
}
