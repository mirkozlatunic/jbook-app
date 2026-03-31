import { useEffect, useRef } from 'react';
import './preview.css';

interface PreviewProps {
  code: string;
  err: string;
}

const html = `
  <html>
    <head></head>
    <body>
      <div id="root"></div>
      <script>
        const handleError = (err) => {
          const root = document.querySelector('#root');
          root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>';
          console.error(err);
        }

        window.addEventListener('error', (event) => {
          event.preventDefault();
          handleError(event.error);
        });

        window.addEventListener('message', (event) => {
          try {
            if (!event.data) {
              document.querySelector('#root').innerHTML = 'ERROR: empty code received';
              return;
            }
            eval(event.data);
          } catch (err) {
            handleError(err);
          }
        }, false);
      </script>
    </body>
  </html>
`;

const Preview: React.FC<PreviewProps> = ({ code, err }) => {
  const iframe = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframeEl = iframe.current;
    if (!iframeEl) return;

    iframeEl.onload = () => {
      setTimeout(() => {
        iframeEl.contentWindow?.postMessage(code, '*');
      }, 50);
    };
    iframeEl.srcdoc = html;
  }, [code]);

  return (
    <div className="preview-wrapper">
      <iframe
        ref={iframe}
        sandbox="allow-scripts"
        title="Preview"
      />
      {err && <div className="preview-error">{err}</div>}
    </div>
  );
};

export default Preview;
