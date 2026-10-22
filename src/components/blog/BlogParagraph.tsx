import { renderAccentHeading } from "@/lib/blogRichText";

export const BlogRichParagraph = ({
  text,
  introduces,
}: {
  text: string;
  introduces?: string;
}) => {
  const introIndex =
    introduces !== undefined ? text.indexOf(introduces) : -1;

  return (
    <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
      {introIndex >= 0 ? (
        <>
          {text.slice(0, introIndex)}
          <strong className="font-semibold text-brand-primary">
            {introduces}
          </strong>
          {text.slice(introIndex + introduces!.length)}
        </>
      ) : (
        text
      )}
    </p>
  );
};

export const BlogAccentTitle = ({
  text,
  accentWord,
  className,
}: {
  text: string;
  accentWord: string;
  className?: string;
}) => (
  <h1 className={className}>{renderAccentHeading(text, accentWord)}</h1>
);

export const BlogAccentHeading = ({
  text,
  accentWord,
  className,
}: {
  text: string;
  accentWord: string;
  className?: string;
}) => (
  <h2 className={className}>{renderAccentHeading(text, accentWord)}</h2>
);
