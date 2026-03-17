export const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
};

export const shareContent = async ({ title, text, url }) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { shared: true, method: 'native' };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { shared: false, method: 'cancelled' };
      }
    }
  }

  const fallbackText = [title, text, url].filter(Boolean).join('\n');
  await copyText(fallbackText);
  return { shared: true, method: 'clipboard' };
};