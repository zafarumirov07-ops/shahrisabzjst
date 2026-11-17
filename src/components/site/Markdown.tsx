import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Markdown matnni xavfsiz ko'rsatadi (xom HTML ruxsat etilmaydi). */
export default function Markdown({ children }: { children: string }) {
  if (!children?.trim()) return null;
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
              {c}
            </a>
          ),
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
