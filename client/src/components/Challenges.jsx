import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from './UI/Buttons';
import { getChallenges, createChallenge, joinChallenge } from '../services/socialService';
import { shareContent } from '../utils/share';



const Container = styled.div`
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h3`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChallengeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ChallengeCard = styled.div`
  background: linear-gradient(135deg, ${props => {
    if (props.$type === 'cards_studied') return '#fef3c7 0%, #fde68a 100%';
    if (props.$type === 'tests_passed') return '#dbeafe 0%, #93c5fd 100%';
    if (props.$type === 'streak_days') return '#fee2e2 0%, #fca5a5 100%';
    return '#d1fae5 0%, #6ee7b7 100%';
  }});
  padding: 1.25rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.$highlighted ? '#2563eb' : 'transparent'};
  box-shadow: ${props => props.$highlighted ? '0 0 0 4px rgba(37, 99, 235, 0.14)' : 'none'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
`;

const SmallActionButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.45rem 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
  }
`;

const InlineHint = styled.div`
  margin-top: 0.75rem;
  font-size: 0.82rem;
  color: #1d4ed8;
  font-weight: 700;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  z-index: 1100;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
`;

const ChallengeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const ChallengeTitle = styled.h4`
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0;
`;

const ChallengeType = styled.span`
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
`;

const ChallengeDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 1rem;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: var(--bg-hover);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #10b981;
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.$progress}%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
`;

const Participants = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ParticipantAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border: 2px solid var(--bg-secondary);
  margin-left: -8px;
  
  &:first-child {
    margin-left: 0;
  }
`;

const ParticipantCount = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
`;

const TimeLeft = styled.div`
  font-size: 0.85rem;
  color: #92400e;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
  margin-top: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #a0aec0;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

function Challenges({ user, highlightChallengeId = null }) {
  const [challenges, setChallenges] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cards_studied',
    target: 50,
    endDate: '',
    isPublic: false
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const data = await getChallenges();
    setChallenges(data);
  };

  const handleCreate = async () => {
    setLoading(true);
    await createChallenge(formData);
    setLoading(false);
    setShowModal(false);
    loadChallenges();
  };

  const handleJoin = async (challengeId) => {
    await joinChallenge(challengeId);
    loadChallenges();
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleShare = async (challenge, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard?tab=friends&challenge=${challenge._id}`;
    const result = await shareContent({
      title: `Челлендж: ${challenge.title}`,
      text: `Присоединяйся к челленджу во FluffyCards: ${challenge.title}`,
      url
    });

    showToastMessage(result.method === 'clipboard' ? 'Ссылка на челлендж скопирована' : 'Челлендж готов к отправке');
  };

  const getChallengeTypeLabel = (type) => {
    const labels = {
      cards_studied: '📚 Карточки',
      tests_passed: '📝 Тесты',
      streak_days: '🔥 Серия',
      xp_earned: '⭐ XP'
    };
    return labels[type] || type;
  };

  const getTimeLeft = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `⏰ Осталось ${days} дней` : '⏰ Завершено';
  };

  return (
    <>
      <Container>
        <Header>
          <Title>🏆 Челленджи</Title>
          <PrimaryButton onClick={() => setShowModal(true)}>
            ➕ Создать
          </PrimaryButton>
        </Header>

        <ChallengeList>
          {challenges.length === 0 ? (
            <EmptyState>
              Нет активных челленджей.<br />
              Создайте первый челлендж!
            </EmptyState>
          ) : (
            challenges.map(challenge => {
              const userProgress = challenge.participants?.find(
                p => p.user?._id === user?._id
              );
              const progress = userProgress ? (userProgress.progress / challenge.target) * 100 : 0;
              const isParticipant = !!userProgress;

              return (
                <ChallengeCard 
                  key={challenge._id}
                  $type={challenge.type}
                  $highlighted={highlightChallengeId === challenge._id}
                  onClick={() => !isParticipant && handleJoin(challenge._id)}
                >
                  <ChallengeHeader>
                    <ChallengeTitle>{challenge.title}</ChallengeTitle>
                    <ChallengeType>{getChallengeTypeLabel(challenge.type)}</ChallengeType>
                  </ChallengeHeader>
                  
                  <ChallengeDescription>{challenge.description}</ChallengeDescription>
                  
                  {isParticipant && (
                    <>
                      <ProgressBar>
                        <ProgressFill $progress={Math.min(progress, 100)} />
                      </ProgressBar>
                      <ProgressInfo>
                        <span>{userProgress.progress} / {challenge.target}</span>
                        <span>{Math.round(progress)}%</span>
                      </ProgressInfo>
                    </>
                  )}

                  <Participants>
                    {challenge.participants?.slice(0, 5).map((p, idx) => (
                      <ParticipantAvatar key={idx}>
                        {p.user?.username?.[0] || '?'}
                      </ParticipantAvatar>
                    ))}
                    {challenge.participants?.length > 5 && (
                      <ParticipantCount>
                        +{challenge.participants.length - 5}
                      </ParticipantCount>
                    )}
                  </Participants>

                  <TimeLeft>{getTimeLeft(challenge.endDate)}</TimeLeft>

                  {highlightChallengeId === challenge._id && (
                    <InlineHint>Этот челлендж открыт по приглашению. Можно сразу вступить или переслать ссылку дальше.</InlineHint>
                  )}

                  <CardActions>
                    {!isParticipant && (
                      <SmallActionButton onClick={(e) => { e.stopPropagation(); handleJoin(challenge._id); }}>
                        ➕ Вступить
                      </SmallActionButton>
                    )}
                    <SmallActionButton onClick={(e) => handleShare(challenge, e)}>
                      🔗 Пригласить
                    </SmallActionButton>
                  </CardActions>
                </ChallengeCard>
              );
            })
          )}
        </ChallengeList>
      </Container>

      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>🏆 Создать челлендж</ModalTitle>
            
            <FormGroup>
              <Label>Название</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Например: Кто больше выучит за неделю"
              />
            </FormGroup>

            <FormGroup>
              <Label>Описание</Label>
              <TextArea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Опишите условия челленджа..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Тип</Label>
              <Select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="cards_studied">📚 Карточки изучить</option>
                <option value="tests_passed">📝 Тесты пройти</option>
                <option value="streak_days">🔥 Дней подряд</option>
                <option value="xp_earned">⭐ XP заработать</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Цель (количество)</Label>
              <Input
                type="number"
                value={formData.target}
                onChange={e => setFormData({...formData, target: parseInt(e.target.value)})}
              />
            </FormGroup>

            <FormGroup>
              <Label>Дата окончания</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                />
                {' '} Публичный челлендж (виден всем)
              </Label>
            </FormGroup>

            <ButtonGroup>
              <PrimaryButton 
                onClick={handleCreate}
                disabled={!formData.title || !formData.endDate || loading}
              >
                {loading ? 'Создание...' : 'Создать челлендж'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setShowModal(false)}>
                Отмена
              </SecondaryButton>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  );
}

export default Challenges;
