export const renderAccentHeading = (text: string, accentWord: string) => {
  const idx = text.toLowerCase().indexOf(accentWord.toLowerCase());
  if (idx === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, idx)}
      <span className="text-brand-secondary">
        {text.slice(idx, idx + accentWord.length)}
      </span>
      {text.slice(idx + accentWord.length)}
    </>
  );
};
