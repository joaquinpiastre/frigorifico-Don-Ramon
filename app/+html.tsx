import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#15120F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Don Ramón" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <ScrollViewStyleReset />
        <style
          id="donramon-root-flex"
          dangerouslySetInnerHTML={{
            __html: `
html{height:100%;display:flex;flex-direction:column}
body{flex:1;display:flex;flex-direction:column;margin:0;min-height:100vh}
#root{flex:1;display:flex;flex-direction:column;min-height:0;width:100%;min-height:100vh;box-sizing:border-box}
#root>div{flex:1;display:flex;flex-direction:column;min-height:100vh;width:100%;box-sizing:border-box}
`.replace(/\s+/g, ''),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
