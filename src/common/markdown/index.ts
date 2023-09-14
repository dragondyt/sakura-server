import MarkdownIt from 'markdown-it';
export const getMarkdownParser = () => {
  const markdownIt = MarkdownIt({});
  return (content: string) => markdownIt.render(content);
};
