import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BLOG_POSTS, formatBlogDate } from "@/config/blogs";
import { BRAND_NAME } from "@/config/brand";
import { typography } from "@/config/typography";

const BlogsPage = () => {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="space-y-6 mb-14">
              <h1
                className={`text-4xl lg:text-5xl leading-tight ${typography.title}`}
              >
                <span className="text-brand-secondary">Pottery</span>{" "}
                <span className="text-brand-primary">Blog &amp; Studio Notes</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl font-sans leading-relaxed">
                Stories from the {BRAND_NAME} studio — process, drops, workshops,
                and the everyday rituals behind handmade ceramics.
              </p>
            </div>

            <div className="space-y-6">
              {posts.map((post) => (
                <Card
                  key={post.slug}
                  className="shadow-card border border-border/50 hover:border-brand-secondary/30 transition-colors"
                >
                  <CardContent className="p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-[0.14em] text-brand-secondary font-sans font-semibold mb-2">
                      {post.series}
                    </p>
                    <h2
                      className={`text-xl sm:text-2xl text-brand-primary mb-2 ${typography.heading}`}
                    >
                      <Link
                        to={`/blogs/${post.slug}`}
                        className="hover:text-brand-secondary transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground font-sans leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                      <time
                        dateTime={post.publishedAt}
                        className="text-sm text-muted-foreground/80 font-sans"
                      >
                        {formatBlogDate(post.publishedAt)}
                      </time>
                      <Link
                        to={`/blogs/${post.slug}`}
                        className="text-sm font-sans font-medium text-brand-secondary hover:underline"
                      >
                        Read more
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogsPage;
