import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatBlogDate, getBlogPost } from "@/config/blogs";
import { typography } from "@/config/typography";
import {
  BlogAccentHeading,
  BlogAccentTitle,
  BlogRichParagraph,
} from "@/components/blog/BlogParagraph";
import { ArrowLeft } from "lucide-react";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : null;

  if (!post) {
    return <Navigate to="/blogs" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <article className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl lg:max-w-6xl">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-primary transition-colors font-sans mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>

            <header className="space-y-4 mb-10 pb-8 border-b border-border/50 max-w-5xl">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-secondary font-sans font-semibold">
                {post.series}
              </p>
              <BlogAccentTitle
                text={post.title}
                accentWord={post.titleAccentWord}
                className={`text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-brand-primary ${typography.title}`}
              />
              <time
                dateTime={post.publishedAt}
                className="block text-sm text-muted-foreground font-sans"
              >
                {formatBlogDate(post.publishedAt)}
              </time>
            </header>

            <div className="space-y-6 max-w-5xl">
              {post.blocks.map((block, index) =>
                block.type === "heading" ? (
                  <BlogAccentHeading
                    key={index}
                    text={block.text}
                    accentWord={block.accentWord}
                    className={`text-[25px] sm:text-[29px] text-brand-primary pt-4 ${typography.heading}`}
                  />
                ) : (
                  <BlogRichParagraph
                    key={index}
                    text={block.text}
                    introduces={block.introduces}
                  />
                ),
              )}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
