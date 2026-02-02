import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from './UI/Buttons';
import { 
  getComments, 
  addComment, 
  deleteComment,
  getRating,
  rateSet,
  shareSet
} from '../services/socialService';



const Container = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #2d3748;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RatingSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const RatingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RatingValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #f59e0b;
`;

const RatingDetails = styled.div``;

const RatingCount = styled.div`
  color: #718096;
  font-size: 0.9rem;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.25rem;
  font-size: 1.5rem;
`;

const Star = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.5rem;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const ShareSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const ShareLink = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const LinkInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9rem;
  background: #f7fafc;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const CommentsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const CommentForm = styled.div`
  margin-bottom: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentItem = styled.div`
  padding: 1rem;
  background: #f7fafc;
  border-radius: 12px;
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const CommentAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AuthorAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #2d3748;
`;

const CommentDate = styled.span`
  color: #a0aec0;
  font-size: 0.85rem;
`;

const CommentText = styled.p`
  color: #4a5568;
  line-height: 1.5;
  margin: 0;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #fc8181;
  cursor: pointer;
  font-size: 0.85rem;
  
  &:hover {
    color: #f56565;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #a0aec0;
`;

function SocialFeatures({ setId, isOwner, user }) {
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [setId]);

  const loadData = async () => {
    setLoading(true);
    const [commentsData, ratingData] = await Promise.all([
      getComments(setId),
      getRating(setId)
    ]);
    setComments(commentsData);
    setRating(ratingData);
    setLoading(false);
  };

  const handleRate = async (rating) => {
    setUserRating(rating);
    await rateSet(setId, rating);
    loadData();
  };

  const handleShare = async () => {
    const result = await shareSet(setId, true);
    if (result?.data?.shareLink) {
      setShareLink(result.data.shareLink);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    await addComment(setId, commentText);
    setCommentText('');
    loadData();
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    loadData();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Ссылка скопирована!');
  };

  return (
    <Container>
      <RatingSection>
        <RatingInfo>
          <RatingValue>{rating.average}</RatingValue>
          <RatingDetails>
            <StarRating>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star}
                  onClick={() => handleRate(star)}
                  style={{ 
                    opacity: star <= userRating ? 1 : 0.3,
                    color: '#f59e0b'
                  }}
                >
                  ⭐
                </Star>
              ))}
            </StarRating>
            <RatingCount>{rating.count} оценок</RatingCount>
          </RatingDetails>
        </RatingInfo>
        
        {isOwner && (
          <PrimaryButton onClick={handleShare}>
            🔗 Поделиться набором
          </PrimaryButton>
        )}
      </RatingSection>

      {shareLink && (
        <ShareSection>
          <h4>Ссылка для sharing:</h4>
          <ShareLink>
            <LinkInput value={shareLink} readOnly />
            <SecondaryButton onClick={copyToClipboard}>
              📋 Копировать
            </SecondaryButton>
          </ShareLink>
        </ShareSection>
      )}

      <CommentsSection>
        <SectionTitle>💬 Комментарии ({comments.length})</SectionTitle>
        
        {user && (
          <CommentForm>
            <TextArea
              placeholder="Напишите комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <PrimaryButton 
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                Отправить
              </PrimaryButton>
            </div>
          </CommentForm>
        )}

        <CommentList>
          {comments.length === 0 ? (
            <EmptyState>
              Пока нет комментариев. Будьте первым!
            </EmptyState>
          ) : (
            comments.map(comment => (
              <CommentItem key={comment._id}>
                <CommentHeader>
                  <CommentAuthor>
                    <AuthorAvatar>👤</AuthorAvatar>
                    <AuthorName>{comment.userId?.username || 'Пользователь'}</AuthorName>
                  </CommentAuthor>
                  <div>
                    <CommentDate>
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                    </CommentDate>
                    {user && comment.userId?._id === user._id && (
                      <DeleteButton onClick={() => handleDeleteComment(comment._id)}>
                        Удалить
                      </DeleteButton>
                    )}
                  </div>
                </CommentHeader>
                <CommentText>{comment.text}</CommentText>
              </CommentItem>
            ))
          )}
        </CommentList>
      </CommentsSection>
    </Container>
  );
}

export default SocialFeatures;
