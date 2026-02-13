/**
 * Inline script that runs before paint to prevent theme flash.
 * Must be in <head>; beforeInteractive from next/script is not supported in App Router.
 */
export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('adminator-theme');
            } catch (e) { var theme = null; }
            var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            var initial = theme === 'light' || theme === 'dark' ? theme : (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', initial);
          })();
        `,
      }}
    />
  );
}
